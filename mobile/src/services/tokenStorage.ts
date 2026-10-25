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
    await SecureStore.setItemAsync(KEYS.KEEP_SIGNED_IN, value ? '1' : '0');
  },

  async getKeepSignedIn(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(KEYS.KEEP_SIGNED_IN);
    // Default to true (checked) if not yet set
    return val !== '0';
  },

  // ── Biometric preference ────────────────────────────────────────

  async setBiometricEnabled(value: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEYS.BIOMETRIC_ENABLED, value ? '1' : '0');
  },

  async getBiometricEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(KEYS.BIOMETRIC_ENABLED);
    return val === '1';
  },

  // ── Token persistence ───────────────────────────────────────────

  /**
   * Save tokens after login or token rotation.
   * @param keepSignedIn - If false, refresh token goes to memory only.
   */
  async saveTokens(accessToken: string, refreshToken: string, keepSignedIn = true): Promise<void> {
    _memoryAccessToken = accessToken;
    // Remove access tokens saved by older app versions.
    await SecureStore.deleteItemAsync(KEYS.LEGACY_ACCESS_TOKEN);

    if (keepSignedIn) {
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
      _memoryRefreshToken = null;
    } else {
      await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
      _memoryRefreshToken = refreshToken;
    }
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
    const persisted = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    return persisted ?? _memoryRefreshToken;
  },

  /**
   * Delete all stored auth tokens and reset memory slot.
   * Called on logout and on refresh failure (force-logout).
   */
  async clearTokens(): Promise<void> {
    _memoryAccessToken = null;
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.LEGACY_ACCESS_TOKEN);
    _memoryRefreshToken = null;
  },
};
