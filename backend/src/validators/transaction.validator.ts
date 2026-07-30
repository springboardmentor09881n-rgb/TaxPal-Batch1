import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['Income', 'Expense'], {
      required_error: 'Type is required',
      invalid_type_error: 'Type must be Income or Expense',
    }),
    description: z.string({ required_error: 'Description is required' }).trim().min(1, 'Description is required'),
    category: z.string({ required_error: 'Category is required' }).trim().min(1, 'Category is required'),
    amount: z.number({ required_error: 'Amount is required' }).min(0, 'Amount cannot be negative'),
    transactionDate: z.coerce.date({
      required_error: 'Transaction date is required',
      invalid_type_error: 'Invalid date format',
    }),
    notes: z.string().trim().optional(),
  }),
});

export const updateTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['Income', 'Expense']).optional(),
    description: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    amount: z.number().min(0).optional(),
    transactionDate: z.coerce.date({
      invalid_type_error: 'Invalid date format',
    }).optional(),
    notes: z.string().trim().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Transaction ID format'),
  }),
});

export const transactionIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Transaction ID format'),
  }),
});
