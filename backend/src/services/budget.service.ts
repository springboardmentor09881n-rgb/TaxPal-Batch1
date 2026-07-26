import mongoose from 'mongoose';
import { Budget } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';

export class BudgetService {
  /**
   * Retrieve budgets merged with spending status for the current month
   */
  public static async getBudgetsAndSpending(userId: string): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all user budget limits
    const budgets = await Budget.find({ userId });

    // Group expenses for the current month by category
    const spendingAggregation = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'Expense',
          transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    // Create a spending lookup map
    const spendingMap = new Map<string, number>();
    spendingAggregation.forEach((item) => {
      spendingMap.set(item._id, item.totalSpent);
    });

    // Merge budgets and current spending
    const budgetList: any[] = [];
    const processedCategories = new Set<string>();

    // Add categories with budget limits
    budgets.forEach((b) => {
      const category = b.category;
      const limit = b.limit;
      const spent = spendingMap.get(category) || 0;
      const remaining = limit - spent;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      budgetList.push({
        _id: b._id,
        category,
        limit,
        spent,
        remaining,
        percentage,
      });
      processedCategories.add(category);
    });

    // Add categories with spending but NO budget limits
    spendingMap.forEach((spent, category) => {
      if (!processedCategories.has(category)) {
        budgetList.push({
          category,
          limit: 0,
          spent,
          remaining: -spent,
          percentage: 0,
        });
      }
    });

    // Fetch user settings for auto-categorization
    const user = await User.findById(userId);

    return {
      budgets: budgetList,
      settings: {
        autoCategorizeEnabled: user?.autoCategorizeEnabled ?? true,
        categoryMappings: user?.categoryMappings ?? [],
      },
    };
  }

  /**
   * Set or update budget limit for a category
   */
  public static async setBudgetLimit(userId: string, category: string, limit: number): Promise<any> {
    const budget = await Budget.findOneAndUpdate(
      { userId, category },
      { $set: { limit } },
      { new: true, upsert: true, runValidators: true }
    );
    return budget;
  }

  /**
   * Delete a budget limit for a category
   */
  public static async deleteBudgetLimit(userId: string, category: string): Promise<void> {
    await Budget.findOneAndDelete({ userId, category });
  }
}
