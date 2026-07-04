import { User, IUserDocument } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { Employee } from '../models/Employee';
import { Salary } from '../models/Salary';

export class UserService {
  /**
   * Get user by ID
   */
  public static async getUserById(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  /**
   * Update user details (e.g. email)
   */
  public static async updateUser(userId: string, updateData: { email?: string }): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (updateData.email && updateData.email !== user.email) {
      const emailExists = await User.findOne({ email: updateData.email });
      if (emailExists) {
        throw new ApiError(400, 'Email is already taken by another user');
      }
      user.email = updateData.email;
      
      // Update employee email if employee profile exists
      await Employee.findOneAndUpdate({ userId: user._id }, { email: updateData.email });
    }

    await user.save();
    return user;
  }

  /**
   * Change user password
   */
  public static async changePassword(
    userId: string,
    passwords: { oldPassword: string; newPassword: string }
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await user.comparePassword(passwords.oldPassword);
    if (!isMatch) {
      throw new ApiError(400, 'Invalid current password');
    }

    user.password = passwords.newPassword;
    user.refreshTokens = []; // Log out from all sessions on password change
    await user.save();
  }

  /**
   * Delete user and their associated employee profile
   */
  public static async deleteUser(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const employee = await Employee.findOne({ userId: user._id });
    if (employee) {
      // Cascade delete salaries linked to employee
      await Salary.deleteMany({ employeeId: employee._id });
      await Employee.findByIdAndDelete(employee._id);
    }
    await User.findByIdAndDelete(userId);
  }
}
