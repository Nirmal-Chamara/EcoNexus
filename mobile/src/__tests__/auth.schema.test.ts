import { describe, expect, it } from '@jest/globals';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

describe('auth schemas', () => {
  it('accepts regular household registration but never allows public admin registration', () => {
    const user = {
      name: 'Alex Green',
      email: 'alex@example.com',
      password: 'StrongPass1',
      role: 'USER',
    };
    expect(registerSchema.safeParse(user).success).toBe(true);
    expect(registerSchema.safeParse({ ...user, role: 'ADMIN' }).success).toBe(false);
  });

  it('requires an organization name for partner registration', () => {
    const partner = {
      name: 'Alex Green',
      email: 'alex@example.com',
      password: 'StrongPass1',
      role: 'COLLECTOR',
    };
    expect(registerSchema.safeParse(partner).success).toBe(false);
    expect(
      registerSchema.safeParse({ ...partner, organizationName: 'Green Collectors' }).success
    ).toBe(true);
  });

  it('validates login email and non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'alex@example.com', password: 'secret' }).success).toBe(
      true
    );
    expect(loginSchema.safeParse({ email: 'invalid', password: '' }).success).toBe(false);
  });

  it('validates reset email and matching strong passwords', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'alex@example.com' }).success).toBe(true);
    const reset = {
      token: 'secure-reset-code',
      newPassword: 'StrongPass1',
      confirmPassword: 'StrongPass1',
    };
    expect(resetPasswordSchema.safeParse(reset).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ ...reset, confirmPassword: 'OtherPass2' }).success).toBe(
      false
    );
  });
});
