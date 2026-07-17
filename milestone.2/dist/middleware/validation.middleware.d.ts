import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
/**
 * Express middleware to validate incoming request data using Zod schema
 */
export declare const validate: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
