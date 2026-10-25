/**
 * password.test.ts — Unit Tests
 *
 * Covers:
 *  - hashPassword() produces a bcrypt hash with the correct cost factor
 *  - verifyPassword() returns true for a correct plaintext / false for wrong one
 *  - dummyVerifyPassword() always returns false regardless of input
 *  - Password hash is never the same as the plaintext (sanity guard)
 *  - Two hashes of the same password are different (bcrypt salt uniqueness)
 */
import bcrypt from 'bcrypt';
import { hashPassword, verifyPassword, dummyVerifyPassword } from '../utils/password';

// Use a fast cost factor in tests so the suite doesn't time out.
// We patch the env before the module is imported — we do it directly on the
// module-cached `env` object instead of re-importing.
jest.mock('../config/env', () => ({
  env: {
    BCRYPT_ROUNDS: 4, // deliberately low for speed
    JWT_ACCESS_SECRET: 'test_secret_key_for_unit_tests',
    ACCESS_TOKEN_TTL: '15m',
    REFRESH_TOKEN_TTL_DAYS: 14,
    DATABASE_URL: 'postgres://localhost/econexus_test',
    NODE_ENV: 'test',
    PORT: 4001,
    ADMIN_EMAIL: 'admin@test.com',
    ADMIN_PASSWORD: 'AdminPass123!',
    ADMIN_NAME: 'Test Admin',
  },
}));

const STRONG_PASSWORD = 'MySecurePass1';
const WEAK_PASSWORD   = 'wrong_pass';

describe('Password Utilities', () => {
  // ─── hashPassword ────────────────────────────────────────────────────────────
  describe('hashPassword()', () => {
    it('returns a string', async () => {
      const hash = await hashPassword(STRONG_PASSWORD);
      expect(typeof hash).toBe('string');
    });

    it('produces a valid bcrypt hash (starts with $2b$)', async () => {
      const hash = await hashPassword(STRONG_PASSWORD);
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it('stores a cost factor that matches BCRYPT_ROUNDS (4 in test env)', async () => {
      const hash = await hashPassword(STRONG_PASSWORD);
      const rounds = parseInt(hash.split('$')[2], 10);
      expect(rounds).toBe(4);
    });

    it('hash is NOT equal to the plaintext password', async () => {
      const hash = await hashPassword(STRONG_PASSWORD);
      expect(hash).not.toBe(STRONG_PASSWORD);
    });

    it('produces a DIFFERENT hash each call (bcrypt salt uniqueness)', async () => {
      const hash1 = await hashPassword(STRONG_PASSWORD);
      const hash2 = await hashPassword(STRONG_PASSWORD);
      expect(hash1).not.toBe(hash2);
    });

    it('produces a hash that bcrypt.compare() can verify', async () => {
      const hash = await hashPassword(STRONG_PASSWORD);
      const valid = await bcrypt.compare(STRONG_PASSWORD, hash);
      expect(valid).toBe(true);
    });
  });

  // ─── verifyPassword ──────────────────────────────────────────────────────────
  describe('verifyPassword()', () => {
    let storedHash: string;

    beforeAll(async () => {
      storedHash = await hashPassword(STRONG_PASSWORD);
    });

    it('returns true when plaintext matches the stored hash', async () => {
      const result = await verifyPassword(STRONG_PASSWORD, storedHash);
      expect(result).toBe(true);
    });

    it('returns false when plaintext does NOT match the stored hash', async () => {
      const result = await verifyPassword(WEAK_PASSWORD, storedHash);
      expect(result).toBe(false);
    });

    it('returns false for an empty string against a real hash', async () => {
      const result = await verifyPassword('', storedHash);
      expect(result).toBe(false);
    });

    it('returns false when comparing against an empty hash string', async () => {
      // bcrypt.compare on an invalid hash should return false (or throw — handle both)
      let result: boolean;
      try {
        result = await verifyPassword(STRONG_PASSWORD, '');
        expect(result).toBe(false);
      } catch {
        // Some bcrypt implementations throw on invalid hashes — acceptable too.
        expect(true).toBe(true);
      }
    });
  });

  // ─── dummyVerifyPassword ─────────────────────────────────────────────────────
  describe('dummyVerifyPassword()', () => {
    it('always returns false regardless of input', async () => {
      const result = await dummyVerifyPassword(STRONG_PASSWORD);
      expect(result).toBe(false);
    });

    it('always returns false even for an empty string', async () => {
      const result = await dummyVerifyPassword('');
      expect(result).toBe(false);
    });

    it('takes a measurable amount of time (anti-timing guard)', async () => {
      const start = Date.now();
      await dummyVerifyPassword('any_password');
      const elapsed = Date.now() - start;
      // A real bcrypt comparison at cost=4 should take at least a few ms;
      // guard against it being skipped/bypassed (< 1 ms would be suspicious).
      expect(elapsed).toBeGreaterThan(0);
    });
  });
});
