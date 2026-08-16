import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface IMonthlyBreakdown {
  month: string;
  income: number;
  expenses: number;
  netSavings: number;
}

export interface IReportData {
  categoryBreakdown?: ICategoryBreakdown[];
  incomeCategoryBreakdown?: ICategoryBreakdown[];
  monthlyBreakdown?: IMonthlyBreakdown[];
  transactionCount?: number;
  incomeTransactionCount?: number;
  expenseTransactionCount?: number;
  savingsRate?: number;
  recentTransactions?: any[];
  notes?: string;
  // Expense Breakdown specific
  avgExpensePerTransaction?: number;
  topExpenseCategory?: string;
  // Tax Summary specific
  taxableIncome?: number;
  totalDeductible?: number;
  deductionBreakdown?: Array<{ category: string; amount: number; count: number }>;
  effectiveTaxRate?: number;
  estimatedAnnualTax?: number;
  totalEstimatedTax?: number;
  quarterlyEstimates?: Array<{
    quarter: string;
    grossIncome: number;
    estimatedTax: number;
    dueDate: Date | string;
    status: string;
    country: string;
    businessExpenses: number;
    retirementContribution: number;
    healthInsurancePremiums: number;
    homeOfficeDeduction: number;
  }>;
  country?: string;
}

export interface IReport {
  userId: mongoose.Types.ObjectId;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  reportType: string;
  format: 'PDF' | 'CSV';
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  filePath?: string;
  data?: IReportData;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportDocument extends IReport, Document {}

const reportSchema = new Schema<IReportDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    period: {
      type: String,
      required: [true, 'Period is required'],
      trim: true,
      default: 'Monthly',
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required'],
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required'],
    },
    reportType: {
      type: String,
      required: [true, 'Report type is required'],
      trim: true,
      default: 'Income & Expense Summary',
    },
    format: {
      type: String,
      required: [true, 'Format is required'],
      enum: {
        values: ['PDF', 'CSV'],
        message: 'Format must be either PDF or CSV',
      },
      default: 'PDF',
    },
    totalIncome: {
      type: Number,
      required: true,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      required: true,
      default: 0,
    },
    netSavings: {
      type: Number,
      required: true,
      default: 0,
    },
    filePath: {
      type: String,
      default: '',
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for listing user reports ordered by creation date
reportSchema.index({ userId: 1, createdAt: -1 });

export const Report = mongoose.model<IReportDocument>('Report', reportSchema, 'reports');
