import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Generate a cryptographically secure random hex string of given byte length
 */
export function generateRandomToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Hash raw token string using SHA-256 for secure DB lookup/storage
 */
export function hashSha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Encrypt sensitive string data (AES-256-GCM)
 */
export function encryptData(text: string): { iv: string; encryptedData: string; tag: string } {
  const secretKey = crypto.scryptSync(env.JWT_ACCESS_SECRET, 'econexus_salt', 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    tag,
  };
}

/**
 * Decrypt sensitive string data (AES-256-GCM)
 */
export function decryptData(encryptedData: string, iv: string, tag: string): string {
  const secretKey = crypto.scryptSync(env.JWT_ACCESS_SECRET, 'econexus_salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
