import { expect, jest, test, beforeEach } from '@jest/globals';
import { authApi } from '../api/auth.api';
import { usersApi } from '../api/users.api';
import { adminApi } from '../api/admin.api';

const mockRequest = jest.fn<(...args: unknown[]) => Promise<unknown>>();
jest.mock('../services/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockRequest('GET', ...args),
    post: (...args: unknown[]) => mockRequest('POST', ...args),
    patch: (...args: unknown[]) => mockRequest('PATCH', ...args),
    delete: (...args: unknown[]) => mockRequest('DELETE', ...args),
  },
}));

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({ data: { message: 'ok', data: { id: 'id' } } });
});

const cases: [string, string, () => Promise<unknown>][] = [
  ['POST', '/auth/login', () => authApi.login({ email: 'a@example.com', password: 'password' })],
  [
    'POST',
    '/auth/register',
    () =>
      authApi.register({
        name: 'Test',
        email: 'a@example.com',
        password: 'Password1',
        role: 'USER',
      }),
  ],
  ['POST', '/auth/refresh-token', () => authApi.refresh('refresh')],
  ['POST', '/auth/logout', () => authApi.logout('refresh')],
  ['POST', '/auth/logout-all', () => authApi.logoutAll()],
  ['POST', '/auth/forgot-password', () => authApi.requestPasswordReset('a@example.com')],
  ['POST', '/auth/reset-password', () => authApi.resetPassword('reset', 'Password1')],
  ['GET', '/users/me', () => usersApi.getMe()],
  ['PATCH', '/users/me', () => usersApi.updateMe({ name: 'Changed' })],
  [
    'PATCH',
    '/users/me/password',
    () => usersApi.changePassword({ oldPassword: 'Old1', newPassword: 'New1' }),
  ],
  ['DELETE', '/users/me', () => usersApi.deactivateMe()],
  ['GET', '/admin/users', () => adminApi.getUsers()],
  ['GET', '/admin/users/id', () => adminApi.getUser('id')],
  ['GET', '/admin/verifications', () => adminApi.getVerifications()],
  ['PATCH', '/admin/users/id/status', () => adminApi.updateUserStatus('id', 'SUSPENDED', 'Test')],
  [
    'PATCH',
    '/admin/verifications/id/process',
    () => adminApi.processVerification('id', { status: 'APPROVED' }),
  ],
];
test.each(cases)(
  '%s %s uses the backend route and propagates errors',
  async (method, path, call) => {
    await call();
    expect(mockRequest.mock.calls[0].slice(0, 2)).toEqual([method, path]);
    mockRequest.mockRejectedValueOnce(new Error('backend error'));
    await expect(call()).rejects.toThrow('backend error');
  }
);
test('profile unwraps data; admin lists preserve pagination', async () => {
  expect(await usersApi.getMe()).toEqual({ id: 'id' });
  const payload = {
    message: 'ok',
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  };
  mockRequest.mockResolvedValueOnce({ data: payload });
  expect(await adminApi.getUsers()).toEqual(payload);
});
