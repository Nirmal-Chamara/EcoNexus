import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import type { MailPayload } from './mail-payload.service';

export class MailDeliveryError extends Error {
  constructor(
    public code: string,
    public retryable: boolean
  ) {
    super(code);
  }
}
export function configuredMailProvider(): 'resend' | 'smtp' {
  if (!env.EMAIL_FROM || !/^[a-fA-F0-9]{64}$/.test(env.EMAIL_OUTBOX_KEY))
    throw new AppError(
      503,
      'Email delivery is not configured',
      'EMAIL_NOT_CONFIGURED'
    );
  if (env.RESEND_API_KEY) return 'resend';
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) return 'smtp';
  throw new AppError(
    503,
    'Email delivery is not configured',
    'EMAIL_NOT_CONFIGURED'
  );
}
export function messageFor(
  payload: Pick<MailPayload, 'purpose' | 'token' | 'link'>
) {
  const action =
    payload.purpose === 'VERIFY_EMAIL'
      ? 'Verify your EcoNexus email'
      : 'Reset your EcoNexus password';
  return {
    subject: action,
    text: `${action}\n\nUse this one-time code in EcoNexus:\n${payload.token}\n\nOr open:\n${payload.link}\n\nExpires in 15 minutes. If you did not request this, ignore this email.`,
  };
}
/** Provider acceptance is not proof of inbox delivery. No console-send fallback. */
export async function sendTransactionalEmail(
  provider: 'resend' | 'smtp',
  id: string,
  email: string,
  subject: string,
  text: string,
  from = env.EMAIL_FROM
): Promise<string> {
  if (provider === 'resend') {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM)
      throw new MailDeliveryError('EMAIL_NOT_CONFIGURED', false);
    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `econexus/${id}`,
        },
        body: JSON.stringify({ from, to: [email], subject, text }),
      });
    } catch {
      throw new MailDeliveryError('EMAIL_PROVIDER_UNAVAILABLE', true);
    }
    if (!response.ok)
      throw new MailDeliveryError(
        `EMAIL_PROVIDER_HTTP_${response.status}`,
        response.status === 429 ||
          response.status >= 500 ||
          response.status === 409
      );
    const body = (await response.json().catch(() => null)) as {
      id?: unknown;
    } | null;
    if (typeof body?.id !== 'string')
      throw new MailDeliveryError('EMAIL_PROVIDER_INVALID_RESPONSE', true);
    return body.id;
  }
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.EMAIL_FROM)
    throw new MailDeliveryError('EMAIL_NOT_CONFIGURED', false);
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  try {
    const result = await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
      messageId: `<${id}@econexus-mail>`,
      headers: { 'Resend-Idempotency-Key': `econexus/${id}` },
    });
    if (!result.accepted?.length || result.rejected?.length)
      throw new MailDeliveryError('EMAIL_RECIPIENT_REJECTED', false);
    return result.messageId;
  } catch (error) {
    if (error instanceof MailDeliveryError) throw error;
    throw new MailDeliveryError('EMAIL_SMTP_UNAVAILABLE', true);
  } finally {
    transporter.close();
  }
}
