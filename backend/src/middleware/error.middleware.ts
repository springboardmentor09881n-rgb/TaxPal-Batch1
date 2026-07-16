import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { env } from '../config/env';

/**
 * Global Error Handling Middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose / MongoDB errors processing
  if (!(err instanceof ApiError)) {
    // Invalid ObjectId format
    if (err.name === 'CastError') {
      statusCode = 400;
      message = `Invalid format for field '${err.path}'`;
      errors = [{ field: err.path, message: `Value '${err.value}' is not a valid ID` }];
    }
    // Duplicate Key value
    else if (err.code === 11000) {
      statusCode = 400;
      const duplicatedField = Object.keys(err.keyValue)[0];
      message = `A record with this ${duplicatedField} already exists`;
      errors = [
        {
          field: duplicatedField,
          message: `Value '${err.keyValue[duplicatedField]}' is already taken`,
        },
      ];
    }
    // Validation constraint failed
    else if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      errors = Object.values(err.errors).map((val: any) => ({
        field: val.path,
        message: val.message,
      }));
    }
  }

  // Log error stack trace if internal 500 server error
  if (statusCode === 500) {
    logger.error(`[500 Error] ${req.method} ${req.path} - Details:`, err);
    // Hide details in production environment
    if (env.NODE_ENV === 'production') {
      message = 'Internal Server Error';
    }
  } else {
    logger.warn(`[${statusCode} Error] ${req.method} ${req.path} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
