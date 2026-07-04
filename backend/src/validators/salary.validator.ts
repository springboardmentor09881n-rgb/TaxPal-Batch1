import { z } from 'zod';
import { PaymentStatus } from '../utils/constants';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createSalarySchema = z.object({
  body: z.object({
    employeeId: z.string({ required_error: 'Employee ID is required' }).regex(objectIdPattern, 'Invalid Employee ID format'),
    basicSalary: z.number({ required_error: 'Basic salary is required' }).nonnegative('Basic salary cannot be negative'),
    allowances: z.number().nonnegative('Allowances cannot be negative').default(0),
    bonus: z.number().nonnegative('Bonus cannot be negative').default(0),
    deductions: z.number().nonnegative('Deductions cannot be negative').default(0),
    month: z.number({ required_error: 'Month is required' }).min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
    year: z.number({ required_error: 'Year is required' }).min(2000, 'Year must be valid'),
    paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
    paymentDate: z.string().datetime().or(z.coerce.date()).optional(),
  }),
});

export const updateSalarySchema = z.object({
  body: z.object({
    basicSalary: z.number().nonnegative('Basic salary cannot be negative').optional(),
    allowances: z.number().nonnegative('Allowances cannot be negative').optional(),
    bonus: z.number().nonnegative('Bonus cannot be negative').optional(),
    deductions: z.number().nonnegative('Deductions cannot be negative').optional(),
    month: z.number().min(1).max(12).optional(),
    year: z.number().min(2000).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    paymentDate: z.string().datetime().or(z.coerce.date()).optional(),
  }),
  params: z.object({
    id: z.string().regex(objectIdPattern, 'Invalid Salary ID format'),
  }),
});

export const approveSalarySchema = z.object({
  body: z.object({
    paymentStatus: z.enum([PaymentStatus.APPROVED, PaymentStatus.REJECTED, PaymentStatus.PAID], {
      errorMap: () => ({ message: 'Invalid status. Choose Approved, Rejected or Paid' }),
    }),
  }),
  params: z.object({
    id: z.string().regex(objectIdPattern, 'Invalid Salary ID format'),
  }),
});

export const salaryIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdPattern, 'Invalid Salary ID format'),
  }),
});
