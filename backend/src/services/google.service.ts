import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export interface GooglePayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  issuedAt: number;
  emailAuthoritative?: boolean;
}

const client = new OAuth2Client();

export class GoogleService {
  /** Verify signed Google identity tokens; no environment accepts mock identities. */
  static async verifyIdToken(
    idToken: string,
    expectedNonce?: string
  ): Promise<GooglePayload> {
    if (!idToken || typeof idToken !== 'string') {
      throw new AppError(
        400,
        'Google ID token is required',
        'MISSING_GOOGLE_TOKEN'
      );
    }
    if (idToken.startsWith('mock-google-token:')) {
      throw new AppError(
        401,
        'Invalid Google authentication token',
        'INVALID_GOOGLE_TOKEN'
      );
    }
    const audiences = env.GOOGLE_CLIENT_ID.split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (!audiences.length) {
      throw new AppError(
        503,
        'Google sign-in is unavailable. Please use email sign-in.',
        'GOOGLE_AUTH_NOT_CONFIGURED'
      );
    }
    try {
      // The library validates Google's signature, issuer, expiration and audience.
      const ticket = await client.verifyIdToken({
        idToken,
        audience: audiences,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        throw new AppError(
          401,
          'Incomplete Google identity',
          'INVALID_GOOGLE_TOKEN'
        );
      }
      if (payload.email_verified !== true) {
        throw new AppError(
          401,
          'Google email address is not verified',
          'EMAIL_NOT_VERIFIED'
        );
      }
      if (
        expectedNonce &&
        (payload as typeof payload & { nonce?: string }).nonce !== expectedNonce
      ) {
        throw new AppError(
          401,
          'Google sign-in response does not match this request',
          'INVALID_GOOGLE_NONCE'
        );
      }
      return {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
        issuedAt: payload.iat,
        emailAuthoritative: payload.email.toLowerCase().endsWith('@gmail.com') || Boolean(payload.hd),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      // Never log a provider exception that might include raw token contents.
      throw new AppError(
        401,
        'Invalid or expired Google authentication token',
        'INVALID_GOOGLE_TOKEN'
      );
    }
  }
}
