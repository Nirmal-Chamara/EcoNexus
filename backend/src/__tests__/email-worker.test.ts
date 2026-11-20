import { pool } from '../config/database';
import { processEmailBatch } from '../services/email-worker.service';
import { encryptMail } from '../services/mail-payload.service';
import {
  sendTransactionalEmail,
  MailDeliveryError,
} from '../services/email.service';
import { hashSha256 } from '../utils/crypto';

jest.mock('../config/database', () => ({
  pool: { connect: jest.fn(), query: jest.fn() },
}));
jest.mock('../config/env', () => ({
  env: { EMAIL_OUTBOX_KEY: '1'.repeat(64) },
}));
jest.mock('../services/email.service', () => ({
  ...jest.requireActual('../services/email.service'),
  sendTransactionalEmail: jest.fn(),
}));
let job: {
  id: string;
  user_id: string;
  purpose: string;
  challenge_hash: string;
  provider: string;
  payload: ReturnType<typeof encryptMail>;
  attempts: number;
};
let eligible: boolean;
beforeEach(() => {
  jest.clearAllMocks();
  eligible = true;
  const payload = {
    email: 'user@econexus.test',
    token: 'a'.repeat(64),
    purpose: 'VERIFY_EMAIL' as const,
    link: 'https://app.econexus.test/verify-email',
    subject: 'Frozen subject',
    text: 'Frozen body',
    from: 'account@econexus.test',
  };
  job = {
    id: 'job-id',
    user_id: 'user-id',
    purpose: payload.purpose,
    challenge_hash: hashSha256(payload.token),
    provider: 'resend',
    payload: encryptMail('job-id', payload),
    attempts: 1,
  };
  jest
    .mocked(pool.connect)
    .mockResolvedValue({
      query: jest.fn(async (sql: string) => ({
        rows: sql.includes('WITH candidates') ? [job] : [],
      })),
      release: jest.fn(),
    } as never);
  jest
    .mocked(pool.query)
    .mockImplementation(
      async (sql: unknown) =>
        ({
          rows:
            String(sql).startsWith('SELECT t.user_id') && eligible
              ? [{ user_id: job.user_id }]
              : [],
        }) as never
    );
  jest.mocked(sendTransactionalEmail).mockResolvedValue('provider-id');
});
it('claims with row locking and records provider acceptance while erasing the encrypted payload', async () => {
  expect(await processEmailBatch()).toBe(1);
  expect(sendTransactionalEmail).toHaveBeenCalledWith(
    'resend',
    job.id,
    'user@econexus.test',
    'Frozen subject',
    'Frozen body',
    'account@econexus.test'
  );
  expect(pool.query).toHaveBeenCalledWith(
    expect.stringContaining("status = 'SENT'"),
    ['provider-id', job.id, 1]
  );
});
it('does not send revoked, replaced, consumed or expired challenges', async () => {
  eligible = false;
  await processEmailBatch();
  expect(sendTransactionalEmail).not.toHaveBeenCalled();
  expect(pool.query).toHaveBeenCalledWith(
    expect.stringContaining("status = 'CANCELLED'"),
    [job.id, 1]
  );
});
it('retries transient failure with the same job identity and bounded backoff', async () => {
  jest
    .mocked(sendTransactionalEmail)
    .mockRejectedValue(
      new MailDeliveryError('EMAIL_PROVIDER_UNAVAILABLE', true)
    );
  await processEmailBatch();
  expect(pool.query).toHaveBeenCalledWith(
    expect.stringContaining('available_at = NOW()'),
    ['PENDING', 'EMAIL_PROVIDER_UNAVAILABLE', 30, job.id, 1]
  );
});
it('stops retrying on the fifth attempt', async () => {
  job.attempts = 5;
  jest
    .mocked(sendTransactionalEmail)
    .mockRejectedValue(
      new MailDeliveryError('EMAIL_PROVIDER_UNAVAILABLE', true)
    );
  await processEmailBatch();
  expect(pool.query).toHaveBeenCalledWith(
    expect.stringContaining('available_at = NOW()'),
    ['FAILED', 'EMAIL_PROVIDER_UNAVAILABLE', 300, job.id, 5]
  );
});
it('does not retry permanent provider refusal', async () => {
  jest
    .mocked(sendTransactionalEmail)
    .mockRejectedValue(new MailDeliveryError('EMAIL_PROVIDER_HTTP_403', false));
  await processEmailBatch();
  expect(pool.query).toHaveBeenCalledWith(
    expect.stringContaining('available_at = NOW()'),
    ['FAILED', 'EMAIL_PROVIDER_HTTP_403', 30, job.id, 1]
  );
});
it('rejects tampered/swapped encrypted payloads without sending', async () => {
  job.id = 'other-id';
  await processEmailBatch();
  expect(sendTransactionalEmail).not.toHaveBeenCalled();
  expect(pool.query).toHaveBeenCalledWith(
    expect.stringContaining('available_at = NOW()'),
    ['FAILED', 'EMAIL_PAYLOAD_INVALID', 30, job.id, 1]
  );
});
