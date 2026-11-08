import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const hasResend = Boolean(env.RESEND_API_KEY);
  const hasSmtp = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);

  if (!hasResend && !hasSmtp) {
    if (env.NODE_ENV !== 'production') {
      logger.info(
        `[DEV MODE] Password reset email not sent via external provider (credentials not configured).\n` +
        `Reset code for ${email}: ${token}\n` +
        `Deep Link: econexus://reset-password?token=${token}`
      );
      return;
    }
    throw new Error('Email service configuration is incomplete. Configure RESEND_API_KEY or SMTP credentials.');
  }

  const fromEmail = env.EMAIL_FROM || 'EcoNexus <onboarding@resend.dev>';
  const deepLink = `econexus://reset-password?token=${encodeURIComponent(token)}`;

  const textBody =
    `Hello,\n\n` +
    `You requested a password reset for your EcoNexus account.\n\n` +
    `Your one-time reset code is: ${token}\n\n` +
    `Or open this link directly in the app: ${deepLink}\n\n` +
    `This code will expire in 15 minutes. If you did not request this, you can safely ignore this email.\n\n` +
    `— The EcoNexus Team`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your EcoNexus Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0F0D; color: #FFFFFF; margin: 0; padding: 20px; }
    .container { max-width: 520px; margin: 0 auto; background-color: #121A16; border-radius: 12px; padding: 32px; border: 1px solid #1E2D26; }
    .logo { color: #22C55E; font-size: 24px; font-weight: bold; margin-bottom: 24px; display: inline-block; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #FFFFFF; }
    p { font-size: 15px; line-height: 24px; color: #A1A1AA; margin-bottom: 20px; }
    .code-box { background-color: #0A0F0D; border: 1px dashed #22C55E; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
    .code { font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #22C55E; word-break: break-all; }
    .btn { display: inline-block; background-color: #22C55E; color: #000000; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 12px 0 24px 0; }
    .footer { font-size: 13px; color: #71717A; margin-top: 32px; border-top: 1px solid #1E2D26; padding-top: 16px; line-height: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🌱 EcoNexus</div>
    <h1>Password Reset Request</h1>
    <p>You requested to reset the password for your EcoNexus account. Use the one-time code below in the app:</p>
    <div class="code-box">
      <div class="code">${token}</div>
    </div>
    <div style="text-align: center;">
      <a href="${deepLink}" class="btn">Open in EcoNexus App</a>
    </div>
    <p style="font-size: 13px; color: #EF4444;">⏰ This reset code expires in 15 minutes.</p>
    <div class="footer">
      If you did not request a password reset, please ignore this email or contact support if you have security concerns. Your account remains secure.
    </div>
  </div>
</body>
</html>`;

  // Priority 1: Resend HTTP REST API
  if (hasResend) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Reset your EcoNexus password',
          text: textBody,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({ message: response.statusText }))) as any;
        const errMsg = errorData?.message || errorData?.name || response.statusText;
        logger.error(`Resend API error (${response.status}): ${errMsg}`);
        if (!hasSmtp) {
          throw new Error(`Resend email delivery failed (${response.status}): ${errMsg}`);
        }
      } else {
        logger.info(`Password reset email successfully sent to ${email} via Resend API.`);
        return;
      }
    } catch (err: any) {
      if (!hasSmtp) {
        throw err;
      }
      logger.warn(`Resend API request failed, attempting SMTP fallback: ${err.message}`);
    }
  }

  // Priority 2: Nodemailer SMTP
  if (hasSmtp) {
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
      from: fromEmail,
      to: email,
      subject: 'Reset your EcoNexus password',
      text: textBody,
      html: htmlBody,
    });
    logger.info(`Password reset email successfully sent to ${email} via SMTP.`);
  }
}
