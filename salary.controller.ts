import { Request, Response, NextFunction } from 'express';
import { SalaryService } from '../services/salary.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../utils/constants';
import { Employee } from '../models/Employee';

export class SalaryController {
  /**
   * Create a new salary record (HR/Admin only)
   */
  public static async createSalary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const salary = await SalaryService.create(req.body);
      res.status(201).json(new ApiResponse(salary, 'Salary record created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get salary record by ID
   */
  public static async getSalary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const salary = await SalaryService.getById(id);

      // Access checks: Employees can only view their own salary records
      if (req.user?.role === UserRole.EMPLOYEE) {
        const employee = await Employee.findById(salary.employeeId);
        if (!employee || employee.userId.toString() !== req.user.id) {
          throw new ApiError(403, 'Access denied: You can only view your own salary records');
        }
      }

      res.status(200).json(new ApiResponse(salary, 'Salary record retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated employee's salary history
   */
  public static async getMySalaries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new ApiError(401, 'Unauthorized: Session missing');
      }

      const salaries = await SalaryService.getByUserId(req.user.id);
      res.status(200).json(new ApiResponse(salaries, 'Your salary history retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve all salary records with filters (Admin/HR/Manager only)
   */
  public static async getSalaries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = req.query.employeeId as string | undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const paymentStatus = req.query.paymentStatus as any | undefined;

      const salaries = await SalaryService.getAll({ employeeId, month, year, paymentStatus });
      res.status(200).json(new ApiResponse(salaries, 'Salary records retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update details of a salary record (HR/Admin only)
   */
  public static async updateSalary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const salary = await SalaryService.update(id, req.body);
      res.status(200).json(new ApiResponse(salary, 'Salary record updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a salary record (Manager/Admin only)
   */
  public static async approveSalary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      const salary = await SalaryService.approve(id, paymentStatus);
      res.status(200).json(new ApiResponse(salary, `Salary record marked as ${paymentStatus} successfully`));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a salary record (HR/Admin only)
   */
  public static async deleteSalary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await SalaryService.delete(id);
      res.status(200).json(new ApiResponse(null, 'Salary record deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
