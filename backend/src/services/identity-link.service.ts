import { pool } from '../config/database';
import { GoogleService, GooglePayload } from './google.service';
import { verifyPassword } from '../utils/password';
import { AppError } from '../utils/AppError';

export class IdentityLinkService {
  static async getMethods(userId: string) {
    const result = await pool.query(
      'SELECT password_hash IS NOT NULL AS "hasPassword", google_id IS NOT NULL AS "googleLinked" FROM users WHERE id = $1',
      [userId]
    );
    if (!result.rows.length)
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    return result.rows[0] as { hasPassword: boolean; googleLinked: boolean };
  }

  static async linkGoogle(
    userId: string,
    input: { idToken: string; currentPassword: string; nonce: string }
  ) {
    if (!input.currentPassword || !input.nonce || input.nonce.length < 16)
      throw new AppError(
        400,
        'Fresh account and Google authentication are required',
        'REAUTH_REQUIRED'
      );
    let identity: GooglePayload;
    try {
      identity = await GoogleService.verifyIdToken(input.idToken, input.nonce);
    } catch (error) {
      // Invalid provider proof is a form failure, not an expired EcoNexus
      // bearer token. Do not trigger refresh/retry of the current account.
      if (error instanceof AppError && error.status === 401)
        throw new AppError(400, error.message, error.code);
      throw error;
    }
    const age = Date.now() / 1000 - identity.issuedAt;
    if (!Number.isFinite(age) || age > 300 || age < -30)
      throw new AppError(
        400,
        'Sign in to Google again before connecting this account',
        'GOOGLE_REAUTH_REQUIRED'
      );
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'SELECT id, email, password_hash, google_id, status FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );
      const user = result.rows[0];
      if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');
      if (user.status !== 'ACTIVE' && user.status !== 'PENDING_VERIFICATION')
        throw new AppError(
          403,
          'Account is not eligible for linking',
          'ACCOUNT_DISABLED'
        );
      if (!user.password_hash)
        throw new AppError(
          400,
          'Use your existing Google sign-in. Replacing an identity is not supported here.',
          'PASSWORD_NOT_CONFIGURED'
        );
      if (!(await verifyPassword(input.currentPassword, user.password_hash)))
        throw new AppError(
          400,
          'Current password is incorrect',
          'INVALID_PASSWORD'
        );
      if (user.email.toLowerCase() !== identity.email.toLowerCase())
        throw new AppError(
          409,
          'Choose the Google account with the same email as your EcoNexus account',
          'GOOGLE_EMAIL_MISMATCH'
        );
      if (user.google_id && user.google_id !== identity.sub)
        throw new AppError(
          409,
          'A different Google identity is already connected',
          'GOOGLE_IDENTITY_CONFLICT'
        );
      const owner = await client.query(
        'SELECT id FROM users WHERE google_id = $1 AND id <> $2',
        [identity.sub, userId]
      );
      if (owner.rows.length)
        throw new AppError(
          409,
          'This Google identity is already connected to another account',
          'GOOGLE_IDENTITY_CONFLICT'
        );
      await client.query(
        'UPDATE users SET google_id = $1, token_version = token_version + 1, updated_at = NOW() WHERE id = $2',
        [identity.sub, userId]
      );
      await client.query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
        [userId]
      );
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, target_id, meta) VALUES ($1, $2, $3, $4)',
        [userId, 'GOOGLE_IDENTITY_LINKED', userId, { provider: 'google' }]
      );
      await client.query('COMMIT');
      return { googleLinked: true as const, signInRequired: true as const };
    } catch (error) {
      await client.query('ROLLBACK');
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      )
        throw new AppError(
          409,
          'This Google identity is already connected',
          'GOOGLE_IDENTITY_CONFLICT'
        );
      throw error;
    } finally {
      client.release();
    }
  }
}
