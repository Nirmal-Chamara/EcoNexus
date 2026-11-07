import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
    await storageSet(KEYS.KEEP_SIGNED_IN, value ? '1' : '0');
  },

  async getKeepSignedIn(): Promise<boolean> {
    const val = await storageGet(KEYS.KEEP_SIGNED_IN);
    return val !== '0';
  },

  // ── Biometric preference ────────────────────────────────────────

  async setBiometricEnabled(value: boolean): Promise<void> {
    await storageSet(KEYS.BIOMETRIC_ENABLED, value ? '1' : '0');
  },

  async getBiometricEnabled(): Promise<boolean> {
    const val = await storageGet(KEYS.BIOMETRIC_ENABLED);
    return val === '1';
  },

  // ── Token persistence ───────────────────────────────────────────

  async saveTokens(accessToken: string, refreshToken: string, keepSignedIn = true): Promise<void> {
    _memoryAccessToken = accessToken;
    await storageDelete(KEYS.LEGACY_ACCESS_TOKEN);

    if (keepSignedIn) {
      await storageSet(KEYS.REFRESH_TOKEN, refreshToken);
      _memoryRefreshToken = null;
    } else {
      await storageDelete(KEYS.REFRESH_TOKEN);
      _memoryRefreshToken = refreshToken;
    }
  },

  async getAccessToken(): Promise<string | null> {
    return _memoryAccessToken;
  },

  async getRefreshToken(): Promise<string | null> {
    const persisted = await storageGet(KEYS.REFRESH_TOKEN);
    return persisted ?? _memoryRefreshToken;
  },

  async clearTokens(): Promise<void> {
    _memoryAccessToken = null;
    await storageDelete(KEYS.REFRESH_TOKEN);
    await storageDelete(KEYS.LEGACY_ACCESS_TOKEN);
    _memoryRefreshToken = null;
  },
};
