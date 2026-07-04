import { Employee, IEmployeeDocument } from '../models/Employee';
import { User } from '../models/User';
import { Salary } from '../models/Salary';
import { ApiError } from '../utils/ApiError';

export class EmployeeService {
  /**
   * Create an employee profile and link to existing User
   */
  public static async create(employeeData: any): Promise<IEmployeeDocument> {
    // Verify referenced user exists
    const user = await User.findById(employeeData.userId);
    if (!user) {
      throw new ApiError(404, 'The referenced User account does not exist');
    }

    // Verify user doesn't already have an employee profile linked
    const existingProfile = await Employee.findOne({ userId: employeeData.userId });
    if (existingProfile) {
      throw new ApiError(400, 'User already has an employee profile linked');
    }

    // Check duplicate employee email
    const emailExists = await Employee.findOne({ email: employeeData.email });
    if (emailExists) {
      throw new ApiError(400, 'Employee email is already in use');
    }

    const employee = new Employee(employeeData);
    await employee.save();
    return employee;
  }

  /**
   * Get employee profile by DB ID
   */
  public static async getById(id: string): Promise<IEmployeeDocument> {
    const employee = await Employee.findById(id).populate('userId', 'email role');
    if (!employee) {
      throw new ApiError(404, 'Employee profile not found');
    }
    return employee;
  }

  /**
   * Get employee profile by User ID (self lookup)
   */
  public static async getByUserId(userId: string): Promise<IEmployeeDocument> {
    const employee = await Employee.findOne({ userId }).populate('userId', 'email role');
    if (!employee) {
      throw new ApiError(404, 'Employee profile not found for this user account');
    }
    return employee;
  }

  /**
   * Retrieve list of employees with dynamic filters
   */
  public static async getAll(filters: { department?: string; status?: string; search?: string }): Promise<IEmployeeDocument[]> {
    const query: any = {};

    if (filters.department) {
      query.department = filters.department;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { department: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return Employee.find(query).populate('userId', 'email role');
  }

  /**
   * Update employee profile details
   */
  public static async update(id: string, updateData: any): Promise<IEmployeeDocument> {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new ApiError(404, 'Employee profile not found');
    }

    if (updateData.email && updateData.email !== employee.email) {
      const emailExists = await Employee.findOne({ email: updateData.email });
      if (emailExists) {
        throw new ApiError(400, 'Email address is already in use by another employee');
      }
    }

    // Apply updates manually to invoke mongoose pre-save hooks on Salary if basicSalary changes (though basicSalary changes in employee may or may not change existing salary records. In this model, base salary is on Employee and is copied into basicSalary of Salary logs)
    Object.assign(employee, updateData);
    await employee.save();
    return employee;
  }

  /**
   * Delete employee profile and link User account
   */
  public static async delete(id: string): Promise<void> {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new ApiError(404, 'Employee profile not found');
    }

    // Clean up User database entry as well
    await User.findByIdAndDelete(employee.userId);
    // Cascade delete associated Salary records
    await Salary.deleteMany({ employeeId: id });
    await Employee.findByIdAndDelete(id);
  }
}
