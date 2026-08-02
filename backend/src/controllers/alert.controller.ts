import { Request, Response, NextFunction } from 'express';
import { AlertService } from '../services/alert.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class AlertController {
  /**
   * Create alert manually
   * POST /api/alerts
   */
  public static async createAlert(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const alert = await AlertService.createAlert(userId, req.body);
      res.status(201).json(new ApiResponse(alert, 'Alert created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all alerts for logged-in user
   * GET /api/alerts
   */
  public static async getAlerts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      let isReadFilter: boolean | undefined = undefined;
      if (req.query.isRead !== undefined) {
        isReadFilter = req.query.isRead === 'true';
      }

      const alerts = await AlertService.getAlerts(userId, isReadFilter);
      res.status(200).json(new ApiResponse(alerts, 'Alerts retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single alert by ID
   * GET /api/alerts/:id
   */
  public static async getAlertById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const { id } = req.params;
      const alert = await AlertService.getAlertById(userId, id);
      res.status(200).json(new ApiResponse(alert, 'Alert retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark alert as Read
   * PUT /api/alerts/:id/read
   */
  public static async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const { id } = req.params;
      const updatedAlert = await AlertService.markAsRead(userId, id);
      res.status(200).json(new ApiResponse(updatedAlert, 'Alert marked as read successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete alert by ID
   * DELETE /api/alerts/:id
   */
  public static async deleteAlert(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const { id } = req.params;
      await AlertService.deleteAlert(userId, id);
      res.status(200).json(new ApiResponse(null, 'Alert deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
