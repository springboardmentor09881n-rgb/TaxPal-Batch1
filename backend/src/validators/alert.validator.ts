import { z } from 'zod';

export const createAlertSchema = z.object({
  body: z.object({
    type: z
      .string({ required_error: 'Alert type is required' })
      .trim()
      .min(1, 'Alert type is required'),
    message: z
      .string({ required_error: 'Alert message is required' })
      .trim()
      .min(1, 'Alert message is required'),
    alertDate: z
      .string({ required_error: 'Alert date is required' })
      .datetime({ message: 'Alert date must be a valid ISO date string' })
      .or(z.date()),
    isRead: z.boolean().optional().default(false),
  }),
});

export const alertIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Alert ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid alert ID format'),
  }),
});
