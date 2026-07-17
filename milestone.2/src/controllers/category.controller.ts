import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { suggestCategory } from '../utils/categorySuggester';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class CategoryController {
  /**
   * Create category route handler
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context not found');
      }

      const { name } = req.body;
      const category = await CategoryService.createCategory(userId, name);

      res.status(201).json(new ApiResponse(category, 'Category created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * List categories route handler
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context not found');
      }

      const categories = await CategoryService.getCategories(userId);
      res.status(200).json(new ApiResponse(categories, 'Categories retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update category route handler
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context not found');
      }

      const categoryId = req.params.id;
      const { name } = req.body;

      const category = await CategoryService.updateCategory(userId, categoryId, name);
      res.status(200).json(new ApiResponse(category, 'Category updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete category route handler
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context not found');
      }

      const categoryId = req.params.id;

      await CategoryService.deleteCategory(userId, categoryId);
      res.status(200).json(new ApiResponse(null, 'Category deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suggest category route handler
   */
  public static async suggest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { description } = req.body;
      const suggestedCategory = suggestCategory(description);

      res.status(200).json({
        suggestedCategory,
      });
    } catch (error) {
      next(error);
    }
  }
}
