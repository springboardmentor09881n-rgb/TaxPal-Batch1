import { z } from 'zod';

export const createReportSchema = z.object({
  body: z.object({
    reportType: z.string().trim().default('Income & Expense Summary'),
    period: z.string().trim().default('Current Month'),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    format: z.enum(['PDF', 'CSV']).default('PDF'),
  }),
});

export const reportIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Report ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid report ID format'),
  }),
});

export const downloadReportSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Report ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid report ID format'),
  }),
  query: z
    .object({
      format: z.string().optional(),
    })
    .optional(),
});

export const emailReportSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Report ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid report ID format'),
  }),
  body: z.object({
    email: z
      .string({ required_error: 'Email address is required' })
      .email('Invalid email address format'),
    format: z.enum(['PDF', 'CSV']).optional(),
  }),
});

export const scheduleReportSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Recipient email address is required' })
      .email('Invalid email address format'),
    reportType: z.string().trim().default('Income & Expense Summary'),
    format: z.enum(['PDF', 'CSV']).default('PDF'),
  }),
});
