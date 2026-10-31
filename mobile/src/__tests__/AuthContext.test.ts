import React from 'react';
import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, renderHook, waitFor, configure } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { tokenStorage } from '../services/tokenStorage';
import { authenticateBiometric, canUseBiometrics } from '../services/biometric';
configure({ asyncUtilTimeout: 2500 });

let mockListener: (token: string | null) => void = () => {};
jest.mock('../services/tokenStorage', () => ({
  subscribeAccessToken: jest.fn((listener: typeof mockListener) => {
    mockListener = listener;
    return () => {
      mockListener = () => {};
    };
  }),
  tokenStorage: {
    getRefreshToken: jest.fn(),
    getBiometricEnabled: jest.fn(),
    getKeepSignedIn: jest.fn(),
    setKeepSignedIn: jest.fn(),
    saveTokens: jest.fn(),
    clearTokens: jest.fn(),
    setBiometricEnabled: jest.fn(),
  },
}));
jest.mock('../services/auth.service', () => ({
  authService: { login: jest.fn(), register: jest.fn(), logout: jest.fn(), refresh: jest.fn() },
}));
jest.mock('../services/user.service', () => ({ userService: { getMe: jest.fn() } }));
jest.mock('../services/api', () => ({
  registerForceLogoutHandler: jest.fn(() => () => {}),
  logoutReasonForError: jest.fn(() => 'SESSION_EXPIRED'),
}));
jest.mock('../services/biometric', () => ({
  authenticateBiometric: jest.fn(),
  canUseBiometrics: jest.fn(),
}));

const user = {
  id: 'user',
  name: 'Test',
  email: 'test@example.com',
  role: 'USER',
  status: 'ACTIVE',
} as const;
const session = { user, accessToken: 'access', refreshToken: 'refresh' };
const credentials = { email: user.email, password: 'Password1' };
const auth = jest.mocked(authService);
const storage = jest.mocked(tokenStorage);
const biometric = {
  authenticate: jest.mocked(authenticateBiometric),
  canUse: jest.mocked(canUseBiometrics),
};
function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthProvider, null, children);
}
beforeEach(() => {
  jest.clearAllMocks();
  storage.getRefreshToken.mockResolvedValue(null);
  storage.getBiometricEnabled.mockResolvedValue(false);
  storage.getKeepSignedIn.mockResolvedValue(true);
  biometric.canUse.mockResolvedValue(true);
  biometric.authenticate.mockResolvedValue(true);
  storage.saveTokens.mockImplementation(async (token) => {
    mockListener(token);
  });
  storage.clearTokens.mockImplementation(async () => {
    mockListener(null);
  });
  auth.login.mockResolvedValue(session);
  auth.register.mockResolvedValue(session);
});

test('boots signed out and exposes backwards-compatible actions', async () => {
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedOut'));
  expect(result.current.accessToken).toBeNull();
  expect(result.current.login).toBe(result.current.signIn);
  expect(result.current.register).toBe(result.current.signUp);
  expect(result.current.logout).toBe(result.current.signOut);
});

test('restores tokens then profile while keeping splash for at least one second', async () => {
  storage.getRefreshToken.mockResolvedValue('stored');
  auth.refresh.mockResolvedValue({ accessToken: 'restored', refreshToken: 'rotated' });
  jest
    .mocked(userService.getMe)
    .mockResolvedValue({ ...user, phone: null, created_at: 'now', updated_at: 'now' });
  const started = Date.now();
  const { result } = renderHook(useAuth, { wrapper });
  expect(result.current.status).toBe('loading');
  await waitFor(() => expect(result.current.status).toBe('signedIn'));
  expect(Date.now() - started).toBeGreaterThanOrEqual(990);
  expect(auth.refresh).toHaveBeenCalledWith('stored');
  expect(storage.saveTokens).toHaveBeenCalledWith('restored', 'rotated', true);
  expect(result.current.accessToken).toBe('restored');
  expect(result.current.user?.id).toBe(user.id);
});

test('authenticates before reading a persisted refresh token', async () => {
  const events: string[] = [];
  storage.getBiometricEnabled.mockImplementation(async () => {
    events.push('setting');
    return true;
  });
  biometric.canUse.mockImplementation(async () => {
    events.push('availability');
    return true;
  });
  biometric.authenticate.mockImplementation(async () => {
    events.push('authenticate');
    return true;
  });
  storage.getRefreshToken.mockImplementation(async () => {
    events.push('refresh-token');
    return 'stored';
  });
  auth.refresh.mockImplementation(async () => {
    events.push('refresh');
    return { accessToken: 'restored', refreshToken: 'rotated' };
  });
  jest
    .mocked(userService.getMe)
    .mockResolvedValue({ ...user, phone: null, created_at: 'now', updated_at: 'now' });

  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedIn'));

  expect(events).toEqual(['setting', 'availability', 'authenticate', 'refresh-token', 'refresh']);
});

