import { z } from 'zod';
import { normalizePhone } from '../utils/phone';

export const phoneSchema = z.string().trim().max(64)
  .refine((value) => !value || normalizePhone(value) !== null, 'Use a valid international number, for example +94 77 123 4567')
  .transform((value) => value ? normalizePhone(value)! : '');
