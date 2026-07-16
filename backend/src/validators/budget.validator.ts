import { z } from 'zod';

export const createBudgetSchema = z.object({
  body: z.object({
    category: z
      .string({ required_error: 'Category is required' })
      .trim()
      .min(1, 'Category is required'),
    limit: z.number({ required_error: 'Limit is required' }).min(0, 'Limit cannot be negative'),
    month: z
      .string({ required_error: 'Month is required' })
      .trim()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid month format (must be YYYY-MM)'),
  }),
});

export const updateBudgetSchema = z.object({
  body: z.object({
    category: z.string().trim().min(1).optional(),
    limit: z.number().min(0).optional(),
    month: z
      .string()
      .trim()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid month format (must be YYYY-MM)')
      .optional(),
    spent: z.number().min(0).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Budget ID format'),
  }),
});

export const budgetIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Budget ID format'),
  }),
});
