import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keep the default keychain service to retain access to existing installations.
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const webMemory = new Map<string, string>();
const read = (key: string): Promise<string | null> =>
  Platform.OS === 'web'
    ? Promise.resolve(webMemory.get(key) ?? null)
    : SecureStore.getItemAsync(key, options);
const write = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    webMemory.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, options);
};
const remove = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
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
const _memoryStorage = new Map<string, string>();

const isWeb = Platform.OS === 'web';

async function storageGet(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : (_memoryStorage.get(key) ?? null);
    } catch {
      return _memoryStorage.get(key) ?? null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return _memoryStorage.get(key) ?? null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  _memoryStorage.set(key, value);
  if (isWeb) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {}
}

async function storageDelete(key: string): Promise<void> {
  _memoryStorage.delete(key);
  if (isWeb) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {}
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
}

/**
 * Universal token storage using expo-secure-store (Native) and localStorage (Web).
 */
export const tokenStorage = {
  // ── Preference ─────────────────────────────────────────────────

  async setKeepSignedIn(value: boolean): Promise<void> {
    await write(KEYS.KEEP_SIGNED_IN, value ? '1' : '0');
  },

  async getKeepSignedIn(): Promise<boolean> {
    const val = await read(KEYS.KEEP_SIGNED_IN);
    // Default to true (checked) if not yet set
    await storageSet(KEYS.KEEP_SIGNED_IN, value ? '1' : '0');
  },

  async getKeepSignedIn(): Promise<boolean> {
    const val = await storageGet(KEYS.KEEP_SIGNED_IN);
    return val !== '0';
  },

  // ── Biometric preference ────────────────────────────────────────

  async setBiometricEnabled(value: boolean): Promise<void> {
    await write(KEYS.BIOMETRIC_ENABLED, value ? '1' : '0');
  },

  async getBiometricEnabled(): Promise<boolean> {
    const val = await read(KEYS.BIOMETRIC_ENABLED);
    await storageSet(KEYS.BIOMETRIC_ENABLED, value ? '1' : '0');
  },

  async getBiometricEnabled(): Promise<boolean> {
    const val = await storageGet(KEYS.BIOMETRIC_ENABLED);
    return val === '1';
  },

  // ── Token persistence ───────────────────────────────────────────

  async saveTokens(accessToken: string, refreshToken: string, keepSignedIn = true): Promise<void> {
    await tokenStorage.saveRefresh(refreshToken, keepSignedIn);
    setAccessToken(accessToken);
  },
    _memoryAccessToken = accessToken;
    await storageDelete(KEYS.LEGACY_ACCESS_TOKEN);

  async saveRefresh(refreshToken: string, keepSignedIn = true): Promise<void> {
    await remove(KEYS.LEGACY_ACCESS_TOKEN);
    await tokenStorage.setKeepSignedIn(keepSignedIn);
    if (keepSignedIn) {
      await write(KEYS.REFRESH_TOKEN, refreshToken);
      _memoryRefreshToken = null;
    } else {
      await remove(KEYS.REFRESH_TOKEN);
      await storageSet(KEYS.REFRESH_TOKEN, refreshToken);
      _memoryRefreshToken = null;
    } else {
      await storageDelete(KEYS.REFRESH_TOKEN);
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

  async getRefreshToken(): Promise<string | null> {
    return tokenStorage.getRefresh();
    const persisted = await storageGet(KEYS.REFRESH_TOKEN);
    return persisted ?? _memoryRefreshToken;
  },

  async clearTokens(): Promise<void> {
    return tokenStorage.clear();
  },

  async clear(): Promise<void> {
    setAccessToken(null);
    _memoryAccessToken = null;
    await storageDelete(KEYS.REFRESH_TOKEN);
    await storageDelete(KEYS.LEGACY_ACCESS_TOKEN);
    _memoryRefreshToken = null;
    // Attempt both deletions even when one fails; never leave memory signed in.
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
