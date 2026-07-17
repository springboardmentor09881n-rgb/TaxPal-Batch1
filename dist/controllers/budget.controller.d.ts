import { Request, Response, NextFunction } from 'express';
export declare class BudgetController {
    /**
     * Create budget route handler
     */
    static create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * List budgets route handler
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete budget route handler
     */
    static delete(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Budget progress route handler
     */
    static progress(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Spending breakdown chart route handler
     */
    static chart(req: Request, res: Response, next: NextFunction): Promise<void>;
}
