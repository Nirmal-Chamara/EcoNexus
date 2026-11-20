import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import { pool } from '../config/database';
import { env } from '../config/env';
import { generateRandomToken, hashSha256 } from '../utils/crypto';
import { AppError } from '../utils/AppError';
import { configuredMailProvider, messageFor } from './email.service';
import { encryptMail } from './mail-payload.service';

export class EmailChallengeService {
  static async enqueue(
    client: PoolClient,
    user: { id: string; email: string },
    purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD'
  ) {
    const provider = configuredMailProvider();
    const token = generateRandomToken(32),
      hash = hashSha256(token),
      id = randomUUID();
    const path = purpose === 'VERIFY_EMAIL' ? 'verify-email' : 'reset-password';
    const base =
      env.APP_LINK_BASE_URL === 'econexus://'
        ? env.APP_LINK_BASE_URL
        : `${env.APP_LINK_BASE_URL.replace(/\/$/, '')}/`;
    const link = `${base}${path}?token=${encodeURIComponent(token)}`;
    const payload = encryptMail(id, {
      email: user.email,
      token,
      link,
      purpose,
      from: env.EMAIL_FROM,
      ...messageFor({ token, link, purpose }),
    });
    if (purpose === 'VERIFY_EMAIL') {
      await client.query(
        'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [user.id]
      );
      await client.query(
        "INSERT INTO email_verification_tokens (token_hash, user_id, email, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')",
        [hash, user.id, user.email]
      );
    } else {
      await client.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [user.id]
      );
      await client.query(
        "INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')",
        [hash, user.id]
      );
    }
    await client.query(
      "UPDATE email_outbox SET status = 'CANCELLED', payload = '{}'::jsonb WHERE user_id = $1 AND purpose = $2 AND status IN ('PENDING', 'PROCESSING')",
      [user.id, purpose]
    );
    await client.query(
      "INSERT INTO email_outbox (id, user_id, purpose, challenge_hash, provider, payload, expires_at) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '15 minutes')",
      [id, user.id, purpose, hash, provider, payload]
    );
  }

  static async requestVerification(userId: string) {
    configuredMailProvider();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'SELECT id, email, email_verified_at FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );
      const user = result.rows[0];
      if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');
      if (!user.email_verified_at) {
        const recent = await client.query(
          "SELECT id FROM email_outbox WHERE user_id = $1 AND purpose = 'VERIFY_EMAIL' AND created_at > NOW() - INTERVAL '60 seconds' LIMIT 1",
          [userId]
        );
        if (recent.rows.length)
          throw new AppError(
            429,
            'Wait before requesting another verification email',
            'VERIFICATION_COOLDOWN'
          );
        await this.enqueue(client, user, 'VERIFY_EMAIL');
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async requestReset(email: string): Promise<void> {
    // Configuration failure applies uniformly to known and unknown addresses.
    configuredMailProvider();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'SELECT id, email FROM users WHERE email = $1 AND password_hash IS NOT NULL FOR UPDATE',
        [email.trim().toLowerCase()]
      );
      const user = result.rows[0];
      if (user) {
        const recent = await client.query(
          "SELECT id FROM email_outbox WHERE user_id = $1 AND purpose = 'RESET_PASSWORD' AND created_at > NOW() - INTERVAL '60 seconds' LIMIT 1",
          [user.id]
        );
        if (!recent.rows.length)
          await this.enqueue(client, user, 'RESET_PASSWORD');
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async confirm(userId: string, token: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const account = await client.query(
        'SELECT id, email FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );
      const result = await client.query(
        'SELECT token_hash FROM email_verification_tokens WHERE token_hash = $1 AND user_id = $2 AND email = $3 AND used_at IS NULL AND expires_at > NOW() FOR UPDATE',
        [hashSha256(token), userId, account.rows[0]?.email]
      );
      if (!result.rows.length)
        throw new AppError(
          400,
          'Email verification code is invalid or expired',
          'INVALID_EMAIL_TOKEN'
        );
      await client.query(
        'UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = $1',
        [userId]
      );
      await client.query(
        'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [userId]
      );
      await client.query(
        "UPDATE email_outbox SET status = 'CANCELLED', payload = '{}'::jsonb WHERE user_id = $1 AND purpose = 'VERIFY_EMAIL' AND status IN ('PENDING', 'PROCESSING')",
        [userId]
      );
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, target_id, meta) VALUES ($1, $2, $3, $4)',
        [userId, 'EMAIL_VERIFIED', userId, {}]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
