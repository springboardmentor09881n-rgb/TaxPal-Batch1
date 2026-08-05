import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxEstimate {
  userId: mongoose.Types.ObjectId;
  country: string;
  state?: string;
  quarter: string;
  estimatedTax: number;
  dueDate: Date;
  status: string;
  filingStatus: string;
  grossIncomeForQuarter: number;
  businessExpenses: number;
  retirementContribution: number;
  healthInsurancePremiums: number;
  homeOfficeDeduction: number;
  taxableIncome?: number;
  annualTaxableIncome?: number;
  annualEstimatedTax?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaxEstimateDocument extends ITaxEstimate, Document {}

const taxEstimateSchema = new Schema<ITaxEstimateDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    quarter: {
      type: String,
      required: [true, 'Quarter is required'],
      enum: {
        values: ['Q1', 'Q2', 'Q3', 'Q4'],
        message: 'Quarter must be Q1, Q2, Q3, or Q4',
      },
      trim: true,
    },
    estimatedTax: {
      type: Number,
      required: [true, 'Estimated tax is required'],
      min: [0, 'Estimated tax cannot be negative'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      default: 'Pending',
      trim: true,
    },
    filingStatus: {
      type: String,
      default: 'Not Filed',
      trim: true,
    },
    grossIncomeForQuarter: {
      type: Number,
      required: [true, 'Gross income for quarter is required'],
      min: [0.01, 'Gross income for quarter must be greater than 0'],
    },
    businessExpenses: {
      type: Number,
      default: 0,
      min: [0, 'Business expenses cannot be negative'],
    },
    retirementContribution: {
      type: Number,
      default: 0,
      min: [0, 'Retirement contribution cannot be negative'],
    },
    healthInsurancePremiums: {
      type: Number,
      default: 0,
      min: [0, 'Health insurance premiums cannot be negative'],
    },
    homeOfficeDeduction: {
      type: Number,
      default: 0,
      min: [0, 'Home office deduction cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual properties computed on-the-fly for frontend serialization
taxEstimateSchema.virtual('taxableIncome').get(function (this: ITaxEstimateDocument) {
  const gross = this.grossIncomeForQuarter || 0;
  const business = this.businessExpenses || 0;
  const retirement = this.retirementContribution || 0;
  const health = this.healthInsurancePremiums || 0;
  const homeOffice = this.homeOfficeDeduction || 0;
  const quarterlyDeductions = business + retirement + health + homeOffice;
  return Math.max(0, gross - quarterlyDeductions);
});

taxEstimateSchema.virtual('annualTaxableIncome').get(function (this: ITaxEstimateDocument) {
  const gross = this.grossIncomeForQuarter || 0;
  const business = this.businessExpenses || 0;
  const retirement = this.retirementContribution || 0;
  const health = this.healthInsurancePremiums || 0;
  const homeOffice = this.homeOfficeDeduction || 0;
  const quarterlyDeductions = business + retirement + health + homeOffice;
  return Math.max(0, gross * 4 - quarterlyDeductions * 4);
});

taxEstimateSchema.virtual('annualEstimatedTax').get(function (this: ITaxEstimateDocument) {
  return this.estimatedTax * 4;
});

// Index to ensure efficient querying per user and quarter
export const TaxEstimate = mongoose.model<ITaxEstimateDocument>(
  'TaxEstimate',
  taxEstimateSchema,
  'taxEstimates'
);
