import { z } from 'zod';

export const userQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    role: z.enum(['USER', 'COLLECTOR', 'RECYCLING_CENTER', 'ADMIN']).optional(),
    status: z.enum(['ACTIVE', 'PENDING_VERIFICATION', 'REJECTED', 'SUSPENDED']).optional(),
    page: z.string().regex(/^\d+$/).optional().transform(Number),
    limit: z.string().regex(/^\d+$/).optional().transform(Number),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'PENDING_VERIFICATION', 'REJECTED', 'SUSPENDED']),
    reason: z.string().trim().max(500).optional(),
  }).superRefine((body, context) => {
    if (body.status === 'SUSPENDED' && !body.reason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'A reason is required when suspending an account',
      });
    }
  }).strict(),
});

export const verificationQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    page: z.string().regex(/^\d+$/).optional().transform(Number),
    limit: z.string().regex(/^\d+$/).optional().transform(Number),
  }),
});

export const processVerificationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid verification ID'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    review_note: z.string().trim().max(500).optional(),
  }).superRefine((body, context) => {
    if (body.status === 'REJECTED' && !body.review_note) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['review_note'],
        message: 'A reason is required when rejecting a verification request',
      });
    }
  }).strict(),
});
