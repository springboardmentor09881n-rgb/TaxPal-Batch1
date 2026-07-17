import { Request, Response, NextFunction } from 'express';
export declare class CategoryController {
    /**
     * Create category route handler
     */
    static create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * List categories route handler
     */
    static list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update category route handler
     */
    static update(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete category route handler
     */
    static delete(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Suggest category route handler
     */
    static suggest(req: Request, res: Response, next: NextFunction): Promise<void>;
}
