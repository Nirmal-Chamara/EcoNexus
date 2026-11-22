import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import type { AuthUser } from '../types/express';

/** Shared HTTP/socket authentication; permissions always use the current DB user. */
export async function authenticateAccessToken(
  token: unknown
): Promise<AuthUser> {
  if (typeof token !== 'string' || !token) {
    throw new AppError(401, 'Authentication token required', 'UNAUTHORIZED');
  }
  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });
    if (
      typeof decoded === 'string' ||
      !z.string().uuid().safeParse(decoded.sub).success ||
      !Number.isInteger(decoded.tv)
    ) {
      throw new Error('Invalid token claims');
    }
    payload = decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Access token expired', 'TOKEN_EXPIRED');
    }
    throw new AppError(401, 'Invalid access token', 'INVALID_TOKEN');
  }
  const result = await pool.query(
    'SELECT id, role, status, token_version, email_verified_at FROM users WHERE id = $1',
    [payload.sub]
  );
  const user = result.rows[0];
  if (!user)
    throw new AppError(
      401,
      'User associated with token no longer exists',
      'UNAUTHORIZED'
    );
  if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
    throw new AppError(
      403,
      `Account is ${user.status.toLowerCase()}`,
      'ACCOUNT_DISABLED'
    );
  }
  if (user.token_version !== payload.tv) {
    throw new AppError(
      401,
      'Token has been invalidated. Please log in again.',
      'TOKEN_REVOKED'
    );
  }
  return { id: user.id, role: user.role, status: user.status, emailVerified: Boolean(user.email_verified_at) };
}

export function assertActive(user: AuthUser): void {
  if (user.status !== 'ACTIVE') {
    throw new AppError(
      403,
      'Account must be active to perform this action',
      'ACCOUNT_NOT_ACTIVE'
    );
  }
  if (!user.emailVerified) throw new AppError(403, 'Verify your email before using this feature', 'EMAIL_VERIFICATION_REQUIRED');
}
