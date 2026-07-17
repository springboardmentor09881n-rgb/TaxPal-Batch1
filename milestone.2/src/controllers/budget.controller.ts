import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budget.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class BudgetController {
  /**
   * Create budget route handler
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context not found');
      }

      const { category, limit, month } = req.body;
      const budget = await BudgetService.createBudget(userId, category, limit, month);

      res.status(201).json(new ApiResponse(budget, 'Budget set successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * List budgets route handler
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context not found');
      }

      const month = req.query.month as string;
      const budgets = await BudgetService.getBudgets(userId, month);

      res.status(200).json(new ApiResponse(budgets, 'Budgets retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete budget route handler
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context not found');
      }

      const budgetId = req.params.id;
      await BudgetService.deleteBudget(userId, budgetId);

      res.status(200).json(new ApiResponse(null, 'Budget deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Budget progress route handler
   */
  public static async progress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context not found');
      }

      const month = req.query.month as string;
      const progress = await BudgetService.getBudgetProgress(userId, month);

      res.status(200).json(progress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Spending breakdown chart route handler
   */
  public static async chart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context not found');
      }

      const month = req.query.month as string;
      const chartData = await BudgetService.getSpendingChart(userId, month);

      res.status(200).json(chartData);
    } catch (error) {
      next(error);
    }
  }
}
