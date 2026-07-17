import { z } from 'zod';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const createBudgetSchema = z.object({
  body: z.object({
    category: z.string({
      required_error: 'Category is required',
    }).trim().min(1, 'Category cannot be empty'),
    limit: z.number({
      required_error: 'Limit is required',
      invalid_type_error: 'Limit must be a number',
    }).positive('Limit must be greater than 0'),
    month: z.string({
      required_error: 'Month is required',
    }).regex(monthRegex, 'Month must be in YYYY-MM format'),
  }),
});

export const getBudgetsSchema = z.object({
  query: z.object({
    month: z.string({
      required_error: 'Month is required',
    }).regex(monthRegex, 'Month must be in YYYY-MM format'),
  }),
});

export const deleteBudgetSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'Budget ID is required',
    }).regex(/^[0-9a-fA-F]{24}$/, 'Budget ID must be a valid 24-character hex string'),
  }),
});
