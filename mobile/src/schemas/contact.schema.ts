import { z } from 'zod';
import { normalizePhone } from '../utils/phone';

export const phoneSchema = z.string().trim().max(64)
  .refine((value) => !value || normalizePhone(value) !== null, 'Use a valid international number, for example +94 77 123 4567')
  .transform((value) => value ? normalizePhone(value)! : '');

export const editProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  phone: phoneSchema.optional(),
});

/** Legacy unedited contact data must not prevent an unrelated name correction. */
export const editProfileSchemaForPhone = (currentPhone: string) => editProfileSchema.extend({
  phone: z.string()
    .refine((value) => value === currentPhone || phoneSchema.safeParse(value).success, 'Use a valid international number, for example +94 77 123 4567')
    .transform((value) => value === currentPhone ? value : phoneSchema.parse(value))
    .optional(),
});
