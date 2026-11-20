import { pool } from '../config/database';
import { EmailChallengeService } from '../services/email-challenge.service';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import {
  encryptMail,
  decryptMail,
  MailPayload,
} from '../services/mail-payload.service';
import { hashSha256 } from '../utils/crypto';
import type { Request, Response } from 'express';

jest.mock('../config/database', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));
jest.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    RESEND_API_KEY: 'provider-fixture',
    EMAIL_FROM: 'Accounts <account@econexus.test>',
    EMAIL_OUTBOX_KEY: '1'.repeat(64),
    APP_LINK_BASE_URL: 'https://app.econexus.test',
    REFRESH_TOKEN_TTL_DAYS: 14,
    JWT_ACCESS_SECRET: 'test_secret_123456789012345678901234567890',
    ACCESS_TOKEN_TTL: '15m',
  },
}));
jest.mock('../utils/password', () => ({
  hashPassword: jest.fn(async () => 'password-hash'),
  verifyPassword: jest.fn(),
  dummyVerifyPassword: jest.fn(),
}));

const user = {
  id: 'user-id',
  email: 'user@econexus.test',
  role: 'USER',
  status: 'ACTIVE',
  token_version: 0,
  email_verified_at: null,
};
let query: jest.Mock;
let exists: boolean;
let cooldown: boolean;
let validToken: boolean;
beforeEach(() => {
  jest.clearAllMocks();
  exists = true;
  cooldown = false;
  validToken = true;
  query = jest.fn(async (sql: string) => {
    if (sql.includes('SELECT id, email')) return { rows: exists ? [user] : [] };
    if (sql.includes('SELECT id FROM email_outbox'))
      return { rows: cooldown ? [{ id: 'recent' }] : [] };
    if (sql.startsWith('SELECT token_hash FROM email_verification_tokens'))
      return { rows: validToken ? [{ token_hash: 'hash' }] : [] };
    if (sql.startsWith('SELECT t.token_hash'))
      return {
        rows: validToken ? [{ token_hash: 'hash', user_id: user.id }] : [],
      };
    if (sql.includes('INSERT INTO users')) return { rows: [user] };
    return { rows: [] };
  });
  jest
    .mocked(pool.connect)
    .mockResolvedValue({ query, release: jest.fn() } as never);
});
const mail: MailPayload = {
  email: user.email,
  token: 'a'.repeat(64),
  link: 'https://app.econexus.test/verify-email',
  purpose: 'VERIFY_EMAIL',
  from: 'account@econexus.test',
  subject: 'Verify',
  text: 'One-time credential',
};

