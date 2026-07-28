import mongoose from 'mongoose';
import { Budget } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';

export class BudgetService {
  /**
   * Retrieve budgets merged with spending status for the current month
   */
  public static async getBudgetsAndSpending(userId: string, monthStr?: string): Promise<any> {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-11

    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      const parts = monthStr.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
    } else {
      monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    }

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Get all user budget limits for this month
    const budgets = await Budget.find({ userId, month: monthStr });

    // Group expenses for the selected month by category
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
        month: b.month,
        description: b.description || '',
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
          month: monthStr,
          description: '',
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
  public static async setBudgetLimit(userId: string, category: string, limit: number, month?: string, description?: string): Promise<any> {
    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const budget = await Budget.findOneAndUpdate(
      { userId, category, month },
      { $set: { limit, description: description || '' } },
      { new: true, upsert: true, runValidators: true }
    );
    return budget;
  }

  /**
   * Delete a budget limit for a category
   */
  public static async deleteBudgetLimit(userId: string, category: string, monthStr?: string): Promise<void> {
    const query: any = { userId, category };
    if (monthStr) {
      query.month = monthStr;
    } else {
      const now = new Date();
      query.month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    await Budget.findOneAndDelete(query);
  }
}
