import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/db';
import { IUserPayload } from '../types';

/**
 * Middleware to authenticate requests via JWT access token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = '';

    // Check Authorization header or cookies
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError(401, 'Authentication token missing');
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      // Verify the user still exists in the database
      const userExists = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true },
      });

      if (!userExists) {
        throw new ApiError(401, 'User account no longer exists');
      }

      req.user = {
        id: userExists.id,
        email: userExists.email,
        role: decoded.role || 'User',
      };

      next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Access token has expired');
      }
      throw new ApiError(401, 'Unauthorized: Access token is invalid');
    }
  } catch (error) {
    next(error);
  }
};