test('denied biometrics falls back to password without using the refresh token', async () => {
  storage.getBiometricEnabled.mockResolvedValue(true);
  biometric.canUse.mockResolvedValue(true);
  biometric.authenticate.mockResolvedValue(false);
  storage.getRefreshToken.mockResolvedValue('stored');

  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedOut'));

  expect(storage.getRefreshToken).not.toHaveBeenCalled();
  expect(auth.refresh).not.toHaveBeenCalled();
});

test('unsupported biometrics falls back to password and disables the stale setting', async () => {
  storage.getBiometricEnabled.mockResolvedValue(true);
  biometric.canUse.mockResolvedValue(false);
  storage.getRefreshToken.mockResolvedValue('stored');

  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedOut'));

  expect(storage.setBiometricEnabled).toHaveBeenCalledWith(false);
  expect(storage.getRefreshToken).not.toHaveBeenCalled();
  expect(auth.refresh).not.toHaveBeenCalled();
});

test('failed restoration clears partial tokens and leaves the splash even if storage fails', async () => {
  storage.getRefreshToken.mockResolvedValue('stored');
  auth.refresh.mockRejectedValueOnce(new Error('offline'));
  storage.clearTokens.mockRejectedValueOnce(new Error('storage locked'));
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedOut'));
  expect(storage.clearTokens).toHaveBeenCalled();
  expect(result.current.accessToken).toBeNull();
});

test('temporary network failure during restoration preserves the persisted refresh token', async () => {
  storage.getRefreshToken.mockResolvedValue('stored');
  auth.refresh.mockRejectedValueOnce({
    isAxiosError: true,
    request: {},
    message: 'Network Error',
  });

  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedOut'));

  expect(storage.clearTokens).not.toHaveBeenCalled();
  expect(result.current.logoutReason).toBeNull();
});

test('login and token rotation update state; logout clears session despite network failure', async () => {
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedOut'));
  await act(() => result.current.login(credentials, false));
  expect(result.current.user).toEqual(user);
  expect(result.current.accessToken).toBe('access');
  expect(storage.saveTokens).toHaveBeenCalledWith('access', 'refresh', false);
  act(() => mockListener('rotated'));
  expect(result.current.accessToken).toBe('rotated');
  storage.getRefreshToken.mockResolvedValue('refresh');
  auth.logout.mockRejectedValue(new Error('offline'));
  await act(() => result.current.logout());
  expect(result.current.status).toBe('signedOut');
  expect(result.current.user).toBeNull();
  expect(result.current.accessToken).toBeNull();
});

test('register signs in and failed login propagates without signing in', async () => {
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedOut'));
  auth.login.mockRejectedValueOnce(new Error('invalid'));
  await act(async () => {
    await expect(result.current.login(credentials)).rejects.toThrow('invalid');
  });
  expect(result.current.status).toBe('signedOut');
  await act(() => result.current.register({ ...credentials, name: user.name, role: 'USER' }));
  expect(result.current.status).toBe('signedIn');
});

test('forceLogout preserves reason and clears context even if secure deletion fails', async () => {
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedOut'));
  await act(() => result.current.login(credentials));
  storage.clearTokens.mockRejectedValueOnce(new Error('locked'));
  await act(async () => {
    await expect(result.current.forceLogout('SUSPENDED')).rejects.toThrow('locked');
  });
  expect(result.current.status).toBe('signedOut');
  expect(result.current.logoutReason).toBe('SUSPENDED');
  expect(result.current.accessToken).toBeNull();
});

test('refreshUser replaces profile while keeping the access token', async () => {
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedOut'));
  await act(() => result.current.login(credentials));
  const profile = {
    ...user,
    name: 'Updated',
    phone: null,
    created_at: '2026-10-27',
    updated_at: '2026-10-27',
  };
  jest.mocked(userService.getMe).mockResolvedValueOnce(profile);
  await act(() => result.current.refreshUser());
  expect(result.current.user).toEqual(profile);
  expect(result.current.accessToken).toBe('access');
});

test('late refreshUser response cannot restore a logged-out session', async () => {
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('signedOut'));
  await act(() => result.current.login(credentials));
  const profile = { ...user, phone: null, created_at: '2026-10-27', updated_at: '2026-10-27' };
  let resolveProfile!: (value: typeof profile) => void;
  jest.mocked(userService.getMe).mockReturnValueOnce(
    new Promise((resolve) => {
      resolveProfile = resolve;
    })
  );
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.refreshUser();
  });
  await act(() => result.current.logout());
  await act(async () => {
    resolveProfile(profile);
    await pending;
  });
  expect(result.current.status).toBe('signedOut');
});
