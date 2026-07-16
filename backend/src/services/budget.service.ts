import { Budget, IBudgetDocument } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { ApiError } from '../utils/ApiError';

export class BudgetService {
  /**
   * Create a new budget for a user
   */
  public static async createBudget(userId: string, data: any): Promise<IBudgetDocument> {
    try {
      const budget = new Budget({
        userId,
        ...data,
      });
      return await budget.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ApiError(400, 'A budget for this category and month already exists');
      }
      throw error;
    }
  }

  /**
   * Retrieve all budgets for a user
   */
  public static async getAllBudgets(userId: string): Promise<IBudgetDocument[]> {
    return await Budget.find({ userId }).sort({ month: -1, category: 1 });
  }

  /**
   * Retrieve a single budget by ID and verify user ownership
   */
  public static async getBudgetById(userId: string, budgetId: string): Promise<IBudgetDocument> {
    const budget = await Budget.findOne({ _id: budgetId, userId });
    if (!budget) {
      throw new ApiError(404, 'Budget not found or unauthorized');
    }
    return budget;
  }

  /**
   * Update a budget by ID and verify user ownership
   */
  public static async updateBudget(
    userId: string,
    budgetId: string,
    data: any,
  ): Promise<IBudgetDocument> {
    try {
      const budget = await Budget.findOneAndUpdate(
        { _id: budgetId, userId },
        { $set: data },
        { new: true, runValidators: true },
      );
      if (!budget) {
        throw new ApiError(404, 'Budget not found or unauthorized');
      }
      return budget;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ApiError(400, 'A budget for this category and month already exists');
      }
      throw error;
    }
  }

  /**
   * Delete a budget by ID and verify user ownership
   */
  public static async deleteBudget(userId: string, budgetId: string): Promise<void> {
    const result = await Budget.findOneAndDelete({ _id: budgetId, userId });
    if (!result) {
      throw new ApiError(404, 'Budget not found or unauthorized');
    }
  }

  /**
   * Get budget progress summary for a specific month
   */
  public static async getBudgetProgress(
    userId: string,
    monthStr: string,
  ): Promise<{
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    percentageUsed: number;
    status: string;
  }> {
    // 1. Fetch all budgets for the user in the selected month
    const budgets = await Budget.find({ userId, month: monthStr });
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);

    // 2. Parse the target month into Date boundaries (UTC)
    const [year, month] = monthStr.split('-').map((val) => parseInt(val, 10));
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    // 3. Query all expense transactions for the user in the date range
    const transactions = await Transaction.find({
      userId,
      type: 'Expense',
      transactionDate: { $gte: startDate, $lt: endDate },
    });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

    // 4. Calculate metrics
    const remainingBudget = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const status = totalSpent > totalBudget ? 'Over Budget' : 'On Track';

    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      percentageUsed,
      status,
    };
  }
}
