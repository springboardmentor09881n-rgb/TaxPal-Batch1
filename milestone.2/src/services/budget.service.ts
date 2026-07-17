import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';

export class BudgetService {
  /**
   * Create or update monthly budget
   */
  public static async createBudget(userId: string, category: string, limit: number, month: string) {
    const trimmedCategory = category.trim();

    // Check if category exists for user (either custom or default)
    const categoryExists = await prisma.category.findFirst({
      where: {
        userId,
        name: {
          equals: trimmedCategory,
          mode: 'insensitive',
        },
      },
    });

    if (!categoryExists) {
      throw new ApiError(404, `Category '${trimmedCategory}' does not exist. Please create it first.`);
    }

    // Check if budget already exists for this month and category (case-insensitive check)
    const existing = await prisma.budget.findFirst({
      where: {
        userId,
        month,
        category: {
          equals: trimmedCategory,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ApiError(400, 'Budget already exists for this month and category');
    }

    // Use the actual case of the category name from the Category table for consistency
    return prisma.budget.create({
      data: {
        userId,
        category: categoryExists.name,
        limit,
        month,
      },
    });
  }

  /**
   * List budgets for a month
   */
  public static async getBudgets(userId: string, month: string) {
    return prisma.budget.findMany({
      where: { userId, month },
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Delete a budget
   */
  public static async deleteBudget(userId: string, budgetId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new ApiError(404, 'Budget not found');
    }

    await prisma.budget.delete({
      where: { id: budgetId },
    });
  }

  /**
   * Retrieve budget progress for a month
   */
  public static async getBudgetProgress(userId: string, month: string) {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));

    // Get all expense transactions in the month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // Sum transactions by category
    const spentByCategory: Record<string, number> = {};
    for (const tx of transactions) {
      const catKey = tx.category.toLowerCase();
      spentByCategory[catKey] = (spentByCategory[catKey] || 0) + tx.amount;
    }

    // Get budgets for the month
    const budgets = await prisma.budget.findMany({
      where: { userId, month },
    });

    // Map budget to progress
    return budgets.map((b) => {
      const spent = spentByCategory[b.category.toLowerCase()] || 0;
      return {
        id: b.id,
        category: b.category,
        limit: b.limit,
        spent,
        remaining: parseFloat((b.limit - spent).toFixed(2)),
        percentageUsed: b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0,
      };
    });
  }

  /**
   * Retrieve spending breakdown chart data
   */
  public static async getSpendingChart(userId: string, month: string) {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));

    // Get expense transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // Load category name mappings to keep correct display casing
    const categories = await prisma.category.findMany({
      where: { userId },
    });

    const categoryCasingMap: Record<string, string> = {};
    for (const cat of categories) {
      categoryCasingMap[cat.name.toLowerCase()] = cat.name;
    }

    const spentByCategory: Record<string, number> = {};
    for (const tx of transactions) {
      const key = tx.category.toLowerCase();
      const displayCategory = categoryCasingMap[key] || tx.category;
      spentByCategory[displayCategory] = (spentByCategory[displayCategory] || 0) + tx.amount;
    }

    // Sort by spending value descending
    const sortedCategories = Object.entries(spentByCategory)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);

    const labels = sortedCategories.map(([label]) => label);
    const values = sortedCategories.map(([_, val]) => parseFloat(val.toFixed(2)));

    return {
      labels,
      values,
    };
  }
}
