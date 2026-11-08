import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registrationFields = {
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be 72 characters or fewer')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  phone: z.string().trim().max(20, 'Phone number is too long').optional(),
  role: z.enum(['USER', 'COLLECTOR', 'RECYCLING_CENTER']),
  organizationName: z.string().trim().max(150, 'Organization name is too long').optional(),
};

function validateOrganization(
  value: { role: z.infer<typeof registrationFields.role>; organizationName?: string },
  context: z.RefinementCtx
) {
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
}

/** Backend-compatible payload validation. Confirm password is UI-only. */
export const registerSchema = z.object(registrationFields).superRefine(validateOrganization);

/** Full F4 registration form validation, including the client-only confirmation field. */
export const registerFormSchema = z
  .object({
    ...registrationFields,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .superRefine((value, context) => {
    validateOrganization(value, context);
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
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
