import { expect, jest, test, afterEach } from '@jest/globals';
import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosAdapter } from 'axios';
import { apiClient, registerForceLogoutHandler } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';

jest.mock('../services/tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn(async () => 'access'),
    clearTokens: jest.fn(async () => {}),
    getRefreshToken: jest.fn(async () => null),
  },
}));
const originalAdapter = apiClient.defaults.adapter;
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  jest.clearAllMocks();
});

function failure(status: number, code: string): AxiosAdapter {
  return async (config) => {
    throw new AxiosError('Denied', 'ERR_BAD_REQUEST', config, undefined, {
      data: { message: 'Denied', code },
      status,
      statusText: 'Denied',
      headers: new AxiosHeaders(),
      config,
    });
  };
}

test('disabled account forces suspended logout even when secure deletion fails', async () => {
  const handler = jest.fn();
  const unsubscribe = registerForceLogoutHandler(handler);
  apiClient.defaults.adapter = failure(403, 'ACCOUNT_DISABLED');
  jest.mocked(tokenStorage.clearTokens).mockRejectedValueOnce(new Error('locked'));
  await expect(apiClient.get('/users/me')).rejects.toThrow();
  expect(handler).toHaveBeenCalledWith('SUSPENDED');
  unsubscribe();
});

test('ordinary permission denial and rejected login do not force logout', async () => {
  const handler = jest.fn();
  const unsubscribe = registerForceLogoutHandler(handler);
  apiClient.defaults.adapter = failure(403, 'FORBIDDEN');
  await expect(apiClient.get('/admin/users')).rejects.toThrow();
  apiClient.defaults.adapter = failure(403, 'ACCOUNT_DISABLED');
  await expect(apiClient.post('/auth/login')).rejects.toThrow();
  expect(handler).not.toHaveBeenCalled();
  unsubscribe();
});

test('401 with no refresh token forces session-expired logout', async () => {
  const handler = jest.fn();
  const unsubscribe = registerForceLogoutHandler(handler);
  apiClient.defaults.adapter = failure(401, 'TOKEN_EXPIRED');
  await expect(apiClient.get('/users/me')).rejects.toThrow();
  expect(handler).toHaveBeenCalledWith('SESSION_EXPIRED');
  unsubscribe();
});
