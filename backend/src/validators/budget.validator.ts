import { z } from 'zod';

export const setBudgetSchema = z.object({
  body: z.object({
    category: z.string({ required_error: 'Category is required' }).trim().min(1, 'Category is required'),
    limit: z.number({ required_error: 'Limit is required' }).min(0, 'Limit cannot be negative'),
  }),
});
