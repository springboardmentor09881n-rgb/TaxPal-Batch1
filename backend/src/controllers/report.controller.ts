import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class ReportController {
  /**
   * Generate a new report
   */
  public static async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const report = await ReportService.generateReport(userId, req.body);
      res.status(201).json(new ApiResponse(report, 'Report generated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all user reports
   */
  public static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const reports = await ReportService.getReports(userId);
      res.status(200).json(new ApiResponse(reports, 'Reports retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single report by ID
   */
  public static async getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: reportId } = req.params;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const report = await ReportService.getReportById(userId, reportId);
      res.status(200).json(new ApiResponse(report, 'Report retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download report file (PDF or CSV)
   */
  public static async downloadReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: reportId } = req.params;
      const formatOverride = req.query?.format ? String(req.query.format) : '';

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const report = await ReportService.getReportById(userId, reportId);
      const exportFormat = (formatOverride || report.format || 'PDF').toUpperCase();
      
      const user = await import('../models/User').then(m => m.User.findById(userId));
      const userName = user?.fullName || 'Freelancer';

      const safePeriod = (report.period || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeType = (report.reportType || 'Summary').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `TaxPal_${safeType}_${safePeriod}.${exportFormat === 'CSV' ? 'csv' : 'pdf'}`;

      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

      if (exportFormat === 'CSV') {
        const csvBuffer = ReportService.generateCSV(report);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvBuffer);
      } else {
        const pdfBuffer = await ReportService.generatePDF(report, userName);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(pdfBuffer);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete report
   */
  public static async deleteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: reportId } = req.params;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      await ReportService.deleteReport(userId, reportId);
      res.status(200).json(new ApiResponse(null, 'Report deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
