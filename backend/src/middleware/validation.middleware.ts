import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Express middleware to validate incoming request data using Zod schema
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Assign back parsed data (Zod can strip unknown or sanitize inputs)
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.length > 1 ? err.path.slice(1).join('.') : err.path[0],
          message: err.message,
        }));
        next(new ApiError(400, 'Validation failed', errors));
        return;
      }
      next(error);
    }
  };
};
