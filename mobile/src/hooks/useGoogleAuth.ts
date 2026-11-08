import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { env } from '../config/env';
import { useAuth } from './useAuth';
import { mapApiError } from '../utils/errorMapper';

// Complete any pending web auth redirect sessions safely
try {
  WebBrowser.maybeCompleteAuthSession();
} catch {
  // Best-effort in non-browser or testing environments
}

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
};

function getGoogleClientId(): string {
  if (Platform.OS === 'web') {
    return env.GOOGLE_WEB_CLIENT_ID || '';
  }
  if (Platform.OS === 'ios' && env.GOOGLE_IOS_CLIENT_ID) {
    return env.GOOGLE_IOS_CLIENT_ID;
  }
  if (Platform.OS === 'android' && env.GOOGLE_ANDROID_CLIENT_ID) {
    return env.GOOGLE_ANDROID_CLIENT_ID;
  }
  return env.GOOGLE_WEB_CLIENT_ID || '';
}

function getRedirectUri(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return 'http://localhost:8081';
  }
  return AuthSession.makeRedirectUri({
    scheme: 'econexus',
  });
}

export interface UseGoogleAuthResult {
  promptGoogleSignIn: (keepSignedIn?: boolean, role?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  isConfigured: boolean;
}

export function useGoogleAuth(): UseGoogleAuthResult {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = getGoogleClientId();
  const isConfigured = Boolean(clientId);

  const promptGoogleSignIn = useCallback(
    async (keepSignedIn = true, role?: string): Promise<void> => {
      setError(null);
      setLoading(true);

      try {
        const activeClientId = getGoogleClientId();

        if (activeClientId) {
          const redirectUri = getRedirectUri();
          const nonce = typeof Crypto.randomUUID === 'function'
            ? Crypto.randomUUID()
            : Math.random().toString(36).substring(2) + Date.now().toString(36);

          const request = await AuthSession.loadAsync(
            {
              clientId: activeClientId,
              scopes: [
                'openid',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
              ],
              responseType: AuthSession.ResponseType.IdToken,
              redirectUri,
              usePKCE: false,
              extraParams: {
                nonce,
              },
            },
            GOOGLE_DISCOVERY
          );

          const result = await request.promptAsync(GOOGLE_DISCOVERY);

          if (result.type === 'cancel' || result.type === 'dismiss') {
            setLoading(false);
            return;
          }

          if (result.type === 'success') {
            const idToken = result.params?.id_token;
            if (!idToken) {
              throw new Error('No ID token returned from Google.');
            }
            await signInWithGoogle(idToken, keepSignedIn, role);
            return;
          }

          if (result.type === 'error') {
            throw new Error(result.error?.message || 'Google authentication failed.');
          }
        } else if (env.IS_DEV) {
          await signInWithGoogle(
            'mock-google-token:demo.user@econexus.com:EcoNexus Demo User',
            keepSignedIn,
            role
          );
        } else {
          throw new Error(
            'Google Sign-In is not configured. Please define EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env'
          );
        }
      } catch (err: unknown) {
        setError(mapApiError(err, 'Failed to sign in with Google.'));
      } finally {
        setLoading(false);
      }
    },
    [signInWithGoogle]
  );

  return {
    promptGoogleSignIn,
    isLoading: loading,
    error,
    clearError: () => setError(null),
    isConfigured,
  };
}
