import { Request, Response, NextFunction } from 'express';
import { TaxEstimateService } from '../services/taxEstimate.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class TaxEstimateController {
  /**
   * Create a new tax estimate
   * POST /api/tax-estimates
   */
  public static async createTaxEstimate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const estimate = await TaxEstimateService.createTaxEstimate(userId, req.body);
      res.status(201).json(new ApiResponse(estimate, 'Tax estimate created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all tax estimates for logged-in user
   * GET /api/tax-estimates
   */
  public static async getTaxEstimates(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const estimates = await TaxEstimateService.getTaxEstimates(userId);
      res.status(200).json(new ApiResponse(estimates, 'Tax estimates retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single tax estimate by ID
   * GET /api/tax-estimates/:id
   */
  public static async getTaxEstimateById(
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
      const estimate = await TaxEstimateService.getTaxEstimateById(userId, id);
      res.status(200).json(new ApiResponse(estimate, 'Tax estimate retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update tax estimate by ID
   * PUT /api/tax-estimates/:id
   */
  public static async updateTaxEstimate(
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
      const updatedEstimate = await TaxEstimateService.updateTaxEstimate(userId, id, req.body);
      res.status(200).json(new ApiResponse(updatedEstimate, 'Tax estimate updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete tax estimate by ID
   * DELETE /api/tax-estimates/:id
   */
  public static async deleteTaxEstimate(
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
      await TaxEstimateService.deleteTaxEstimate(userId, id);
      res.status(200).json(new ApiResponse(null, 'Tax estimate deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
