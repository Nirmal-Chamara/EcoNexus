import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AppError } from '../utils/AppError';

export class AdminController {
  /**
   * GET /api/admin/users
   */
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, role, status, page = 1, limit = 20 } = req.query as any;
      const offset = (page - 1) * limit;

      const filters: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (search) {
        filters.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
        values.push(`%${search}%`);
        idx++;
      }
      if (role) {
        filters.push(`role = $${idx++}`);
        values.push(role);
      }
      if (status) {
        filters.push(`status = $${idx++}`);
        values.push(status);
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      values.push(limit, offset);
      const limitIdx = idx;
      const offsetIdx = idx + 1;

      const query = `
        SELECT id, name, email, phone, role, status, created_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const result = await pool.query(query, values);

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await pool.query(countQuery, values.slice(0, idx - 1));
      const total = parseInt(countResult.rows[0].count, 10);

      res.status(200).json({
        message: 'Users retrieved successfully',
        data: result.rows,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:id/status
   */
  static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { status } = req.body;
      const actorId = req.user?.id;

      // Update user status and bump token version to invalidate sessions
      const updateRes = await client.query(
        `UPDATE users 
         SET status = $1, token_version = token_version + 1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING id, name, email, status, role`,
        [status, id]
      );

      if (updateRes.rows.length === 0) {
        throw new AppError(404, 'User not found', 'NOT_FOUND');
      }

      const targetUser = updateRes.rows[0];

      // Audit Log
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, target_id, meta) VALUES ($1, $2, $3, $4)`,
        [
          actorId,
          `USER_STATUS_CHANGED_TO_${status}`,
          id,
          { previous_status: targetUser.status, new_status: status },
        ]
      );

      await client.query('COMMIT');

      res.status(200).json({
        message: `User status updated to ${status}`,
        data: targetUser,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * GET /api/admin/verifications
   */
  static async getVerifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page = 1, limit = 20 } = req.query as any;
      const offset = (page - 1) * limit;

      let whereClause = '';
      const values: any[] = [];
      let idx = 1;

      if (status) {
        whereClause = `WHERE v.status = $${idx++}`;
        values.push(status);
      }

      values.push(limit, offset);
      const limitIdx = idx;
      const offsetIdx = idx + 1;

      const query = `
        SELECT 
          v.id, v.requested_role, v.organization_name, v.registration_no, v.document_url, 
          v.status, v.created_at, 
          u.id as user_id, u.name as user_name, u.email as user_email
        FROM verification_requests v
        JOIN users u ON v.user_id = u.id
        ${whereClause}
        ORDER BY v.created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const result = await pool.query(query, values);

      const countQuery = `SELECT COUNT(*) FROM verification_requests v ${whereClause}`;
      const countResult = await pool.query(countQuery, values.slice(0, idx - 1));
      const total = parseInt(countResult.rows[0].count, 10);

      res.status(200).json({
        message: 'Verifications retrieved successfully',
        data: result.rows,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/verifications/:id/process
   */
  static async processVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { status, review_note } = req.body;
      const actorId = req.user?.id;

      // 1. Get verification request
      const vRes = await client.query(
        'SELECT * FROM verification_requests WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (vRes.rows.length === 0) {
        throw new AppError(404, 'Verification request not found', 'NOT_FOUND');
      }

      const verification = vRes.rows[0];
      if (verification.status !== 'PENDING') {
        throw new AppError(400, 'Verification request is already processed', 'ALREADY_PROCESSED');
      }

      // 2. Update verification request
      await client.query(
        `UPDATE verification_requests 
         SET status = $1, reviewed_by = $2, review_note = $3, reviewed_at = NOW() 
         WHERE id = $4`,
        [status, actorId, review_note, id]
      );

      // 3. Update user if APPROVED
      if (status === 'APPROVED') {
        await client.query(
          `UPDATE users 
           SET role = $1, status = 'ACTIVE', updated_at = NOW() 
           WHERE id = $2`,
          [verification.requested_role, verification.user_id]
        );
      } else if (status === 'REJECTED') {
         // Maybe set user status to REJECTED if they were pending verification?
         // In typical flows, the user stays USER and their verification is just rejected.
         // Let's assume they stay USER but status doesn't change unless we specifically want to.
      }

      // 4. Audit Log
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, target_id, meta) VALUES ($1, $2, $3, $4)`,
        [
          actorId,
          `VERIFICATION_${status}`,
          verification.user_id,
          { verification_id: id, requested_role: verification.requested_role, note: review_note },
        ]
      );

      await client.query('COMMIT');

      res.status(200).json({
        message: `Verification request ${status.toLowerCase()} successfully`,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }
}
