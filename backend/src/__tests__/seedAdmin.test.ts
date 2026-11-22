import { pool } from '../config/database';
import { env } from '../config/env';
import { seedAdmin } from '../scripts/seedAdmin';
import { hashPassword } from '../utils/password';

jest.mock('../config/database', () => ({
  pool: { connect: jest.fn(), end: jest.fn() },
}));
jest.mock('../config/env', () => ({
  env: {
    ADMIN_EMAIL: 'operator@example.test',
    ADMIN_PASSWORD: 'UniqueStrongAdmin58!',
    ADMIN_NAME: 'Admin',
    ADMIN_PROVISIONED_BY: 'test-operator',
    ADMIN_PROVISION_REASON: 'Initial setup',
  },
}));
jest.mock('../utils/password', () => ({ hashPassword: jest.fn() }));
let query: jest.Mock;
let existing: { id: string; role: string; status: string }[];
beforeEach(() => {
  jest.clearAllMocks();
  env.ADMIN_PASSWORD = 'UniqueStrongAdmin58!';
  env.ADMIN_PROVISIONED_BY = 'test-operator';
  existing = [];
  query = jest.fn(async (sql: string) => ({
    rows: sql.startsWith('SELECT id')
      ? existing
      : sql.includes('INSERT INTO users')
        ? [{ id: 'new-admin-id' }]
        : [],
  }));
  jest
    .mocked(pool.connect)
    .mockResolvedValue({ query, release: jest.fn() } as never);
  jest.mocked(hashPassword).mockResolvedValue('hashed-password');
});
it('creates an admin and durable audit in one transaction without closing the shared pool', async () => {
  await seedAdmin();
  expect(hashPassword).toHaveBeenCalledWith('UniqueStrongAdmin58!');
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO audit_logs'),
    [
      null,
      'ADMIN_PROVISIONED',
      'new-admin-id',
      {
        source: 'operator-cli',
        operator: 'test-operator',
        reason: 'Initial setup',
      },
    ]
  );
  expect(query).toHaveBeenLastCalledWith('COMMIT');
  expect(pool.end).not.toHaveBeenCalled();
});
it('is idempotent for an existing active admin without resetting its password', async () => {
  existing = [{ id: 'existing', role: 'ADMIN', status: 'ACTIVE' }];
  await seedAdmin();
  await seedAdmin();
  expect(hashPassword).not.toHaveBeenCalled();
  expect(query.mock.calls.some(([sql]) => /^(INSERT|UPDATE)/.test(sql))).toBe(
    false
  );
});
it.each(['USER', 'COLLECTOR', 'RECYCLING_CENTER'])(
  'refuses to promote an existing %s account',
  async (role) => {
    existing = [{ id: 'existing', role, status: 'ACTIVE' }];
    await expect(seedAdmin()).rejects.toMatchObject({
      code: 'ADMIN_IDENTITY_CONFLICT',
    });
    expect(query.mock.calls.some(([sql]) => /^(INSERT|UPDATE)/.test(sql))).toBe(
      false
    );
  }
);
it('does not reactivate a suspended administrator', async () => {
  existing = [{ id: 'existing', role: 'ADMIN', status: 'SUSPENDED' }];
  await expect(seedAdmin()).rejects.toMatchObject({
    code: 'ADMIN_IDENTITY_CONFLICT',
  });
});
it.each([
  '',
  'AdminPass123!',
  'short1A',
  'alllowercaseand123',
  'ExamplePassword123!',
])('rejects unsafe provisioning password %s', async (password) => {
  env.ADMIN_PASSWORD = password;
  await expect(seedAdmin()).rejects.toMatchObject({
    code: 'ADMIN_PROVISION_CONFIG',
  });
  expect(pool.connect).not.toHaveBeenCalled();
});
it('requires an accountable operator identity', async () => {
  env.ADMIN_PROVISIONED_BY = '';
  await expect(seedAdmin()).rejects.toMatchObject({
    code: 'ADMIN_PROVISION_CONFIG',
  });
});
it('rolls back provisioning when the audit cannot be saved', async () => {
  const implementation = query.getMockImplementation()!;
  query.mockImplementation(async (...args) => {
    if (args[0].includes('INSERT INTO audit_logs'))
      throw new Error('Audit unavailable');
    return implementation(...args);
  });
  await expect(seedAdmin()).rejects.toThrow('Audit unavailable');
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(query).not.toHaveBeenCalledWith('COMMIT');
});
