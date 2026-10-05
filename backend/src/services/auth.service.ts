import { pool } from '../config/database';
import { env } from '../config/env';
import { hashPassword, verifyPassword, dummyVerifyPassword } from '../utils/password';
import { signAccessToken, hashToken, generateRefreshToken } from '../utils/tokens';
import { generateRandomToken } from '../utils/crypto';
import { AppError } from '../utils/AppError';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { UserRole, AccountStatus } from '../types/express.d';

export interface AuthSessionResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: AccountStatus;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Transactional user registration
   */
  static async register(input: RegisterInput): Promise<AuthSessionResponse> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1 FOR UPDATE',
        [input.email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError(409, 'Email address already registered', 'EMAIL_EXISTS');
      }

      const passwordHash = await hashPassword(input.password);
      const initialStatus: AccountStatus = input.role === 'USER' ? 'ACTIVE' : 'PENDING_VERIFICATION';

      const userRes = await client.query(
        `INSERT INTO users (name, email, password_hash, phone, role, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, role, status, token_version`,
        [input.name, input.email.toLowerCase(), passwordHash, input.phone || null, input.role, initialStatus]
      );

      const user = userRes.rows[0];

      // Issue tokens
      const rawRefreshToken = generateRefreshToken();
      const hashedRefreshToken = hashToken(rawRefreshToken);
      const familyId = generateRandomToken(16);
      const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, family_id, is_revoked, expires_at)
         VALUES ($1, $2, $3, false, $4)`,
        [user.id, hashedRefreshToken, familyId, expiresAt]
      );

      await client.query('COMMIT');

      const accessToken = signAccessToken({
        id: user.id,
        role: user.role,
        token_version: user.token_version || 0,
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        accessToken,
        refreshToken: rawRefreshToken,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Constant-time Login with Anti-Enumeration Protection
   */
  static async login(input: LoginInput): Promise<AuthSessionResponse> {
    const userRes = await pool.query(
      `SELECT id, name, email, password_hash, role, status, token_version
       FROM users WHERE email = $1`,
      [input.email.toLowerCase()]
    );

    const user = userRes.rows[0];

    let isValidPassword = false;
    if (user) {
      isValidPassword = await verifyPassword(input.password, user.password_hash);
    } else {
      // Execute dummy verify to maintain constant-time response (protect against timing attacks / email enumeration)
      await dummyVerifyPassword(input.password);
    }

    if (!user || !isValidPassword) {
      throw new AppError(401, 'Invalid email or password credentials', 'INVALID_CREDENTIALS');
    }

    if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
      throw new AppError(403, `Account is ${user.status.toLowerCase()}`, 'ACCOUNT_DISABLED');
    }

    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);
    const familyId = generateRandomToken(16);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, family_id, is_revoked, expires_at)
       VALUES ($1, $2, $3, false, $4)`,
      [user.id, hashedRefreshToken, familyId, expiresAt]
    );

    const accessToken = signAccessToken({
      id: user.id,
      role: user.role,
      token_version: user.token_version || 0,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  /**
   * Refresh Token Rotation with Token Family Reuse Detection & Automatic Revocation
   */
  static async rotateRefreshToken(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const hashedInputToken = hashToken(rawRefreshToken);

      const tokenRes = await client.query(
        `SELECT rt.id, rt.user_id, rt.family_id, rt.is_revoked, rt.expires_at,
                u.role, u.status, u.token_version
         FROM refresh_tokens rt
         JOIN users u ON u.id = rt.user_id
         WHERE rt.token_hash = $1 FOR UPDATE`,
        [hashedInputToken]
      );

      const tokenRecord = tokenRes.rows[0];

      if (!tokenRecord) {
        throw new AppError(401, 'Invalid or expired refresh token', 'INVALID_TOKEN');
      }

      // REUSE DETECTION MECHANISM:
      // If a refresh token that has ALREADY been revoked is presented again,
      // it indicates an attacker is attempting to reuse a stolen refresh token.
      // IMMEDIATELY REVOKE ALL TOKENS IN THIS TOKEN FAMILY!
      if (tokenRecord.is_revoked) {
        await client.query(
          `UPDATE refresh_tokens SET is_revoked = true WHERE family_id = $1`,
          [tokenRecord.family_id]
        );
        await client.query('COMMIT');
        throw new AppError(
          401,
          'Security alert: Refresh token reuse detected. All sessions revoked for safety.',
          'TOKEN_REUSE_DETECTED'
        );
      }

      if (new Date() > new Date(tokenRecord.expires_at)) {
        throw new AppError(401, 'Refresh token has expired', 'TOKEN_EXPIRED');
      }

      if (tokenRecord.status === 'SUSPENDED' || tokenRecord.status === 'REJECTED') {
        throw new AppError(403, `Account is ${tokenRecord.status.toLowerCase()}`, 'ACCOUNT_DISABLED');
      }

      // Revoke the current token (one-time use)
      await client.query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE id = $1',
        [tokenRecord.id]
      );

      // Issue new token in the SAME family
      const newRawRefreshToken = generateRefreshToken();
      const newHashedRefreshToken = hashToken(newRawRefreshToken);
      const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, family_id, is_revoked, expires_at)
         VALUES ($1, $2, $3, false, $4)`,
        [tokenRecord.user_id, newHashedRefreshToken, tokenRecord.family_id, expiresAt]
      );

      await client.query('COMMIT');

      const accessToken = signAccessToken({
        id: tokenRecord.user_id,
        role: tokenRecord.role,
        token_version: tokenRecord.token_version || 0,
      });

      return {
        accessToken,
        refreshToken: newRawRefreshToken,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Revoke specific session refresh token family or all user sessions
   */
  static async revokeSession(rawRefreshToken: string): Promise<void> {
    const hashed = hashToken(rawRefreshToken);
    await pool.query(
      `UPDATE refresh_tokens
       SET is_revoked = true
       WHERE family_id = (SELECT family_id FROM refresh_tokens WHERE token_hash = $1)`,
      [hashed]
    );
  }

  /**
   * Revoke ALL active sessions for a user (e.g. on password change or security breach)
   */
  static async revokeAllUserSessions(userId: string): Promise<void> {
    await pool.query(
      `UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1`,
      [userId]
    );
    await pool.query(
      `UPDATE users SET token_version = token_version + 1 WHERE id = $1`,
      [userId]
    );
  }
}
