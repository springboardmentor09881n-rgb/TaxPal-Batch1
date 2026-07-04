import { z } from 'zod';
import { EmployeeStatus } from '../utils/constants';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createEmployeeSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'User ID is required' }).regex(objectIdPattern, 'Invalid User ID format'),
    name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    phone: z.string({ required_error: 'Phone number is required' }).trim().min(5, 'Phone is too short'),
    department: z.string({ required_error: 'Department is required' }).trim().min(1, 'Department is required'),
    designation: z.string({ required_error: 'Designation is required' }).trim().min(1, 'Designation is required'),
    joiningDate: z.string({ required_error: 'Joining date is required' }).datetime({ message: 'Invalid joining date timestamp' }).or(z.coerce.date()),
    salary: z.number({ required_error: 'Salary is required' }).nonnegative('Salary cannot be negative'),
    status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
  }),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().trim().min(5, 'Phone is too short').optional(),
    department: z.string().trim().min(1, 'Department cannot be empty').optional(),
    designation: z.string().trim().min(1, 'Designation cannot be empty').optional(),
    joiningDate: z.string().datetime().or(z.coerce.date()).optional(),
    salary: z.number().nonnegative('Salary cannot be negative').optional(),
    status: z.nativeEnum(EmployeeStatus).optional(),
  }),
  params: z.object({
    id: z.string().regex(objectIdPattern, 'Invalid Employee ID format'),
  }),
});

export const employeeIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdPattern, 'Invalid Employee ID format'),
  }),
});
