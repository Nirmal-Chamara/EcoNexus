import { z } from 'zod';

export const wasteCategorySchema = z.enum([
  'PLASTIC',
  'PAPER',
  'GLASS',
  'METAL',
  'ORGANIC',
  'E_WASTE',
  'HAZARDOUS',
  'OTHER',
]);

export const wastePickupStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
});

export const createWastePickupSchema = z.object({
  body: z.object({
    category: wasteCategorySchema,
    estimatedWeightKg: z.number().positive('Weight must be greater than 0'),
    description: z.string().max(500).optional(),
    pickupLocation: locationSchema,
    scheduledTime: z.string().datetime({ message: 'Invalid ISO datetime string' }).optional(),
  }),
});

export const updatePickupStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid pickup ID format'),
  }),
  body: z.object({
    status: wastePickupStatusSchema,
    notes: z.string().max(300).optional(),
  }),
});

export const pickupQuerySchema = z.object({
  query: z.object({
    status: wastePickupStatusSchema.optional(),
    category: wasteCategorySchema.optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export type CreateWastePickupInput = z.infer<typeof createWastePickupSchema>['body'];
export type UpdatePickupStatusInput = z.infer<typeof updatePickupStatusSchema>['body'];
