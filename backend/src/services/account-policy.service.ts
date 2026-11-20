import type { PoolClient } from 'pg';
import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import type { AccountStatus, UserRole } from '../types/express';

interface Account {
  id: string;
  role: UserRole;
  status: AccountStatus;
  email_verified_at?: string | null;
}
export const ADMIN_GOVERNANCE_LOCK = 51904002;

export async function accountTransaction<T>(
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize administrative status/provisioning and self-deactivation before
    // taking user locks, so simultaneous actions cannot remove the last admin.
    await client.query('SELECT pg_advisory_xact_lock($1)', [
      ADMIN_GOVERNANCE_LOCK,
    ]);
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function lockAccount(client: PoolClient, id: string): Promise<Account> {
  const result = await client.query(
    'SELECT id, role, status, email_verified_at FROM users WHERE id = $1 FOR UPDATE',
    [id]
  );
  if (!result.rows.length)
    throw new AppError(404, 'User not found', 'NOT_FOUND');
  return result.rows[0];
}

async function requireAdministrator(client: PoolClient, actorId: string) {
  const actor = await lockAccount(client, actorId);
  if (!actor.email_verified_at)
    throw new AppError(
      403,
      'Administrator email must be verified',
      'EMAIL_VERIFICATION_REQUIRED'
    );
  if (actor.role !== 'ADMIN' || actor.status !== 'ACTIVE')
    throw new AppError(
      403,
      'Active administrator access required',
      'FORBIDDEN'
    );
}

async function protectLastAdmin(client: PoolClient, target: Account) {
  if (
    target.role !== 'ADMIN' ||
    target.status !== 'ACTIVE' ||
    !target.email_verified_at
  )
    return;
  const result = await client.query(
    "SELECT COUNT(*)::int AS count FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE' AND email_verified_at IS NOT NULL"
  );
  if (Number(result.rows[0].count) <= 1)
    throw new AppError(
      409,
      'The last active administrator cannot be deactivated',
      'LAST_ACTIVE_ADMIN'
    );
}

async function latestApplication(client: PoolClient, userId: string) {
  const result = await client.query(
    'SELECT * FROM verification_requests WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE',
    [userId]
  );
  return result.rows[0];
}

function requireCompleteApplication(application: {
  organization_name?: string;
  registration_no?: string;
  document_url?: string;
}) {
  let documentIsHttps = false;
  try {
    documentIsHttps =
      new URL(application.document_url || '').protocol === 'https:';
  } catch {
    /* Missing/malformed document. */
  }
  if (
    !application.organization_name?.trim() ||
    !application.registration_no?.trim() ||
    !documentIsHttps
  ) {
    throw new AppError(
      409,
      'Complete organization details, registration number and supporting document are required before approval',
      'APPLICATION_INCOMPLETE'
    );
  }
}

async function revokeRefresh(client: PoolClient, id: string) {
  await client.query(
    'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
    [id]
  );
}

export class AccountPolicyService {
  static async updateStatus(
    actorId: string,
    id: string,
    status: AccountStatus,
    reason?: string
  ) {
    if (actorId === id)
      throw new AppError(
        400,
        'You cannot change your own account status',
        'SELF_STATUS_CHANGE'
      );
    if (!reason?.trim())
      throw new AppError(
        400,
        'A reason is required for account status changes',
        'REASON_REQUIRED'
      );
    return accountTransaction(async (client) => {
      await requireAdministrator(client, actorId);
      const target = await lockAccount(client, id);
      if (status === 'ACTIVE' && !target.email_verified_at)
        throw new AppError(
          409,
          'Verify the account email before restoring access',
          'EMAIL_VERIFICATION_REQUIRED'
        );
      const partner =
        target.role === 'COLLECTOR' || target.role === 'RECYCLING_CENTER';
      if (status === target.status)
        throw new AppError(
          409,
          'Account already has this status',
          'INVALID_STATUS_TRANSITION'
        );
      if (
        status === 'REJECTED' ||
        !['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'].includes(status)
      ) {
        throw new AppError(
          409,
          'Use application review to approve or reject partners',
          'INVALID_STATUS_TRANSITION'
        );
      }
      if (status === 'SUSPENDED') {
        await protectLastAdmin(client, target);
      } else if (target.status !== 'SUSPENDED') {
        throw new AppError(
          409,
          'Only suspended accounts can be restored here; use the verification queue for partner decisions',
          'INVALID_STATUS_TRANSITION'
        );
      } else if (partner) {
        const application = await latestApplication(client, id);
        const expected = status === 'ACTIVE' ? 'APPROVED' : 'PENDING';
        if (
          !application ||
          application.status !== expected ||
          application.requested_role !== target.role
        ) {
          throw new AppError(
            409,
            'The latest partner application does not permit this restoration',
            'PARTNER_REVIEW_REQUIRED'
          );
        }
        if (status === 'ACTIVE') requireCompleteApplication(application);
      } else if (status !== 'ACTIVE') {
        throw new AppError(
          409,
          'This account cannot enter partner verification',
          'INVALID_STATUS_TRANSITION'
        );
      }
      const updated = await client.query(
        'UPDATE users SET status = $1, token_version = token_version + 1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, status, role',
        [status, id]
      );
      await revokeRefresh(client, id);
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, target_id, meta) VALUES ($1, $2, $3, $4)',
        [
          actorId,
          `USER_STATUS_CHANGED_TO_${status}`,
          id,
          {
            previous_status: target.status,
            new_status: status,
            reason: reason.trim(),
          },
        ]
      );
      return updated.rows[0];
    });
  }

  static async processVerification(
    actorId: string,
    id: string,
    status: 'APPROVED' | 'REJECTED',
    note?: string
  ) {
    if (!['APPROVED', 'REJECTED'].includes(status))
      throw new AppError(400, 'Invalid review decision', 'VALIDATION_ERROR');
    if (status === 'REJECTED' && !note?.trim())
      throw new AppError(
        400,
        'A rejection reason is required',
        'REASON_REQUIRED'
      );
    return accountTransaction(async (client) => {
      await requireAdministrator(client, actorId);
      const reference = await client.query(
        'SELECT user_id FROM verification_requests WHERE id = $1',
        [id]
      );
      if (!reference.rows.length)
        throw new AppError(404, 'Verification request not found', 'NOT_FOUND');
      const target = await lockAccount(client, reference.rows[0].user_id);
      const application = await latestApplication(client, target.id);
      if (
        !application ||
        application.id !== id ||
        application.status !== 'PENDING'
      )
        throw new AppError(
          409,
          'Only the latest pending application can be reviewed',
          'ALREADY_PROCESSED'
        );
      if (
        target.status !== 'PENDING_VERIFICATION' ||
        !['COLLECTOR', 'RECYCLING_CENTER'].includes(target.role) ||
        application.requested_role !== target.role
      ) {
        throw new AppError(
          409,
          'Account state does not permit this partner decision',
          'INVALID_STATUS_TRANSITION'
        );
      }
      if (status === 'APPROVED') requireCompleteApplication(application);
      if (status === 'APPROVED' && !target.email_verified_at)
        throw new AppError(
          409,
          'Applicant email must be verified before approval',
          'EMAIL_VERIFICATION_REQUIRED'
        );
      await client.query(
        'UPDATE verification_requests SET status = $1, reviewed_by = $2, review_note = $3, reviewed_at = NOW() WHERE id = $4',
        [status, actorId, note?.trim() || null, id]
      );
      if (status === 'APPROVED') {
        // Role is unchanged: the current restricted session may refresh profile.
        await client.query(
          "UPDATE users SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1",
          [target.id]
        );
      } else {
        await client.query(
          "UPDATE users SET status = 'REJECTED', token_version = token_version + 1, updated_at = NOW() WHERE id = $1",
          [target.id]
        );
        await revokeRefresh(client, target.id);
      }
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, target_id, meta) VALUES ($1, $2, $3, $4)',
        [
          actorId,
          `VERIFICATION_${status}`,
          target.id,
          {
            verification_id: id,
            requested_role: target.role,
            note: note?.trim() || null,
          },
        ]
      );
    });
  }

  static async deactivateSelf(id: string) {
    return accountTransaction(async (client) => {
      const target = await lockAccount(client, id);
      await protectLastAdmin(client, target);
      await client.query(
        "UPDATE users SET status = 'SUSPENDED', token_version = token_version + 1, updated_at = NOW() WHERE id = $1",
        [id]
      );
      await revokeRefresh(client, id);
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, target_id, meta) VALUES ($1, $2, $3, $4)',
        [id, 'ACCOUNT_SELF_DEACTIVATED', id, { previous_status: target.status }]
      );
    });
  }
}
