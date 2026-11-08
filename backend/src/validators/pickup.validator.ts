import { z } from 'zod';

export const pickupStatusEnum = z.enum([
  'PENDING',
  'ACCEPTED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED',
]);

export const wasteTypeEnum = z.enum([
  'PLASTIC',
  'PAPER',
  'GLASS',
  'METAL',
  'ORGANIC',
  'E_WASTE',
  'HAZARDOUS',
  'MIXED',
  'OTHER',
]);

export const createPickupRequestSchema = z.object({
  body: z.object({
    latitude: z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    longitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
    address: z
      .string()
      .min(3, 'Address must be at least 3 characters')
      .max(255),
    wasteType: z.string().min(2, 'Waste type is required'),
    estimatedWeight: z
      .number()
      .positive('Estimated weight must be greater than 0')
      .optional()
      .default(1),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
    images: z.array(z.string()).optional(),
    scheduledTime: z.string().datetime({ message: 'Invalid ISO datetime string' }).optional(),
  }),
});

export const nearbyPickupQuerySchema = z.object({
  query: z.object({
    latitude: z
      .string()
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
        message: 'latitude must be a valid number between -90 and 90',
      }),
    longitude: z
      .string()
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
        message: 'longitude must be a valid number between -180 and 180',
      }),
    radius: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : 5000))
      .refine((val) => !isNaN(val) && val > 0 && val <= 50000, {
        message: 'radius must be between 1 and 50000 meters',
      }),
  }),
});

export const updatePickupStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid pickup request ID format'),
  }),
  body: z.object({
    status: pickupStatusEnum,
    notes: z.string().max(500).optional(),
  }),
});

export const pickupIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid pickup request ID format'),
  }),
});

export type CreatePickupRequestInput = z.infer<typeof createPickupRequestSchema>['body'];
export type UpdatePickupStatusInput = z.infer<typeof updatePickupStatusSchema>['body'];
