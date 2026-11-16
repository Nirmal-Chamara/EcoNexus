import { beforeEach, expect, jest, test } from '@jest/globals';
import type * as StorageModule from '../services/tokenStorage';

const disk = new Map<string, string>();
const mockGet = jest.fn(async (key: string) => disk.get(key) ?? null);
const mockSet = jest.fn(async (key: string, value: string) => {
  disk.set(key, value);
});
const mockDelete = jest.fn(async (key: string) => {
  disk.delete(key);
});
jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 7,
  getItemAsync: (...args: [string]) => mockGet(...args),
  setItemAsync: (...args: [string, string]) => mockSet(...args),
  deleteItemAsync: (...args: [string]) => mockDelete(...args),
}));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

beforeEach(() => {
  disk.clear();
  jest.clearAllMocks();
  jest.resetModules();
});
const load = () => jest.requireActual<typeof StorageModule>('../services/tokenStorage');

test('native refresh survives module restart while access token does not', async () => {
  await load().tokenStorage.saveTokens('access', 'refresh');
  expect(mockSet).toHaveBeenCalledWith('econexus_refresh_token', 'refresh', {
    keychainAccessible: 7,
  });
  expect(disk.has('econexus_access_token')).toBe(false);
  jest.resetModules();
  expect(await load().getRefresh()).toBe('refresh');
  expect(await load().tokenStorage.getAccessToken()).toBeNull();
  await load().clear();
  jest.resetModules();
  expect(await load().getRefresh()).toBeNull();
});

test('session-only refresh removes earlier persistent token and stays session-only after rotation', async () => {
  const { tokenStorage } = load();
  await tokenStorage.saveTokens('a', 'persistent');
  await tokenStorage.saveTokens('b', 'session', false);
  expect(await tokenStorage.getRefresh()).toBe('session');
  expect(await tokenStorage.getKeepSignedIn()).toBe(false);
  expect(disk.has('econexus_refresh_token')).toBe(false);
  jest.resetModules();
  expect(await load().getRefresh()).toBeNull();
});

test('web never invokes SecureStore and does not survive a reload', async () => {
  const native = jest.requireMock<{ Platform: { OS: string } }>('react-native');
  native.Platform.OS = 'web';
  await load().tokenStorage.saveTokens('access', 'refresh');
  expect(await load().getRefresh()).toBe('refresh');
  expect(mockSet).not.toHaveBeenCalled();
  expect(mockGet).not.toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalled();
  jest.resetModules();
  expect(await load().getRefresh()).toBeNull();
});

test('clear removes memory and attempts both deletions even if secure deletion fails', async () => {
  const { tokenStorage } = load();
  await tokenStorage.saveTokens('access', 'session', false);
  mockDelete.mockRejectedValueOnce(new Error('locked'));
  await expect(tokenStorage.clear()).rejects.toThrow('locked');
  expect(await tokenStorage.getAccessToken()).toBeNull();
  expect(await tokenStorage.getRefresh()).toBeNull();
  expect(mockDelete).toHaveBeenLastCalledWith('econexus_access_token', { keychainAccessible: 7 });
});
