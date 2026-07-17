import { Request, Response, NextFunction } from 'express';
/**
 * Global Error Handling Middleware
 */
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
