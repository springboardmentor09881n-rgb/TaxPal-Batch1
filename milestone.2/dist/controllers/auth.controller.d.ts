import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    /**
     * Register user handler
     */
    static register(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Login user handler
     */
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Logout user handler
     */
    static logout(req: Request, res: Response, next: NextFunction): Promise<void>;
}
