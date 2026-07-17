import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Category name is required',
    }).trim().min(1, 'Category name cannot be empty'),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Category name is required',
    }).trim().min(1, 'Category name cannot be empty'),
  }),
  params: z.object({
    id: z.string({
      required_error: 'Category ID is required',
    }).regex(/^[0-9a-fA-F]{24}$/, 'Category ID must be a valid 24-character hex string'),
  }),
});

export const suggestCategorySchema = z.object({
  body: z.object({
    description: z.string({
      required_error: 'Transaction description is required',
    }).trim().min(1, 'Transaction description cannot be empty'),
  }),
});
