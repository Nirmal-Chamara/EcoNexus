import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import { JWTPayload } from '../utils/tokens';

export async function authenticateToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication token required', 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    let payload: JWTPayload;

    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError(401, 'Access token expired', 'TOKEN_EXPIRED');
      }
      throw new AppError(401, 'Invalid access token', 'INVALID_TOKEN');
    }

    const userRes = await pool.query(
      'SELECT id, role, status, token_version FROM users WHERE id = $1',
      [payload.sub]
    );

    const user = userRes.rows[0];
    if (!user) {
      throw new AppError(401, 'User associated with token no longer exists', 'UNAUTHORIZED');
    }

    if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
      throw new AppError(403, `Account is ${user.status.toLowerCase()}`, 'ACCOUNT_DISABLED');
    }

    if (user.token_version !== payload.tv) {
      throw new AppError(401, 'Token has been invalidated. Please log in again.', 'TOKEN_REVOKED');
    }

    req.user = {
      id: user.id,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export const authenticate = authenticateToken;

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'User not authenticated', 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }

    next();
  };
}

export function requireActive(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError(401, 'User not authenticated', 'UNAUTHORIZED'));
  }

  if (req.user.status !== 'ACTIVE') {
    return next(new AppError(403, 'Account must be active to perform this action', 'ACCOUNT_NOT_ACTIVE'));
  }

  next();
}
