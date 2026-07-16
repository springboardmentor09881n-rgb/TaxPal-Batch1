import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget {
  userId: mongoose.Types.ObjectId;
  category: string;
  limit: number;
  month: string;
  spent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBudgetDocument extends IBudget, Document {}

const budgetSchema = new Schema<IBudgetDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    limit: {
      type: Number,
      required: [true, 'Limit is required'],
      min: [0, 'Limit cannot be negative'],
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      trim: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Please fill a valid month format (YYYY-MM)'],
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative'],
    },
  },
  {
    timestamps: true,
  },
);

// Ensure index for unique budget per user, category, and month combination
budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model<IBudgetDocument>('Budget', budgetSchema);
