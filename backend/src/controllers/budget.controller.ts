import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budget.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class BudgetController {
  /**
   * Get all user budgets and month-to-date spending
   */
  public static async getBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const month = req.query.month as string;
      const budgetData = await BudgetService.getBudgetsAndSpending(userId, month);
      res.status(200).json(new ApiResponse(budgetData, 'Budgets and spending metrics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set or update a category budget limit
   */
  public static async setBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const { category, limit, month, description } = req.body;
      const budget = await BudgetService.setBudgetLimit(userId, category, limit, month, description);
      res.status(200).json(new ApiResponse(budget, 'Budget limit updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category budget limit
   */
  public static async deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const { category } = req.params;
      const month = req.query.month as string;
      if (!category) {
        throw new ApiError(400, 'Category parameter is required');
      }

      await BudgetService.deleteBudgetLimit(userId, category, month);
      res.status(200).json(new ApiResponse(null, 'Budget limit deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
