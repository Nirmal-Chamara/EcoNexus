/**
 * tokens.test.ts — Unit Tests
 *
 * Covers:
 *  - signAccessToken() produces a valid, verifiable JWT with the correct payload fields
 *  - JWT payload contains sub, role, and tv (token_version) claims
 *  - Expired tokens are rejected by jwt.verify
 *  - generateRefreshToken() produces a sufficiently random hex string
 *  - hashToken() is deterministic and produces a SHA-256 hex digest
 *  - hashToken() output is never the same as the input
 *  - generateRandomToken() / hashSha256() from crypto utils
 */

import jwt from 'jsonwebtoken';
import { signAccessToken, generateRefreshToken, hashToken, JWTPayload } from '../utils/tokens';
import { generateRandomToken, hashSha256 } from '../utils/crypto';

jest.mock('../config/env', () => ({
  env: {
    BCRYPT_ROUNDS: 4,
    JWT_ACCESS_SECRET: 'unit_test_jwt_secret_key_2024',
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

const TEST_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  role: 'USER' as const,
  token_version: 0,
};

describe('Token Utilities', () => {
  // ─── signAccessToken ─────────────────────────────────────────────────────────
  describe('signAccessToken()', () => {
    it('returns a non-empty string', () => {
      const token = signAccessToken(TEST_USER);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('produces a three-segment JWT (header.payload.signature)', () => {
      const token = signAccessToken(TEST_USER);
      const segments = token.split('.');
      expect(segments).toHaveLength(3);
    });

    it('embeds the correct sub claim (user ID)', () => {
      const token = signAccessToken(TEST_USER);
      const decoded = jwt.decode(token) as JWTPayload;
      expect(decoded.sub).toBe(TEST_USER.id);
    });

    it('embeds the correct role claim', () => {
      const token = signAccessToken(TEST_USER);
      const decoded = jwt.decode(token) as JWTPayload;
      expect(decoded.role).toBe('USER');
    });

    it('embeds the correct tv (token_version) claim', () => {
      const token = signAccessToken({ ...TEST_USER, token_version: 5 });
      const decoded = jwt.decode(token) as JWTPayload;
      expect(decoded.tv).toBe(5);
    });

    it('verifies successfully against the same secret', () => {
      const token = signAccessToken(TEST_USER);
      // Re-import env after mock to get the mocked secret
      const { env } = require('../config/env');
      expect(() => jwt.verify(token, env.JWT_ACCESS_SECRET)).not.toThrow();
    });

    it('fails verification when a different secret is used', () => {
      const token = signAccessToken(TEST_USER);
      expect(() => jwt.verify(token, 'wrong_secret')).toThrow(jwt.JsonWebTokenError);
    });

    it('signs tokens for all four roles without errors', () => {
      const roles = ['USER', 'COLLECTOR', 'RECYCLING_CENTER', 'ADMIN'] as const;
      for (const role of roles) {
        expect(() => signAccessToken({ id: TEST_USER.id, role, token_version: 0 })).not.toThrow();
        const token = signAccessToken({ id: TEST_USER.id, role, token_version: 0 });
        const decoded = jwt.decode(token) as JWTPayload;
        expect(decoded.role).toBe(role);
      }
    });

    it('token has an expiry (exp claim) set', () => {
      const token = signAccessToken(TEST_USER);
      const decoded = jwt.decode(token) as JWTPayload & { exp: number };
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('short-lived token (1s TTL) is rejected after expiry', async () => {
      // Sign with a 1-second TTL
      const { env } = require('../config/env');
      const shortToken = jwt.sign(
        { sub: TEST_USER.id, role: 'USER', tv: 0 },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1s' }
      );

      // Wait 1.1 seconds for the token to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(() => jwt.verify(shortToken, env.JWT_ACCESS_SECRET)).toThrow(
        jwt.TokenExpiredError
      );
    }, 5000 /* allow 5s for this test */);
  });

  // ─── generateRefreshToken ─────────────────────────────────────────────────────
  describe('generateRefreshToken()', () => {
    it('returns a string', () => {
      expect(typeof generateRefreshToken()).toBe('string');
    });

    it('has a length of 96 hex characters (48 bytes × 2)', () => {
      const token = generateRefreshToken();
      expect(token).toHaveLength(96);
    });

    it('contains only lowercase hex characters', () => {
      const token = generateRefreshToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('generates different tokens on successive calls (randomness check)', () => {
      const tokens = new Set(Array.from({ length: 20 }, () => generateRefreshToken()));
      expect(tokens.size).toBe(20);
    });
  });

  // ─── hashToken ───────────────────────────────────────────────────────────────
  describe('hashToken()', () => {
    const RAW = 'abc123_sample_refresh_token_value';

    it('returns a 64-character hex string (SHA-256)', () => {
      expect(hashToken(RAW)).toHaveLength(64);
    });

    it('is deterministic — same input always produces same output', () => {
      expect(hashToken(RAW)).toBe(hashToken(RAW));
    });

    it('hash is DIFFERENT from the input (not an identity function)', () => {
      expect(hashToken(RAW)).not.toBe(RAW);
    });

    it('different inputs produce different hashes (collision sanity)', () => {
      expect(hashToken('token_a')).not.toBe(hashToken('token_b'));
    });

    it('matches the expected SHA-256 value for a known input', () => {
      // SHA-256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
      expect(hashToken('hello')).toBe(
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
      );
    });
  });

  // ─── generateRandomToken (crypto util) ───────────────────────────────────────
  describe('generateRandomToken()', () => {
    it('returns a string of length byteLength × 2 in hex', () => {
      expect(generateRandomToken(16)).toHaveLength(32);
      expect(generateRandomToken(32)).toHaveLength(64);
    });

    it('uses 32 bytes (64 hex chars) as default', () => {
      expect(generateRandomToken()).toHaveLength(64);
    });

    it('generates unique tokens across 20 calls', () => {
      const tokens = new Set(Array.from({ length: 20 }, () => generateRandomToken()));
      expect(tokens.size).toBe(20);
    });
  });

  // ─── hashSha256 (crypto util) ─────────────────────────────────────────────────
  describe('hashSha256()', () => {
    it('returns a 64-character hex string', () => {
      expect(hashSha256('some_data')).toHaveLength(64);
    });

    it('is deterministic', () => {
      expect(hashSha256('data')).toBe(hashSha256('data'));
    });

    it('produces the same output as hashToken() for the same input', () => {
      // Both functions implement SHA-256; they should be equivalent.
      expect(hashSha256('test_token_value')).toBe(hashToken('test_token_value'));
    });
  });
});