it('encrypts durable email credentials and authenticates the job ID and ciphertext', () => {
  const encrypted = encryptMail('job-id', mail);
  expect(JSON.stringify(encrypted)).not.toContain(mail.token);
  expect(JSON.stringify(encrypted)).not.toContain(mail.email);
  expect(decryptMail('job-id', encrypted)).toEqual(mail);
  expect(() => decryptMail('another-job', encrypted)).toThrow();
  expect(() =>
    decryptMail('job-id', { ...encrypted, tag: '0'.repeat(32) })
  ).toThrow();
});
it('queues a verification challenge hash and encrypted message in the same transaction', async () => {
  await EmailChallengeService.requestVerification(user.id);
  const insert = query.mock.calls.find(([sql]) =>
    sql.startsWith('INSERT INTO email_outbox')
  )!;
  const [id, , purpose, hash, provider, payload] = insert[1];
  const decrypted = decryptMail(id, payload);
  expect(purpose).toBe('VERIFY_EMAIL');
  expect(provider).toBe('resend');
  expect(hashSha256(decrypted.token)).toBe(hash);
  expect(decrypted.link).toContain('/verify-email?token=');
  expect(JSON.stringify(query.mock.calls)).not.toContain(decrypted.token);
  expect(query).toHaveBeenLastCalledWith('COMMIT');
});
it('new local enrollment receives a restricted session and a durable verification job', async () => {
  const session = await AuthService.register({
    name: 'User',
    email: user.email,
    password: 'Password123',
    role: 'USER',
  });
  expect(session.user.emailVerified).toBe(false);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO email_outbox'),
    expect.any(Array)
  );
});
it('rolls back challenge issuance if the durable outbox insert fails', async () => {
  const implementation = query.getMockImplementation()!;
  query.mockImplementation(async (...args) => {
    if (args[0].startsWith('INSERT INTO email_outbox'))
      throw new Error('Outbox unavailable');
    return implementation(...args);
  });
  await expect(
    EmailChallengeService.requestVerification(user.id)
  ).rejects.toThrow('Outbox unavailable');
  expect(query).not.toHaveBeenCalledWith('COMMIT');
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
});
it('enforces verification resend cooldown on the server', async () => {
  cooldown = true;
  await expect(
    EmailChallengeService.requestVerification(user.id)
  ).rejects.toMatchObject({ code: 'VERIFICATION_COOLDOWN' });
  expect(query.mock.calls.some(([sql]) => sql.startsWith('INSERT'))).toBe(
    false
  );
});
it.each([true, false])(
  'reset acknowledgement never returns a credential (account exists: %s)',
  async (known) => {
    exists = known;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();
    await AuthController.forgotPassword(
      { body: { email: user.email } } as Request,
      res,
      next
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      message:
        'If this account supports password recovery, instructions will be emailed.',
    });
  }
);
it('reset requests are durable and resend cooldown has the same generic outcome', async () => {
  cooldown = true;
  await expect(
    EmailChallengeService.requestReset(user.email)
  ).resolves.toBeUndefined();
  expect(query.mock.calls.some(([sql]) => sql.startsWith('INSERT'))).toBe(
    false
  );
});
it('does not reveal an existing account when durable reset enqueue fails', async () => {
  query.mockRejectedValue(new Error('private database details'));
  const logger = jest.spyOn(console, 'error').mockImplementation(() => {});
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
  const next = jest.fn();
  try {
    await AuthController.forgotPassword({ body: { email: user.email } } as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ message: 'If this account supports password recovery, instructions will be emailed.' });
    expect(next).not.toHaveBeenCalled();
    expect(logger).toHaveBeenCalledWith('Password recovery request could not be queued');
  } finally {
    logger.mockRestore();
  }
});
it('verification binds the token to the authenticated account and its current email', async () => {
  const token = 'b'.repeat(64);
  await EmailChallengeService.confirm(user.id, token);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('AND user_id = $2 AND email = $3'),
    [hashSha256(token), user.id, user.email]
  );
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('UPDATE users SET email_verified_at'),
    [user.id]
  );
  expect(query).toHaveBeenLastCalledWith('COMMIT');
});
it('rejects expired, consumed, wrong-account and wrong-destination verification proof', async () => {
  validToken = false;
  await expect(
    EmailChallengeService.confirm(user.id, 'wrong')
  ).rejects.toMatchObject({ code: 'INVALID_EMAIL_TOKEN' });
  expect(query.mock.calls.some(([sql]) => sql.startsWith('UPDATE users'))).toBe(
    false
  );
});
it('reset consumes recovery credentials, proves email ownership and revokes old sessions', async () => {
  await AuthService.resetPassword('recovery-token', 'NewPassword123');
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('email_verified_at = COALESCE'),
    ['password-hash', user.id]
  );
  expect(query).toHaveBeenCalledWith(
    'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
    [user.id]
  );
  expect(query).toHaveBeenCalledWith(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [user.id]
  );
  expect(query).toHaveBeenLastCalledWith('COMMIT');
});
it('invalid reset tokens never change a password', async () => {
  validToken = false;
  await expect(
    AuthService.resetPassword('used', 'Password123')
  ).rejects.toMatchObject({ code: 'INVALID_RESET_TOKEN' });
  expect(query.mock.calls.some(([sql]) => sql.startsWith('UPDATE users'))).toBe(
    false
  );
});
