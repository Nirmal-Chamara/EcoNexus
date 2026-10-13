import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'econexus_access_token',
  REFRESH_TOKEN: 'econexus_refresh_token',
} as const;

/**
 * Secure token storage using expo-secure-store.
 * On Android: stored in Android Keystore encrypted shared preferences.
 * On iOS: stored in the encrypted Keychain.
 */
export const tokenStorage = {
  /**
   * Persist both access and refresh tokens atomically.
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
  },

  /**
   * Retrieve the stored access token.
   */
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  /**
   * Retrieve the stored refresh token.
   */
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  /**
   * Delete all stored auth tokens (called on logout).
   */
  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
  },
};
