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
    vehicleCapacity: z.number().positive('Vehicle capacity must be positive').optional(),
    licensePlate: z.string().min(2).max(20).optional(),
    serviceAreaRadiusKm: z.number().positive().max(100).optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const updateCollectorLocationSchema = z.object({
  body: z.object({
    latitude: z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    longitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
  }),
});

export const acceptPickupRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid pickup ID format'),
  }),
});

export type UpdateCollectorProfileInput = z.infer<typeof updateCollectorProfileSchema>['body'];
export type UpdateCollectorLocationInput = z.infer<typeof updateCollectorLocationSchema>['body'];
