import { z } from 'zod';

export const vehicleTypeSchema = z.enum([
  'BICYCLE',
  'MOTORCYCLE',
  'THREE_WHEELER',
  'VAN',
  'TRUCK',
]);

export const updateCollectorProfileSchema = z.object({
  body: z.object({
    vehicleType: vehicleTypeSchema.optional(),
    licensePlate: z.string().min(2).max(20).optional(),
    serviceAreaRadiusKm: z.number().positive().max(100).optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const updateCollectorLocationSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

export const acceptPickupRequestSchema = z.object({
  params: z.object({
    pickupId: z.string().uuid('Invalid pickup ID format'),
  }),
});

export type UpdateCollectorProfileInput = z.infer<typeof updateCollectorProfileSchema>['body'];
export type UpdateCollectorLocationInput = z.infer<typeof updateCollectorLocationSchema>['body'];
