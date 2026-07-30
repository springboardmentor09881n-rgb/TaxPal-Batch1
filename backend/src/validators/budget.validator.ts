import { z } from 'zod';

export const setBudgetSchema = z.object({
  body: z.object({
    category: z.string({ required_error: 'Category is required' }).trim().min(1, 'Category is required'),
    limit: z.number({ required_error: 'Limit is required' }).min(0, 'Limit cannot be negative'),
    month: z.string({ required_error: 'Month is required' })
      .regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
      .refine((val) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        return val >= currentMonthStr;
      }, 'Month must be the current month or a future month'),
    description: z.string().trim().optional().default(''),
  }),
});
