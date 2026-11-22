import { Request, Response, NextFunction } from 'express';
import type { PoolClient } from 'pg';
import { pool } from '../config/database';
import { AccountPolicyService } from '../services/account-policy.service';
import { IdentityLinkService } from '../services/identity-link.service';
import { AppError } from '../utils/AppError';
import { hashPassword, verifyPassword } from '../utils/password';

export class UserController {
  static async getSignInMethods(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      res
        .status(200)
        .json({
          message: 'Sign-in methods retrieved',
          data: await IdentityLinkService.getMethods(req.user.id),
        });
    } catch (error) {
      next(error);
    }
  }

  static async linkGoogle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      const data = await IdentityLinkService.linkGoogle(req.user.id, req.body);
      res
        .status(200)
        .json({ message: 'Google connected. Please sign in again.', data });
    } catch (error) {
      next(error);
    }
  }
  /**
   * GET /api/users/me
   */
  static async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');

      const result = await pool.query(
        `SELECT
           u.id,
           u.name,
           u.email,
           u.phone,
           u.role,
           u.status,
           (u.email_verified_at IS NOT NULL) AS "emailVerified",
           u.created_at,
           u.updated_at,
           CASE WHEN u.status = 'REJECTED' THEN (
             SELECT v.review_note
             FROM verification_requests v
             WHERE v.user_id = u.id AND v.status = 'REJECTED'
             ORDER BY v.reviewed_at DESC NULLS LAST, v.created_at DESC
             LIMIT 1
           ) ELSE NULL END AS "rejectionReason"
         FROM users u
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'User not found', 'NOT_FOUND');
      }

      res.status(200).json({
        message: 'Profile retrieved successfully',
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/me
   */
  static async updateMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');

      const { name, phone } = req.body;
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(name);
      }
      if (phone !== undefined) {
        fields.push(`phone = $${idx++}`);
        values.push(phone || null);
      }

      if (fields.length === 0) {
        res
          .status(400)
          .json({ message: 'No valid fields provided for update' });
        return;
      }

      fields.push(`updated_at = NOW()`);
      values.push(req.user.id);

      const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING id, name, email, phone, role, status, created_at, updated_at, (email_verified_at IS NOT NULL) AS "emailVerified"
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new AppError(404, 'User not found', 'NOT_FOUND');
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        next(
          new AppError(409, 'Phone number is already in use', 'PHONE_EXISTS')
        );
        return;
      }
      next(error);
    }
  }

  /**
   * PATCH /api/users/me/password
   */
  static async updatePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    let client: PoolClient | undefined;
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');

      const { oldPassword, newPassword } = req.body;
      client = await pool.connect();
      await client.query('BEGIN');

      // 1. Get current password hash
      const userRes = await client.query(
        'SELECT password_hash FROM users WHERE id = $1 FOR UPDATE',
        [req.user.id]
      );
      if (userRes.rows.length === 0) {
        throw new AppError(404, 'User not found', 'NOT_FOUND');
      }

      const user = userRes.rows[0];
      if (!user.password_hash) {
        throw new AppError(
          400,
          'This account has no password. Use your linked sign-in provider.',
          'PASSWORD_NOT_CONFIGURED'
        );
      }

      // 2. Verify old password
      const isValid = await verifyPassword(oldPassword, user.password_hash);
      if (!isValid) {
        throw new AppError(400, 'Invalid old password', 'INVALID_PASSWORD');
      }

      // 3. Hash new password and increment token_version to invalidate old sessions
      const newHash = await hashPassword(newPassword);

      await client.query(
        'UPDATE users SET password_hash = $1, token_version = token_version + 1, updated_at = NOW() WHERE id = $2',
        [newHash, req.user.id]
      );
      await client.query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
        [req.user.id]
      );
      await client.query('COMMIT');

      res.status(200).json({
        message: 'Password updated successfully. Please log in again.',
      });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      next(error);
    } finally {
      client?.release();
    }
  }

  /**
   * DELETE /api/users/me
   */
  static async deactivateMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      await AccountPolicyService.deactivateSelf(req.user.id);
      res.status(200).json({ message: 'Account deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
