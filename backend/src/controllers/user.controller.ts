import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import { hashPassword, verifyPassword } from '../utils/password';

export class UserController {
  /**
   * GET /api/users/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');

      const result = await pool.query(
        'SELECT id, name, email, phone, role, status, created_at, updated_at FROM users WHERE id = $1',
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
  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        values.push(phone);
      }

      if (fields.length === 0) {
        res.status(400).json({ message: 'No valid fields provided for update' });
        return;
      }

      fields.push(`updated_at = NOW()`);
      values.push(req.user.id);

      const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING id, name, email, phone, role, status, created_at, updated_at
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
      next(error);
    }
  }

  /**
   * PATCH /api/users/me/password
   */
  static async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');

      const { oldPassword, newPassword } = req.body;

      // 1. Get current password hash
      const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rows.length === 0) {
        throw new AppError(404, 'User not found', 'NOT_FOUND');
      }

      const user = userRes.rows[0];

      // 2. Verify old password
      const isValid = await verifyPassword(oldPassword, user.password_hash);
      if (!isValid) {
        throw new AppError(400, 'Invalid old password', 'INVALID_PASSWORD');
      }

      // 3. Hash new password and increment token_version to invalidate old sessions
      const newHash = await hashPassword(newPassword);

      await pool.query(
        'UPDATE users SET password_hash = $1, token_version = token_version + 1, updated_at = NOW() WHERE id = $2',
        [newHash, req.user.id]
      );

      res.status(200).json({
        message: 'Password updated successfully. Please log in again.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/me
   */
  static async deactivateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');

      // Update status to SUSPENDED (soft delete approach)
      await pool.query(
        `UPDATE users SET status = 'SUSPENDED', token_version = token_version + 1, updated_at = NOW() WHERE id = $1`,
        [req.user.id]
      );

      res.status(200).json({
        message: 'Account deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
