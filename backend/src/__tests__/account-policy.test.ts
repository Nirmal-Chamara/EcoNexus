import { pool } from '../config/database';
import {
  AccountPolicyService,
  ADMIN_GOVERNANCE_LOCK,
} from '../services/account-policy.service';
import type { AccountStatus, UserRole } from '../types/express';

jest.mock('../config/database', () => ({
  pool: { connect: jest.fn(), query: jest.fn() },
}));
const actorId = 'admin-id';
const targetId = 'target-id';
let actor: { id: string; role: UserRole; status: AccountStatus; email_verified_at: string | null };
let target: typeof actor;
let application: {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  organization_name?: string;
  registration_no?: string;
  document_url?: string;
};
let adminCount: number;
let query: jest.Mock;
let release: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  actor = { id: actorId, role: 'ADMIN', status: 'ACTIVE', email_verified_at: '2026-11-16' };
  target = { id: targetId, role: 'COLLECTOR', status: 'PENDING_VERIFICATION', email_verified_at: '2026-11-16' };
  application = {
    id: 'application-id',
    user_id: targetId,
    requested_role: 'COLLECTOR',
    status: 'PENDING',
    organization_name: 'Test Collectors',
    registration_no: 'REG123',
    document_url: 'https://private.example.test/document',
  };
  adminCount = 2;
  query = jest.fn(async (sql: string, values?: unknown[]) => {
    if (sql.startsWith('SELECT id, role, status'))
      return { rows: [values?.[0] === actorId ? actor : target] };
    if (sql.startsWith('SELECT COUNT'))
      return { rows: [{ count: adminCount }] };
    if (sql.startsWith('SELECT user_id'))
      return { rows: [{ user_id: targetId }] };
    if (sql.startsWith('SELECT * FROM verification_requests'))
      return { rows: [application] };
    if (sql.startsWith('UPDATE users SET status = $1'))
      return { rows: [{ ...target, status: values?.[0] }] };
    return { rows: [] };
  });
  release = jest.fn();
  jest.mocked(pool.connect).mockResolvedValue({ query, release } as never);
});

const noWrites = () =>
  expect(query.mock.calls.some(([sql]) => /^(UPDATE|INSERT)/.test(sql))).toBe(
    false
  );

