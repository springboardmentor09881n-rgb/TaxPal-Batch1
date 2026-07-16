import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budget.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class BudgetController {
  /**
   * Create budget handler
   */
  public static async createBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const budget = await BudgetService.createBudget(userId, req.body);
      res.status(201).json(new ApiResponse(budget, 'Budget created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all user budgets handler
   */
  public static async getAllBudgets(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const budgets = await BudgetService.getAllBudgets(userId);
      res.status(200).json(new ApiResponse(budgets, 'Budgets retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single budget handler
   */
  public static async getBudgetById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: budgetId } = req.params;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const budget = await BudgetService.getBudgetById(userId, budgetId);
      res.status(200).json(new ApiResponse(budget, 'Budget retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update budget handler
   */
  public static async updateBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: budgetId } = req.params;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const budget = await BudgetService.updateBudget(userId, budgetId, req.body);
      res.status(200).json(new ApiResponse(budget, 'Budget updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete budget handler
   */
  public static async deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: budgetId } = req.params;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      await BudgetService.deleteBudget(userId, budgetId);
      res.status(200).json(new ApiResponse(null, 'Budget deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get budget progress summary handler
   */
  public static async getBudgetProgress(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      // Default to current UTC month (YYYY-MM) if not specified
      const currentMonth = new Date().toISOString().substring(0, 7);
      const month = (req.query.month as string) || currentMonth;

      // Validate month format (YYYY-MM)
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        throw new ApiError(400, 'Invalid month format. Please use YYYY-MM.');
      }

      const progress = await BudgetService.getBudgetProgress(userId, month);
      res.status(200).json(new ApiResponse(progress, 'Budget progress retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}
