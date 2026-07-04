import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../utils/constants';

export class EmployeeController {
  /**
   * Create new employee profile (HR/Admin only)
   */
  public static async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await EmployeeService.create(req.body);
      res.status(201).json(new ApiResponse(employee, 'Employee profile created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee by ID
   */
  public static async getEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await EmployeeService.getById(id);

      // Access checks: Employees can only view their own profile
      if (req.user?.role === UserRole.EMPLOYEE) {
        const associatedUserId = (employee.userId as any)._id?.toString() || employee.userId.toString();
        if (associatedUserId !== req.user.id) {
          throw new ApiError(403, 'Access denied: You can only view your own profile');
        }
      }

      res.status(200).json(new ApiResponse(employee, 'Employee profile retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user's employee profile
   */
  public static async getMyEmployeeProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new ApiError(401, 'Unauthorized: Session missing');
      }

      const employee = await EmployeeService.getByUserId(req.user.id);
      res.status(200).json(new ApiResponse(employee, 'Your employee profile retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve list of employees (Admin/HR/Manager only)
   */
  public static async getEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = req.query.department as string | undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const employees = await EmployeeService.getAll({ department, status, search });
      res.status(200).json(new ApiResponse(employees, 'Employees retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update employee details (HR/Admin only)
   */
  public static async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await EmployeeService.update(id, req.body);
      res.status(200).json(new ApiResponse(employee, 'Employee profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete employee details (HR/Admin only)
   */
  public static async deleteEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await EmployeeService.delete(id);
      res.status(200).json(new ApiResponse(null, 'Employee profile deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
