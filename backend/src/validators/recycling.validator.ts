import { z } from 'zod';

export const upsertProfileSchema = z.object({
  body: z.object({
    organization_name: z.string().min(2).max(150).optional(),
    registration_no: z.string().max(100).optional(),
    contact_phone: z.string().max(20).optional(),
    address_text: z.string().max(500).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    total_capacity_kg: z.number().nonnegative().optional(),
    document_url: z.string().url().optional().or(z.literal('')),
  }),
});

export const addCategorySchema = z.object({
  body: z.object({
    category_id: z.number().int().positive('category_id must be a positive integer'),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    categoryId: z.string().regex(/^\d+$/, 'categoryId must be numeric'),
  }),
});

export const createIntakeSchema = z.object({
  body: z.object({
    category_id: z.number().int().positive(),
    quantity_kg: z.number().positive().max(100000),
    received_at: z.string().datetime().optional(),
    delivery_ref: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const updateIntakeStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['RECEIVED', 'SORTED', 'PROCESSED']),
  }),
});

export const intakeIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
