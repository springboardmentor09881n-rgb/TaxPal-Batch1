import mongoose, { Schema, Document } from 'mongoose';
import { PaymentStatus } from '../utils/constants';

export interface ISalary {
  employeeId: mongoose.Types.ObjectId;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  month: number; // 1 to 12
  year: number;
  paymentStatus: PaymentStatus;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISalaryDocument extends ISalary, Document {}

const salarySchema = new Schema<ISalaryDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
    },
    basicSalary: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: [0, 'Basic salary cannot be negative'],
    },
    allowances: {
      type: Number,
      default: 0,
      min: [0, 'Allowances cannot be negative'],
    },
    bonus: {
      type: Number,
      default: 0,
      min: [0, 'Bonus cannot be negative'],
    },
    deductions: {
      type: Number,
      default: 0,
      min: [0, 'Deductions cannot be negative'],
    },
    netSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    month: {
      type: Number,
      required: [true, 'Salary month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Salary year is required'],
      min: [2000, 'Year must be valid'],
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose pre-save hook to calculate net salary
salarySchema.pre<ISalaryDocument>('save', function (next) {
  this.netSalary = this.basicSalary + (this.allowances || 0) + (this.bonus || 0) - (this.deductions || 0);
  next();
});

export const Salary = mongoose.model<ISalaryDocument>('Salary', salarySchema);
