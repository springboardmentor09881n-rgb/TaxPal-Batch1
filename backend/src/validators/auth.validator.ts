import { z } from 'zod';
import { UserRole } from '../utils/constants';

export const registerSchema = z.object({
  body: z
    .object({
      fullName: z
        .string({ required_error: 'Full name is required' })
        .trim()
        .min(1, 'Full name is required'),
      username: z
        .string({ required_error: 'Username is required' })
        .trim()
        .min(6, 'Username must be at least 6 characters'),
      email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
      password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
      confirmPassword: z.string({ required_error: 'Confirm password is required' }),
      phone: z.string().trim().optional(),
      country: z
        .string({ required_error: 'Country is required' })
        .trim()
        .min(1, 'Country is required'),
      state: z.string().trim().optional(),
      city: z.string().trim().optional(),
      language: z.string().trim().optional(),
      incomeBracket: z.string().trim().optional(),
      role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }).min(1),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(1).optional(),
    username: z.string().trim().min(6).optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().optional(),
    country: z.string().trim().min(1).optional(),
    state: z.string().trim().optional(),
    city: z.string().trim().optional(),
    language: z.string().trim().optional(),
    incomeBracket: z.string().trim().optional(),
  }),
});
