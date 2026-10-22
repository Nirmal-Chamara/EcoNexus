import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    phone: z.string().optional(),
    role: z.enum(['USER', 'COLLECTOR', 'RECYCLING_CENTER']),
    organizationName: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.role === 'COLLECTOR' || value.role === 'RECYCLING_CENTER') &&
      (value.organizationName?.length ?? 0) < 2
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['organizationName'],
        message: 'Organization name must be at least 2 characters',
      });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Reset code is required'),
    newPassword: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
