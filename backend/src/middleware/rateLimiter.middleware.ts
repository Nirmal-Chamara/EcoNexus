import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError';

/**
 * Strict Rate Limiter for Authentication and sensitive endpoints
 * Allows 10 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(429, 'Too many authentication attempts. Please try again after 15 minutes.', 'RATE_LIMIT_EXCEEDED'));
  },
});

/**
 * Dedicated Rate Limiter for Password Reset Requests (Workstream PW-04)
 * Allows 3 requests per 15 minutes per IP to prevent email spam / enumeration
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        429,
        'Too many password reset requests from this IP. Please try again after 15 minutes.',
        'RATE_LIMIT_EXCEEDED'
      )
    );
  },
});

/**
 * General API Rate Limiter
 * Allows 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED'));
  },
});
