import { sendPasswordResetEmail } from '../services/email.service';
import { env } from '../config/env';
import nodemailer from 'nodemailer';

jest.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    RESEND_API_KEY: '',
    SMTP_HOST: '',
    SMTP_PORT: 587,
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    EMAIL_FROM: '',
  },
}));

jest.mock('nodemailer');

describe('email.service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    (env as any).NODE_ENV = 'development';
    (env as any).RESEND_API_KEY = '';
    (env as any).SMTP_HOST = '';
    (env as any).SMTP_PORT = 587;
    (env as any).SMTP_USER = '';
    (env as any).SMTP_PASSWORD = '';
    (env as any).EMAIL_FROM = '';
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('in development mode with no credentials, logs mock reset without throwing', async () => {
    await expect(sendPasswordResetEmail('user@test.com', 'MOCK-TOKEN-123')).resolves.toBeUndefined();
  });

  it('in production mode with no credentials, throws error', async () => {
    (env as any).NODE_ENV = 'production';
    await expect(sendPasswordResetEmail('user@test.com', 'MOCK-TOKEN-123')).rejects.toThrow(
      'Email service configuration is incomplete'
    );
  });

  it('sends email via Resend API when RESEND_API_KEY is configured', async () => {
    (env as any).RESEND_API_KEY = 're_test_key_123';
    (env as any).EMAIL_FROM = 'EcoNexus <onboarding@resend.dev>';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_msg_123' }),
    });
    global.fetch = mockFetch as any;

    await sendPasswordResetEmail('target@test.com', 'RESET-123456');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.headers['Authorization']).toBe('Bearer re_test_key_123');
    const parsedBody = JSON.parse(options.body);
    expect(parsedBody.to).toEqual(['target@test.com']);
    expect(parsedBody.subject).toBe('Reset your EcoNexus password');
    expect(parsedBody.html).toContain('RESET-123456');
    expect(parsedBody.html).toContain('econexus://reset-password?token=RESET-123456');
  });

  it('throws descriptive error if Resend API returns error and no SMTP configured', async () => {
    (env as any).RESEND_API_KEY = 're_test_key_123';
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ message: 'Domain not verified' }),
    });
    global.fetch = mockFetch as any;

    await expect(sendPasswordResetEmail('target@test.com', 'RESET-123456')).rejects.toThrow(
      'Domain not verified'
    );
  });

  it('sends email via Nodemailer SMTP when SMTP credentials are provided', async () => {
    (env as any).SMTP_HOST = 'smtp.resend.com';
    (env as any).SMTP_PORT = 465;
    (env as any).SMTP_USER = 'resend';
    (env as any).SMTP_PASSWORD = 'password_123';
    (env as any).EMAIL_FROM = 'noreply@econexus.lk';

    const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'smtp-123' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    await sendPasswordResetEmail('target@test.com', 'RESET-123456');

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: 'password_123',
      },
    });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@econexus.lk',
        to: 'target@test.com',
        subject: 'Reset your EcoNexus password',
      })
    );
  });

  it('falls back to SMTP when Resend API fails and SMTP is configured', async () => {
    (env as any).RESEND_API_KEY = 're_test_key_123';
    (env as any).SMTP_HOST = 'smtp.resend.com';
    (env as any).SMTP_PORT = 465;
    (env as any).SMTP_USER = 'resend';
    (env as any).SMTP_PASSWORD = 'password_123';

    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'smtp-fallback-123' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    await sendPasswordResetEmail('target@test.com', 'RESET-123456');

    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});

