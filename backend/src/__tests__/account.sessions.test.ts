import type { Request, Response } from 'express';
import { pool } from '../config/database';
import { UserController } from '../controllers/user.controller';
import { AuthService } from '../services/auth.service';
import {
  verifyPassword,
  dummyVerifyPassword,
  hashPassword,
} from '../utils/password';

jest.mock('../config/database', () => ({
  pool: { connect: jest.fn(), query: jest.fn() },
}));
jest.mock('../utils/password', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
  dummyVerifyPassword: jest.fn(),
}));

let query: jest.Mock;
let release: jest.Mock;
const userId = '00000000-0000-0000-0000-000000000001';
const req = {
  user: { id: userId },
  body: { oldPassword: 'OldPassword1', newPassword: 'NewPassword1' },
} as unknown as Request;
let res: Response;
let next: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  query = jest.fn(async (sql: string) => ({
    rows: sql.includes('SELECT password_hash')
      ? [{ password_hash: 'old-hash' }]
      : sql.includes('SELECT id, role, status')
        ? [{ id: userId, role: 'USER', status: 'ACTIVE' }]
        : [],
  }));
  release = jest.fn();
  jest.mocked(pool.connect).mockResolvedValue({ query, release } as never);
  jest.mocked(verifyPassword).mockResolvedValue(true);
  jest.mocked(hashPassword).mockResolvedValue('new-hash');
  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  next = jest.fn();
});

it('changes a password and revokes all refresh sessions in the same transaction', async () => {
  await UserController.updatePassword(req, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining(
      'password_hash = $1, token_version = token_version + 1'
    ),
    ['new-hash', userId]
  );
  expect(query).toHaveBeenCalledWith(
    'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
    [userId]
  );
  expect(query).toHaveBeenLastCalledWith('COMMIT');
  expect(release).toHaveBeenCalledTimes(1);
  expect(res.status).toHaveBeenCalledWith(200);
});

it('rolls back password changes if refresh revocation fails', async () => {
  const implementation = query.getMockImplementation()!;
  query.mockImplementation(async (...args) => {
    if (args[0].startsWith('UPDATE refresh_tokens'))
      throw new Error('Database failure');
    return implementation(...args);
  });
  await UserController.updatePassword(req, res, next);
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Database failure' })
  );
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(query).not.toHaveBeenCalledWith('COMMIT');
  expect(res.status).not.toHaveBeenCalled();
});

it('rejects wrong passwords without invalidating any sessions', async () => {
  jest.mocked(verifyPassword).mockResolvedValue(false);
  await UserController.updatePassword(req, res, next);
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({ code: 'INVALID_PASSWORD' })
  );
  expect(query.mock.calls.some(([sql]) => sql.startsWith('UPDATE'))).toBe(
    false
  );
});

it('handles Google-only password changes without passing a null hash to bcrypt', async () => {
  query.mockImplementation(async (sql: string) => ({
    rows: sql.includes('SELECT password_hash') ? [{ password_hash: null }] : [],
  }));
  await UserController.updatePassword(req, res, next);
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({ code: 'PASSWORD_NOT_CONFIGURED' })
  );
  expect(verifyPassword).not.toHaveBeenCalled();
  expect(hashPassword).not.toHaveBeenCalled();
});

it('deactivates and revokes refresh tokens before confirming success', async () => {
  await UserController.deactivateMe(req, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining(
      "SET status = 'SUSPENDED', token_version = token_version + 1"
    ),
    [userId]
  );
  expect(query).toHaveBeenCalledWith(
    'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
    [userId]
  );
  expect(query).toHaveBeenLastCalledWith('COMMIT');
});

it('logout-all atomically invalidates access and refresh credentials', async () => {
  await AuthService.revokeAllUserSessions(userId);
  expect(query).toHaveBeenCalledWith(
    'UPDATE users SET token_version = token_version + 1 WHERE id = $1',
    [userId]
  );
  expect(query).toHaveBeenCalledWith(
    'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
    [userId]
  );
  expect(query).toHaveBeenLastCalledWith('COMMIT');
});

it('rolls back logout-all when revocation fails', async () => {
  query.mockImplementation(async (sql: string) => {
    if (sql.startsWith('UPDATE refresh_tokens'))
      throw new Error('Revocation failed');
    return { rows: [] };
  });
  await expect(AuthService.revokeAllUserSessions(userId)).rejects.toThrow(
    'Revocation failed'
  );
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(query).not.toHaveBeenCalledWith('COMMIT');
});

it('Google-only password login returns invalid credentials without a null-hash error', async () => {
  query.mockImplementation(async (sql: string) => ({
    rows: sql.includes('SELECT id, name, email, password_hash')
      ? [{ password_hash: null }]
      : [],
  }));
  await expect(
    AuthService.login({ email: 'google@example.com', password: 'guess' })
  ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  expect(verifyPassword).not.toHaveBeenCalled();
  expect(dummyVerifyPassword).toHaveBeenCalledWith('guess');
  expect(
    query.mock.calls.some(([sql]) => sql.includes('INSERT INTO refresh_tokens'))
  ).toBe(false);
});

it('keeps replay revocation committed instead of attempting rollback after commit', async () => {
  query.mockImplementation(async (sql: string) => ({
    rows: sql.includes('SELECT rt.id')
      ? [{ id: 'token-id', family_id: 'family-id', is_revoked: true }]
      : [],
  }));
  await expect(
    AuthService.rotateRefreshToken('replayed-token')
  ).rejects.toMatchObject({ code: 'TOKEN_REUSE_DETECTED' });
  expect(query).toHaveBeenLastCalledWith('COMMIT');
  expect(query).not.toHaveBeenCalledWith('ROLLBACK');
  expect(release).toHaveBeenCalledTimes(1);
});
