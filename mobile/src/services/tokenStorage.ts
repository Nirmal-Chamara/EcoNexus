import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keep the default keychain service to retain access to existing installations.
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const webMemory = new Map<string, string>();

const read = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : (webMemory.get(key) ?? null);
    } catch {
      return webMemory.get(key) ?? null;
    }
  }
  return SecureStore.getItemAsync(key, options);
};

const write = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch {}
    webMemory.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, options);
};

const remove = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {}
    webMemory.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key, options);
};

// ─────────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────────
const KEYS = {
  LEGACY_ACCESS_TOKEN: 'econexus_access_token',
  REFRESH_TOKEN: 'econexus_refresh_token',
  KEEP_SIGNED_IN: 'econexus_keep_signed_in',
  BIOMETRIC_ENABLED: 'econexus_biometric_enabled',
} as const;

let _memoryAccessToken: string | null = null;
let _memoryRefreshToken: string | null = null;
const accessListeners = new Set<(token: string | null) => void>();

export function subscribeAccessToken(listener: (token: string | null) => void): () => void {
  accessListeners.add(listener);
  listener(_memoryAccessToken);
  return () => {
    accessListeners.delete(listener);
  };
}

function setAccessToken(token: string | null): void {
  _memoryAccessToken = token;
  accessListeners.forEach((listener) => listener(token));
}

/**
 * Universal token storage using expo-secure-store (Native) and localStorage/webMemory (Web).
 */
export const tokenStorage = {
  // ── Preference ─────────────────────────────────────────────────

  async setKeepSignedIn(value: boolean): Promise<void> {
    await write(KEYS.KEEP_SIGNED_IN, value ? '1' : '0');
  },

  async getKeepSignedIn(): Promise<boolean> {
    const val = await read(KEYS.KEEP_SIGNED_IN);
    return val !== '0';
  },

  // ── Biometric preference ────────────────────────────────────────

  async setBiometricEnabled(value: boolean): Promise<void> {
    await write(KEYS.BIOMETRIC_ENABLED, value ? '1' : '0');
  },

  async getBiometricEnabled(): Promise<boolean> {
    const val = await read(KEYS.BIOMETRIC_ENABLED);
    return val === '1';
  },

  // ── Token persistence ───────────────────────────────────────────

  async saveTokens(accessToken: string, refreshToken: string, keepSignedIn = true): Promise<void> {
    await tokenStorage.saveRefresh(refreshToken, keepSignedIn);
    setAccessToken(accessToken);
  },

  async saveRefresh(refreshToken: string, keepSignedIn = true): Promise<void> {
    await remove(KEYS.LEGACY_ACCESS_TOKEN);
    await tokenStorage.setKeepSignedIn(keepSignedIn);
    if (keepSignedIn) {
      await write(KEYS.REFRESH_TOKEN, refreshToken);
      _memoryRefreshToken = null;
    } else {
      await remove(KEYS.REFRESH_TOKEN);
      _memoryRefreshToken = refreshToken;
    }
  },

  async getRefresh(): Promise<string | null> {
    return _memoryRefreshToken ?? (await read(KEYS.REFRESH_TOKEN));
  },

  /**
   * Retrieve the stored access token.
   */
  async getAccessToken(): Promise<string | null> {
    return _memoryAccessToken;
  },

  /**
   * Retrieve the refresh token from the correct storage location.
   */
  async getRefreshToken(): Promise<string | null> {
    return tokenStorage.getRefresh();
  },

  /**
   * Delete all stored auth tokens and reset memory slot.
   */
  async clearTokens(): Promise<void> {
    return tokenStorage.clear();
  },

  async clear(): Promise<void> {
    setAccessToken(null);
    _memoryRefreshToken = null;
    const results = await Promise.allSettled([
      remove(KEYS.REFRESH_TOKEN),
      remove(KEYS.LEGACY_ACCESS_TOKEN),
    ]);
    const failure = results.find((result) => result.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
  },
};

export const saveRefresh = tokenStorage.saveRefresh;
export const getRefresh = tokenStorage.getRefresh;
export const clear = tokenStorage.clear;
