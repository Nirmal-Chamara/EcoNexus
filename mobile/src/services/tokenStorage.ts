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
}

/**
 * Secure token storage using expo-secure-store.
 *
 * Strategy (matches §3.3 of MASTER_PLAN_FRONTEND_AUTH_RBAC.md):
 *   - Access token: memory only (short-lived, 15 min)
 *   - Refresh token (14d):
 *       keepSignedIn = true  → SecureStore (survives app kill / restart)
 *       keepSignedIn = false → memory only  (cleared when app is killed)
 */
export const tokenStorage = {
  // ── Preference ─────────────────────────────────────────────────

  async setKeepSignedIn(value: boolean): Promise<void> {
    await write(KEYS.KEEP_SIGNED_IN, value ? '1' : '0');
  },

  async getKeepSignedIn(): Promise<boolean> {
    const val = await read(KEYS.KEEP_SIGNED_IN);
    // Default to true (checked) if not yet set
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

  /**
   * Save tokens after login or token rotation.
   * @param keepSignedIn - If false, refresh token goes to memory only.
   */
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
   * Checks SecureStore first (persisted), then falls back to memory.
   */
  async getRefreshToken(): Promise<string | null> {
    return tokenStorage.getRefresh();
  },

  /**
   * Delete all stored auth tokens and reset memory slot.
   * Called on logout and on refresh failure (force-logout).
   */
  async clearTokens(): Promise<void> {
    return tokenStorage.clear();
  },

  async clear(): Promise<void> {
    setAccessToken(null);
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
