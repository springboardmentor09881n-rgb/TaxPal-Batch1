import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class CategoryController {
  /**
   * Get all categories for the authenticated user
   */
  public static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      console.log('=== Backend Category Debug ===');
      console.log('Request userId:', userId);
      
      const categories = await CategoryService.getCategories(userId);
      
      console.log('Categories found:', categories.length);
      console.log('Categories data:', JSON.stringify(categories, null, 2));
      console.log('=== End Backend Debug ===');
      
      res.status(200).json(new ApiResponse(categories, 'Categories retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get categories by type for the authenticated user
   */
  public static async getCategoriesByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const { type } = req.params;
      if (type !== 'expense' && type !== 'income') {
        throw new ApiError(400, 'Invalid category type. Must be expense or income');
      }

      const categories = await CategoryService.getCategoriesByType(userId, type as 'expense' | 'income');
      res.status(200).json(new ApiResponse(categories, 'Categories retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new category
   */
  public static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const { name, type, color, icon } = req.body;

      if (!name || !type) {
        throw new ApiError(400, 'Name and type are required');
      }

      if (type !== 'expense' && type !== 'income') {
        throw new ApiError(400, 'Invalid category type. Must be expense or income');
      }

      const category = await CategoryService.createCategory(userId, {
        name,
        type,
        color,
        icon
      });

      res.status(201).json(new ApiResponse(category, 'Category created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a category
   */
  public static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const { categoryId } = req.params;
      const { name, color, icon } = req.body;

      const category = await CategoryService.updateCategory(categoryId, userId, {
        name,
        color,
        icon
      });

      res.status(200).json(new ApiResponse(category, 'Category updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category
   */
  public static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const { categoryId } = req.params;

      await CategoryService.deleteCategory(categoryId, userId);
      res.status(200).json(new ApiResponse(null, 'Category deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initialize default categories for a new user
   */
  public static async initializeDefaultCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      await CategoryService.initializeDefaultCategories(userId);
      res.status(201).json(new ApiResponse(null, 'Default categories initialized successfully'));
    } catch (error) {
      next(error);
    }
  }
}
