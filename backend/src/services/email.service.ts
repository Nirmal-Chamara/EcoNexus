import nodemailer from 'nodemailer';
import { env } from '../config/env';

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.EMAIL_FROM) {
    throw new Error('SMTP password-reset email configuration is incomplete');
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Reset your EcoNexus password',
    text: `Use this one-time reset code in the EcoNexus app: ${token}\n\nThis code expires in 15 minutes. If you did not request a password reset, ignore this email.`,
  });
}
