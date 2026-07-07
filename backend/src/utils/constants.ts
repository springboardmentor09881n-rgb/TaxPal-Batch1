export enum UserRole {
  ADMIN = 'Admin',
  HR = 'HR',
  MANAGER = 'Manager',
  EMPLOYEE = 'Employee',
}

export enum EmployeeStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  TERMINATED = 'Terminated',
}

export enum PaymentStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  PAID = 'Paid',
  REJECTED = 'Rejected',
}

export const ROLES = Object.values(UserRole);
export const EMPLOYEE_STATUSES = Object.values(EmployeeStatus);
export const PAYMENT_STATUSES = Object.values(PaymentStatus);
