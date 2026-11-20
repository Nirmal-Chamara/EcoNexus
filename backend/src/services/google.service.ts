import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export interface GooglePayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export class GoogleService {
  /**
   * Verifies a Google ID token and extracts profile data.
   * Supports Google OAuth ID tokens and mock tokens in development/test.
   */
  static async verifyIdToken(idToken: string): Promise<GooglePayload> {
    if (!idToken || typeof idToken !== 'string') {
      throw new AppError(400, 'Google ID token is required', 'MISSING_GOOGLE_TOKEN');
    }

    // Support mock tokens for automated tests and offline development
    if (idToken.startsWith('mock-google-token:')) {
      if (env.NODE_ENV === 'production') {
        throw new AppError(403, 'Mock Google tokens are disabled in production', 'FORBIDDEN');
      }
      const parts = idToken.split(':');
      const email = parts[1] || 'googleuser@example.com';
      const name = parts[2] || 'Google User';
      const sub = parts[3] || `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      return {
        sub,
        email: email.toLowerCase(),
        name,
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      };
    }

    try {
      const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        logger.warn(`Google token verification failed (${response.status}): ${errorBody}`);
        throw new AppError(401, 'Invalid or expired Google authentication token', 'INVALID_GOOGLE_TOKEN');
      }

      const data = (await response.json()) as {
        sub?: string;
        email?: string;
        email_verified?: string | boolean;
        name?: string;
        picture?: string;
        aud?: string;
      };

      if (!data.sub || !data.email) {
        throw new AppError(401, 'Incomplete Google token payload', 'INVALID_GOOGLE_TOKEN');
      }

      const isVerified = data.email_verified === 'true' || data.email_verified === true;
      if (!isVerified) {
        throw new AppError(400, 'Google email address is not verified', 'EMAIL_NOT_VERIFIED');
      }

      if (env.GOOGLE_CLIENT_ID && data.aud) {
        const allowedAudiences = env.GOOGLE_CLIENT_ID.split(',').map((id) => id.trim()).filter(Boolean);
        if (allowedAudiences.length > 0 && !allowedAudiences.includes(data.aud)) {
          logger.warn(`Google token aud mismatch: expected one of [${allowedAudiences.join(', ')}], received ${data.aud}`);
          throw new AppError(401, 'Google token audience does not match this application', 'INVALID_GOOGLE_TOKEN');
        }
      }

      return {
        sub: data.sub,
        email: data.email.toLowerCase(),
        name: data.name || data.email.split('@')[0],
        picture: data.picture,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      logger.error('Error during Google token verification:', err);
      throw new AppError(401, 'Failed to authenticate with Google', 'GOOGLE_AUTH_FAILED');
    }
  }
}

