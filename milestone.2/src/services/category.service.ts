import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';

export class CategoryService {
  /**
   * Create a custom category
   */
  public static async createCategory(userId: string, name: string) {
    const trimmedName = name.trim();

    // Check if category with same name already exists for the user (custom or default)
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: {
          equals: trimmedName,
          mode: 'insensitive', // Case-insensitive check
        },
      },
    });

    if (existing) {
      throw new ApiError(400, `Category '${trimmedName}' already exists`);
    }

    return prisma.category.create({
      data: {
        userId,
        name: trimmedName,
        isDefault: false,
      },
    });
  }

  /**
   * List all categories (custom + default) for the user
   */
  public static async getCategories(userId: string) {
    return prisma.category.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' }, // Show default categories first
        { name: 'asc' },       // Then custom categories alphabetically
      ],
    });
  }

  /**
   * Update category name
   */
  public static async updateCategory(userId: string, categoryId: string, name: string) {
    const trimmedName = name.trim();

    // Find category
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    if (category.isDefault) {
      throw new ApiError(400, 'Default categories cannot be renamed');
    }

    // Check duplicate name
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        id: { not: categoryId },
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ApiError(400, `Another category named '${trimmedName}' already exists`);
    }

    return prisma.category.update({
      where: { id: categoryId },
      data: { name: trimmedName },
    });
  }

  /**
   * Delete custom category
   */
  public static async deleteCategory(userId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    if (category.isDefault) {
      throw new ApiError(400, 'Default categories cannot be deleted');
    }

    // Check if transactions exist using this category name
    const activeTransactions = await prisma.transaction.count({
      where: {
        userId,
        category: {
          equals: category.name,
          mode: 'insensitive',
        },
      },
    });

    if (activeTransactions > 0) {
      throw new ApiError(
        400,
        `Cannot delete category '${category.name}' because it is in use by ${activeTransactions} transaction(s)`
      );
    }

    // Check if budgets exist using this category name
    const activeBudgets = await prisma.budget.count({
      where: {
        userId,
        category: {
          equals: category.name,
          mode: 'insensitive',
        },
      },
    });

    if (activeBudgets > 0) {
      throw new ApiError(
        400,
        `Cannot delete category '${category.name}' because it is in use by ${activeBudgets} budget(s)`
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });
  }
}
