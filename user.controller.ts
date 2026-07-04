import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class UserController {
  /**
   * Fetch current authenticated user profile
   */
  public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new ApiError(401, 'Unauthorized: User session missing');
      }

      const user = await UserService.getUserById(req.user.id);
      res.status(200).json(new ApiResponse(user, 'User profile retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update details of the current authenticated user
   */
  public static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new ApiError(401, 'Unauthorized: User session missing');
      }

      const user = await UserService.updateUser(req.user.id, req.body);
      res.status(200).json(new ApiResponse(user, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change current user's password
   */
  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new ApiError(401, 'Unauthorized: User session missing');
      }

      await UserService.changePassword(req.user.id, req.body);
      res.status(200).json(new ApiResponse(null, 'Password updated successfully. Please login again.'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user by ID (typically HR/Admin endpoint)
   */
  public static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);
      res.status(200).json(new ApiResponse(null, 'User and associated employee profile deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
