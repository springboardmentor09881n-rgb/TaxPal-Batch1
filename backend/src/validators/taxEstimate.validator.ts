import { z } from 'zod';

export const createTaxEstimateSchema = z.object({
  body: z.object({
    country: z
      .string({ required_error: 'Country is required' })
      .trim()
      .min(1, 'Country is required'),
    quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4'], {
      required_error: 'Quarter is required',
      invalid_type_error: 'Quarter must be one of: Q1, Q2, Q3, Q4',
    }),
    grossIncomeForQuarter: z
      .number({ required_error: 'Gross income for quarter is required' })
      .gt(0, 'Gross income for quarter must be greater than 0'),
    businessExpenses: z
      .number({ invalid_type_error: 'Business expenses must be a number' })
      .min(0, 'Business expenses cannot be negative')
      .optional()
      .default(0),
    retirementContribution: z
      .number({ invalid_type_error: 'Retirement contribution must be a number' })
      .min(0, 'Retirement contribution cannot be negative')
      .optional()
      .default(0),
    healthInsurancePremiums: z
      .number({ invalid_type_error: 'Health insurance premiums must be a number' })
      .min(0, 'Health insurance premiums cannot be negative')
      .optional()
      .default(0),
    homeOfficeDeduction: z
      .number({ invalid_type_error: 'Home office deduction must be a number' })
      .min(0, 'Home office deduction cannot be negative')
      .optional()
      .default(0),
    status: z.string().optional().default('Pending'),
    filingStatus: z.string().optional().default('Not Filed'),
  }),
});

export const updateTaxEstimateSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Estimate ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid estimate ID format'),
  }),
  body: z.object({
    country: z.string().trim().min(1, 'Country cannot be empty').optional(),
    quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).optional(),
    grossIncomeForQuarter: z
      .number()
      .gt(0, 'Gross income for quarter must be greater than 0')
      .optional(),
    businessExpenses: z
      .number()
      .min(0, 'Business expenses cannot be negative')
      .optional(),
    retirementContribution: z
      .number()
      .min(0, 'Retirement contribution cannot be negative')
      .optional(),
    healthInsurancePremiums: z
      .number()
      .min(0, 'Health insurance premiums cannot be negative')
      .optional(),
    homeOfficeDeduction: z
      .number()
      .min(0, 'Home office deduction cannot be negative')
      .optional(),
    status: z.string().optional(),
    filingStatus: z.string().optional(),
  }),
});

export const getTaxEstimateByIdSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Estimate ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid estimate ID format'),
  }),
});
