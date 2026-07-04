import mongoose, { Schema, Document } from 'mongoose';
import { EmployeeStatus } from '../utils/constants';

export interface IEmployee {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: Date;
  salary: number;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployeeDocument extends IEmployee, Document {}

const employeeSchema = new Schema<IEmployeeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User link is required'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Employee email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    salary: {
      type: Number,
      required: [true, 'Base salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(EmployeeStatus),
      default: EmployeeStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

export const Employee = mongoose.model<IEmployeeDocument>('Employee', employeeSchema);
