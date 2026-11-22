import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import {
  authenticateAccessToken,
  assertActive,
} from '../services/access.service';

export async function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication token required', 'UNAUTHORIZED');
    }

    req.user = await authenticateAccessToken(authHeader.slice(7));

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

export function requireActive(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AppError(401, 'User not authenticated', 'UNAUTHORIZED'));
  }

  try {
    assertActive(req.user);
    next();
  } catch (error) {
    next(error);
  }
}
