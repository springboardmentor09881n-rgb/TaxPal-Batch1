import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to authenticate requests via JWT access token
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
