import bcrypt from 'bcrypt';
import { env } from '../config/env';

// Pre-computed dummy hash used for constant-time comparison when email is not found
const DUMMY_HASH = '$2b$12$eImiTXuWVxfM37uY4JANjO.h6wT2H5H8.z3F1Y/p8U4X35mE2pSWS';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Executes dummy password verification to guarantee uniform execution time
 * regardless of whether the user exists or not (prevents timing side-channel attack/email enumeration).
 */
export async function dummyVerifyPassword(plain: string): Promise<boolean> {
  await bcrypt.compare(plain, DUMMY_HASH);
  return false;
}
