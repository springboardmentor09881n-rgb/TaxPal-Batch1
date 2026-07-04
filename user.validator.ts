import { z } from 'zod';
import { UserRole } from '../utils/constants';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    role: z.nativeEnum(UserRole).optional(),
  }),
  params: z.object({
    id: z.string().regex(objectIdPattern, 'Invalid User ID format'),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdPattern, 'Invalid User ID format'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string({ required_error: 'Current password is required' }).min(1),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, 'New password must be at least 6 characters'),
  }),
});
