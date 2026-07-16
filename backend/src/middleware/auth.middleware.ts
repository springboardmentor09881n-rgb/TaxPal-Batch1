import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../utils/constants';
import { User } from '../models/User';
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
      const decoded = jwt.verify(token, env.JWT_SECRET) as IUserPayload;

      // Verify the user still exists in the database
      const userExists = await User.findById(decoded.id).select('_id');
      if (!userExists) {
        throw new ApiError(401, 'User account no longer exists');
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
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

/**
 * Middleware to restrict access to specific roles
 */
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied: Role '${req.user.role}' is not authorized to access this resource`,
        ),
      );
    }

    next();
  };
};
