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
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Prisma / database errors processing
  if (!(err instanceof ApiError)) {
    if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
      if (err.code === 'P2002') {
        statusCode = 400;
        const fields = (err.meta?.target as string[]) || [];
        message = `Unique constraint failed on field(s): ${fields.join(', ')}`;
        errors = fields.map((f: string) => ({
          field: f,
          message: `Value already exists for ${f}`,
        }));
      } else if (err.code === 'P2025') {
        statusCode = 404;
        message = (err.meta?.cause as string) || 'Record not found';
      }
    }
  }

  // Log error stack trace if internal 500 server error
  if (statusCode === 500) {
    logger.error(`[500 Error] ${req.method} ${req.path} - Details:`, err);
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
