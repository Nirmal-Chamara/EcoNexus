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
    review_note: z.string().max(500).optional(),
  }).strict(),
});
