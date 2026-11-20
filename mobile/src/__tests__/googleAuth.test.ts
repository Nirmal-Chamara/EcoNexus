import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, expect, jest, test } from '@jest/globals';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { env } from '../config/env';
import { useAuth } from '../hooks/useAuth';
import * as AuthSession from 'expo-auth-session';

jest.mock('../hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'request-nonce-123456789' }));
jest.mock('expo-auth-session', () => ({
  loadAsync: jest.fn(),
  makeRedirectUri: () => 'econexus://',
  ResponseType: { IdToken: 'id_token' },
}));
jest.mock('../config/env', () => ({
  env: {
    IS_DEV: true,
    GOOGLE_WEB_CLIENT_ID: '',
    GOOGLE_ANDROID_CLIENT_ID: '',
    GOOGLE_IOS_CLIENT_ID: '',
  },
}));
const signIn = jest.fn<() => Promise<void>>();
beforeEach(() => {
  jest.clearAllMocks();
  env.GOOGLE_WEB_CLIENT_ID = '';
  env.GOOGLE_ANDROID_CLIENT_ID = '';
  env.GOOGLE_IOS_CLIENT_ID = '';
  jest.mocked(useAuth).mockReturnValue({ signInWithGoogle: signIn } as never);
});
test('missing platform configuration never signs in as a demo account, including development', async () => {
  const { result } = renderHook(() => useGoogleAuth());
  await act(async () => {
    await result.current.promptGoogleSignIn();
  });
  expect(result.current.isConfigured).toBe(false);
  expect(result.current.error).toBeTruthy();
  expect(signIn).not.toHaveBeenCalled();
  expect(AuthSession.loadAsync).not.toHaveBeenCalled();
});

test('linking delivers Google proof and nonce to its callback without replacing the signed-in session', async () => {
  env.GOOGLE_WEB_CLIENT_ID =
    env.GOOGLE_IOS_CLIENT_ID =
    env.GOOGLE_ANDROID_CLIENT_ID =
      'platform-client';
  jest
    .mocked(AuthSession.loadAsync)
    .mockResolvedValue({
      promptAsync: async () => ({ type: 'success', params: { id_token: 'provider-token' } }),
    } as never);
  const onIdentity = jest.fn<(token: string, nonce: string) => Promise<void>>();
  const { result } = renderHook(() => useGoogleAuth({ onIdentity }));
  await act(async () => {
    await result.current.promptGoogleSignIn();
  });
  expect(onIdentity).toHaveBeenCalledWith('provider-token', 'request-nonce-123456789');
  expect(signIn).not.toHaveBeenCalled();
});

test('normal sign-in passes the request nonce with the verified-token exchange', async () => {
  env.GOOGLE_WEB_CLIENT_ID =
    env.GOOGLE_IOS_CLIENT_ID =
    env.GOOGLE_ANDROID_CLIENT_ID =
      'platform-client';
  jest
    .mocked(AuthSession.loadAsync)
    .mockResolvedValue({
      promptAsync: async () => ({ type: 'success', params: { id_token: 'provider-token' } }),
    } as never);
  const { result } = renderHook(() => useGoogleAuth());
  await act(async () => {
    await result.current.promptGoogleSignIn(true, 'COLLECTOR');
  });
  expect(signIn).toHaveBeenCalledWith(
    'provider-token',
    true,
    'COLLECTOR',
    'request-nonce-123456789'
  );
});

test('provider cancellation does not invoke linking or sign-in', async () => {
  env.GOOGLE_WEB_CLIENT_ID =
    env.GOOGLE_IOS_CLIENT_ID =
    env.GOOGLE_ANDROID_CLIENT_ID =
      'platform-client';
  jest
    .mocked(AuthSession.loadAsync)
    .mockResolvedValue({ promptAsync: async () => ({ type: 'cancel' }) } as never);
  const onIdentity = jest.fn<(token: string, nonce: string) => Promise<void>>();
  const { result } = renderHook(() => useGoogleAuth({ onIdentity }));
  await act(async () => {
    await result.current.promptGoogleSignIn();
  });
  expect(onIdentity).not.toHaveBeenCalled();
  expect(signIn).not.toHaveBeenCalled();
  expect(result.current.isLoading).toBe(false);
});
