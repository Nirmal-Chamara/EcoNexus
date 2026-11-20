import nodemailer from 'nodemailer';
import { env } from '../config/env';
import {
  configuredMailProvider,
  sendTransactionalEmail,
  MailDeliveryError,
} from '../services/email.service';

jest.mock('../config/env', () => ({
  env: {
    RESEND_API_KEY: '',
    SMTP_HOST: '',
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    SMTP_PORT: 587,
    EMAIL_FROM: 'Accounts <accounts@econexus.test>',
    EMAIL_OUTBOX_KEY: '1'.repeat(64),
  },
}));
jest.mock('nodemailer');
const originalFetch = global.fetch;
beforeEach(() => {
  jest.clearAllMocks();
  env.RESEND_API_KEY = 'resend-fixture';
  env.SMTP_HOST = '';
  env.SMTP_USER = '';
  env.SMTP_PASSWORD = '';
  global.fetch = jest.fn() as typeof fetch;
});
afterAll(() => {
  global.fetch = originalFetch;
});
it('never substitutes a console token when no provider is configured', () => {
  env.RESEND_API_KEY = '';
  expect(() => configuredMailProvider()).toThrow(
    'Email delivery is not configured'
  );
});
it('requires durable payload encryption configuration', () => {
  const key = env.EMAIL_OUTBOX_KEY;
  env.EMAIL_OUTBOX_KEY = '';
  expect(() => configuredMailProvider()).toThrow();
  env.EMAIL_OUTBOX_KEY = key;
});
it('uses Resend with a stable idempotency key and records provider acceptance', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'provider-message' }),
    } as Response);
  expect(
    await sendTransactionalEmail(
      'resend',
      'job-id',
      'recipient@econexus.test',
      'Subject',
      'Body'
    )
  ).toBe('provider-message');
  expect(fetch).toHaveBeenCalledWith(
    'https://api.resend.com/emails',
    expect.objectContaining({
      signal: expect.anything(),
      headers: expect.objectContaining({
        'Idempotency-Key': 'econexus/job-id',
      }),
    })
  );
});
it.each([429, 500, 503])(
  'classifies HTTP %s as a bounded retry',
  async (status) => {
    jest.mocked(fetch).mockResolvedValue({ ok: false, status } as Response);
    await expect(
      sendTransactionalEmail(
        'resend',
        'job',
        'recipient@econexus.test',
        'Subject',
        'Body'
      )
    ).rejects.toMatchObject({ retryable: true });
  }
);
it('rejects a permanent provider error without returning/logging its response body', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'sensitive-provider-details',
    } as Response);
  await expect(
    sendTransactionalEmail(
      'resend',
      'job',
      'recipient@econexus.test',
      'Subject',
      'Body'
    )
  ).rejects.toMatchObject({
    code: 'EMAIL_PROVIDER_HTTP_403',
    retryable: false,
  });
});
it('treats a network timeout as ambiguous/retryable without switching providers', async () => {
  jest.mocked(fetch).mockRejectedValue(new Error('Network timeout'));
  await expect(
    sendTransactionalEmail(
      'resend',
      'job',
      'recipient@econexus.test',
      'Subject',
      'Body'
    )
  ).rejects.toBeInstanceOf(MailDeliveryError);
  expect(nodemailer.createTransport).not.toHaveBeenCalled();
});
it('requires actual provider acceptance for SMTP too', async () => {
  env.SMTP_HOST = 'smtp.econexus.test';
  env.SMTP_USER = 'sender';
  env.SMTP_PASSWORD = 'smtp-fixture';
  const close = jest.fn();
  const sendMail = jest
    .fn()
    .mockResolvedValue({ accepted: [], rejected: ['recipient@econexus.test'] });
  jest
    .mocked(nodemailer.createTransport)
    .mockReturnValue({ sendMail, close } as never);
  await expect(
    sendTransactionalEmail(
      'smtp',
      'job',
      'recipient@econexus.test',
      'Subject',
      'Body'
    )
  ).rejects.toMatchObject({ code: 'EMAIL_RECIPIENT_REJECTED' });
  expect(close).toHaveBeenCalled();
});