it('cannot activate a pending partner using generic status changes', async () => {
  await expect(
    AccountPolicyService.updateStatus(
      actorId,
      targetId,
      'ACTIVE',
      'Bypass review'
    )
  ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
  noWrites();
});

it('cannot approve an application before actual email ownership proof', async () => {
  target.email_verified_at = null;
  await expect(AccountPolicyService.processVerification(actorId, application.id, 'APPROVED')).rejects.toMatchObject({ code: 'EMAIL_VERIFICATION_REQUIRED' });
  noWrites();
});
it('requires a reason for reactivation as well as suspension', async () => {
  await expect(
    AccountPolicyService.updateStatus(actorId, targetId, 'ACTIVE', ' ')
  ).rejects.toMatchObject({ code: 'REASON_REQUIRED' });
  expect(pool.connect).not.toHaveBeenCalled();
});
it('rejects generic rejection, reserving decisions for verification review', async () => {
  await expect(
    AccountPolicyService.updateStatus(actorId, targetId, 'REJECTED', 'Reject')
  ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
  noWrites();
});
it('rejects self status management', async () => {
  await expect(
    AccountPolicyService.updateStatus(actorId, actorId, 'SUSPENDED', 'Self')
  ).rejects.toMatchObject({ code: 'SELF_STATUS_CHANGE' });
  expect(pool.connect).not.toHaveBeenCalled();
});
it('rechecks actor privileges after acquiring the governance lock', async () => {
  actor.status = 'SUSPENDED';
  await expect(
    AccountPolicyService.updateStatus(actorId, targetId, 'SUSPENDED', 'Reason')
  ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  expect(query.mock.calls[1]).toEqual([
    'SELECT pg_advisory_xact_lock($1)',
    [ADMIN_GOVERNANCE_LOCK],
  ]);
  noWrites();
});
it('protects the last active admin through management status changes', async () => {
  target.role = 'ADMIN';
  target.status = 'ACTIVE';
  adminCount = 1;
  await expect(
    AccountPolicyService.updateStatus(actorId, targetId, 'SUSPENDED', 'Reason')
  ).rejects.toMatchObject({ code: 'LAST_ACTIVE_ADMIN' });
  noWrites();
});
it('protects the last active admin through self-deactivation', async () => {
  target.role = 'ADMIN';
  target.status = 'ACTIVE';
  adminCount = 1;
  await expect(
    AccountPolicyService.deactivateSelf(targetId)
  ).rejects.toMatchObject({ code: 'LAST_ACTIVE_ADMIN' });
  noWrites();
});
it('allows self-deactivation with another active admin and writes an audit record', async () => {
  target.role = 'ADMIN';
  target.status = 'ACTIVE';
  await AccountPolicyService.deactivateSelf(targetId);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO audit_logs'),
    [
      targetId,
      'ACCOUNT_SELF_DEACTIVATED',
      targetId,
      { previous_status: 'ACTIVE' },
    ]
  );
  expect(query).toHaveBeenLastCalledWith('COMMIT');
});
it.each(['PENDING', 'REJECTED'])(
  'cannot restore ACTIVE when the latest partner application is %s',
  async (status) => {
    target.status = 'SUSPENDED';
    application.status = status;
    await expect(
      AccountPolicyService.updateStatus(actorId, targetId, 'ACTIVE', 'Restore')
    ).rejects.toMatchObject({ code: 'PARTNER_REVIEW_REQUIRED' });
    noWrites();
  }
);
it('restores a reviewed partner and invalidates old credentials atomically', async () => {
  target.status = 'SUSPENDED';
  application.status = 'APPROVED';
  expect(
    await AccountPolicyService.updateStatus(
      actorId,
      targetId,
      'ACTIVE',
      ' Reinstated '
    )
  ).toMatchObject({ status: 'ACTIVE' });
  expect(query).toHaveBeenCalledWith(
    'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
    [targetId]
  );
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO audit_logs'),
    [
      actorId,
      'USER_STATUS_CHANGED_TO_ACTIVE',
      targetId,
      {
        previous_status: 'SUSPENDED',
        new_status: 'ACTIVE',
        reason: 'Reinstated',
      },
    ]
  );
  expect(query).toHaveBeenLastCalledWith('COMMIT');
});
it('can restore an unreviewed suspended partner only to pending', async () => {
  target.status = 'SUSPENDED';
  expect(
    await AccountPolicyService.updateStatus(
      actorId,
      targetId,
      'PENDING_VERIFICATION',
      'Resume review'
    )
  ).toMatchObject({ status: 'PENDING_VERIFICATION' });
});
it('ordinary users cannot be sent into partner review', async () => {
  target.role = 'USER';
  target.status = 'SUSPENDED';
  await expect(
    AccountPolicyService.updateStatus(
      actorId,
      targetId,
      'PENDING_VERIFICATION',
      'Review'
    )
  ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
});
it.each(['organization_name', 'registration_no', 'document_url'] as const)(
  'cannot approve an application missing %s',
  async (field) => {
    application[field] = '';
    await expect(
      AccountPolicyService.processVerification(
        actorId,
        application.id,
        'APPROVED'
      )
    ).rejects.toMatchObject({ code: 'APPLICATION_INCOMPLETE' });
    noWrites();
  }
);
it('cannot approve a suspended partner through an old pending request', async () => {
  target.status = 'SUSPENDED';
  await expect(
    AccountPolicyService.processVerification(
      actorId,
      application.id,
      'APPROVED'
    )
  ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
  noWrites();
});
it('rejects stale application decisions', async () => {
  await expect(
    AccountPolicyService.processVerification(
      actorId,
      'older-application',
      'APPROVED'
    )
  ).rejects.toMatchObject({ code: 'ALREADY_PROCESSED' });
  noWrites();
});
it('rejects duplicate processing', async () => {
  application.status = 'APPROVED';
  await expect(
    AccountPolicyService.processVerification(
      actorId,
      application.id,
      'APPROVED'
    )
  ).rejects.toMatchObject({ code: 'ALREADY_PROCESSED' });
  noWrites();
});
it('cannot approve a request for a role different from the account', async () => {
  application.requested_role = 'RECYCLING_CENTER';
  await expect(
    AccountPolicyService.processVerification(
      actorId,
      application.id,
      'APPROVED'
    )
  ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
  noWrites();
});
it('approves the latest complete request without changing its role', async () => {
  await AccountPolicyService.processVerification(
    actorId,
    application.id,
    'APPROVED'
  );
  expect(query).toHaveBeenCalledWith(
    "UPDATE users SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1",
    [targetId]
  );
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('UPDATE verification_requests'),
    ['APPROVED', actorId, null, application.id]
  );
  expect(query).toHaveBeenLastCalledWith('COMMIT');
});
it('rejects with the real reason, revokes sessions and audits the outcome', async () => {
  await AccountPolicyService.processVerification(
    actorId,
    application.id,
    'REJECTED',
    'Document expired'
  );
  expect(query).toHaveBeenCalledWith(
    'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
    [targetId]
  );
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('UPDATE verification_requests'),
    ['REJECTED', actorId, 'Document expired', application.id]
  );
});
it('rolls back state changes and session revocation if audit insertion fails', async () => {
  const implementation = query.getMockImplementation()!;
  query.mockImplementation(async (...args) => {
    if (args[0].startsWith('INSERT INTO audit_logs'))
      throw new Error('Audit unavailable');
    return implementation(...args);
  });
  await expect(
    AccountPolicyService.updateStatus(actorId, targetId, 'SUSPENDED', 'Abuse')
  ).rejects.toThrow('Audit unavailable');
  expect(query).not.toHaveBeenCalledWith('COMMIT');
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(release).toHaveBeenCalledTimes(1);
});
