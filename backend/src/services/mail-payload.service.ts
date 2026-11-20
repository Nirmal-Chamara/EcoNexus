import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '../config/env';

export interface MailPayload {
  email: string;
  token: string;
  link: string;
  purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD';
  from: string;
  subject: string;
  text: string;
}
export interface EncryptedMail {
  iv: string;
  tag: string;
  ciphertext: string;
}
function key() {
  if (!/^[a-fA-F0-9]{64}$/.test(env.EMAIL_OUTBOX_KEY))
    throw new Error('EMAIL_OUTBOX_KEY must be a 32-byte hex key');
  return Buffer.from(env.EMAIL_OUTBOX_KEY, 'hex');
}
export function encryptMail(id: string, payload: MailPayload): EncryptedMail {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(id));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  return {
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
    ciphertext: ciphertext.toString('hex'),
  };
}
export function decryptMail(id: string, envelope: EncryptedMail): MailPayload {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key(),
    Buffer.from(envelope.iv, 'hex')
  );
  decipher.setAAD(Buffer.from(id));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'hex'));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, 'hex')),
      decipher.final(),
    ]).toString('utf8')
  ) as MailPayload;
}
