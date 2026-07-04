import { Salary, ISalaryDocument } from '../models/Salary';
import { Employee } from '../models/Employee';
import { ApiError } from '../utils/ApiError';
import { PaymentStatus } from '../utils/constants';

export class SalaryService {
  /**
   * Create a new salary record for an employee
   */
  public static async create(salaryData: any): Promise<ISalaryDocument> {
    // Verify referenced employee exists
    const employee = await Employee.findById(salaryData.employeeId);
    if (!employee) {
      throw new ApiError(404, 'Employee record not found');
    }

    // Check duplicate salary for same month/year
    const duplicate = await Salary.findOne({
      employeeId: salaryData.employeeId,
      month: salaryData.month,
      year: salaryData.year,
    });
    if (duplicate) {
      throw new ApiError(400, `Salary record already exists for this employee for month ${salaryData.month}/${salaryData.year}`);
    }

    // Set auto-computed net salary
    const netSalary =
      salaryData.basicSalary +
      (salaryData.allowances || 0) +
      (salaryData.bonus || 0) -
      (salaryData.deductions || 0);

    const salary = new Salary({
      ...salaryData,
      netSalary,
    });

    await salary.save();
    return salary;
  }

  /**
   * Get a salary record by ID
   */
  public static async getById(id: string): Promise<ISalaryDocument> {
    const salary = await Salary.findById(id).populate('employeeId');
    if (!salary) {
      throw new ApiError(404, 'Salary record not found');
    }
    return salary;
  }

  /**
   * Retrieve list of salary records with filters
   */
  public static async getAll(filters: {
    employeeId?: string;
    month?: number;
    year?: number;
    paymentStatus?: PaymentStatus;
  }): Promise<ISalaryDocument[]> {
    const query: any = {};

    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters.month) {
      query.month = filters.month;
    }
    if (filters.year) {
      query.year = filters.year;
    }
    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    return Salary.find(query).populate('employeeId');
  }

  /**
   * Get all salaries linked to a User account (for self checks)
   */
  public static async getByUserId(userId: string): Promise<ISalaryDocument[]> {
    const employee = await Employee.findOne({ userId });
    if (!employee) {
      throw new ApiError(404, 'Employee profile not found for this user account');
    }
    return Salary.find({ employeeId: employee._id }).populate('employeeId');
  }

  /**
   * Update details of a salary record and recalculate netSalary
   */
  public static async update(id: string, updateData: any): Promise<ISalaryDocument> {
    const salary = await Salary.findById(id);
    if (!salary) {
      throw new ApiError(404, 'Salary record not found');
    }

    const basicSalary = updateData.basicSalary !== undefined ? updateData.basicSalary : salary.basicSalary;
    const allowances = updateData.allowances !== undefined ? updateData.allowances : salary.allowances;
    const bonus = updateData.bonus !== undefined ? updateData.bonus : salary.bonus;
    const deductions = updateData.deductions !== undefined ? updateData.deductions : salary.deductions;

    // Recalculate netSalary
    updateData.netSalary = basicSalary + allowances + bonus - deductions;

    Object.assign(salary, updateData);
    await salary.save();
    return salary;
  }

  /**
   * Approve or change status of a salary payment record
   */
  public static async approve(id: string, paymentStatus: PaymentStatus): Promise<ISalaryDocument> {
    const salary = await Salary.findById(id);
    if (!salary) {
      throw new ApiError(404, 'Salary record not found');
    }

    salary.paymentStatus = paymentStatus;
    
    // Set paymentDate when marked as Approved or Paid
    if (paymentStatus === PaymentStatus.APPROVED || paymentStatus === PaymentStatus.PAID) {
      salary.paymentDate = new Date();
    } else {
      salary.paymentDate = undefined;
    }

    await salary.save();
    return salary;
  }

  /**
   * Delete a salary record
   */
  public static async delete(id: string): Promise<void> {
    const salary = await Salary.findById(id);
    if (!salary) {
      throw new ApiError(404, 'Salary record not found');
    }
    await Salary.findByIdAndDelete(id);
  }
}
