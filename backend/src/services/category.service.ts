import { Category } from '../models/Category';
import { ApiError } from '../utils/ApiError';

export class CategoryService {
  /**
   * Get all categories for a user
   */
  public static async getCategories(userId: string): Promise<any[]> {
    const categories = await Category.find({ userId });
    return categories;
  }

  /**
   * Get categories by type for a user
   */
  public static async getCategoriesByType(userId: string, type: 'expense' | 'income'): Promise<any[]> {
    const categories = await Category.find({ userId, type });
    return categories;
  }

  /**
   * Create a new category
   */
  public static async createCategory(userId: string, categoryData: {
    name: string;
    type: 'expense' | 'income';
    color?: string;
    icon?: string;
    isDefault?: boolean;
  }): Promise<any> {
    // Check if category with same name and type already exists for this user
    const existingCategory = await Category.findOne({
      userId,
      name: categoryData.name,
      type: categoryData.type
    });

    if (existingCategory) {
      throw new ApiError(400, `Category with name '${categoryData.name}' already exists`);
    }

    const category = new Category({
      userId,
      name: categoryData.name,
      type: categoryData.type,
      color: categoryData.color || '#6366f1',
      icon: categoryData.icon || 'tag',
      isDefault: categoryData.isDefault || false,
    });

    await category.save();
    return category;
  }

  /**
   * Update a category
   */
  public static async updateCategory(categoryId: string, userId: string, categoryData: {
    name?: string;
    color?: string;
    icon?: string;
  }): Promise<any> {
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // If updating name, check for duplicates
    if (categoryData.name && categoryData.name !== category.name) {
      const existingCategory = await Category.findOne({
        userId,
        name: categoryData.name,
        type: category.type
      });

      if (existingCategory) {
        throw new ApiError(400, `Category with name '${categoryData.name}' already exists`);
      }
      category.name = categoryData.name;
    }

    if (categoryData.color !== undefined) category.color = categoryData.color;
    if (categoryData.icon !== undefined) category.icon = categoryData.icon;

    await category.save();
    return category;
  }

  /**
   * Delete a category
   */
  public static async deleteCategory(categoryId: string, userId: string): Promise<void> {
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // Prevent deletion of default categories
    if (category.isDefault) {
      throw new ApiError(400, 'Cannot delete default categories');
    }

    await Category.deleteOne({ _id: categoryId });
  }

  /**
   * Initialize default categories for a new user
   */
  public static async initializeDefaultCategories(userId: string): Promise<void> {
    const defaultExpenseCategories = [
      { name: 'Office Supplies', color: '#3b82f6', icon: 'briefcase' },
      { name: 'Software/SaaS', color: '#8b5cf6', icon: 'cpu' },
      { name: 'Hardware/Gadgets', color: '#ec4899', icon: 'monitor' },
      { name: 'Travel/Meals', color: '#f59e0b', icon: 'plane' },
      { name: 'Marketing/Ads', color: '#ef4444', icon: 'megaphone' },
      { name: 'Other', color: '#6b7280', icon: 'more-horizontal' }
    ];

    const defaultIncomeCategories = [
      { name: 'Freelance Project', color: '#10b981', icon: 'briefcase' },
      { name: 'Consulting', color: '#06b6d4', icon: 'users' },
      { name: 'Contract Work', color: '#8b5cf6', icon: 'file-text' },
      { name: 'Royalties', color: '#f59e0b', icon: 'gift' },
      { name: 'Ad Revenue', color: '#ef4444', icon: 'trending-up' },
      { name: 'Other', color: '#6b7280', icon: 'more-horizontal' }
    ];

    // Create default expense categories
    for (const cat of defaultExpenseCategories) {
      await Category.create({
        userId,
        name: cat.name,
        type: 'expense',
        color: cat.color,
        icon: cat.icon,
        isDefault: true
      });
    }

    // Create default income categories
    for (const cat of defaultIncomeCategories) {
      await Category.create({
        userId,
        name: cat.name,
        type: 'income',
        color: cat.color,
        icon: cat.icon,
        isDefault: true
      });
    }
  }
}
