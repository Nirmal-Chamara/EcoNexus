import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { UserRole } from '../types/express';

export interface JWTPayload {
  sub: string;
  role: UserRole;
  tv: number;
}

export function signAccessToken(user: { id: string; role: UserRole; token_version: number }): string {
  const payload: JWTPayload = {
    sub: user.id,
    role: user.role,
    tv: user.token_version,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as any,
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
