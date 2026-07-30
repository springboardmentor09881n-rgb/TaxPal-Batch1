import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget {
  userId: mongoose.Types.ObjectId;
  category: string;
  limit: number;
  month: string;
  description?: string;
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
      default: () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// A user can only have one budget per category per month
budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model<IBudgetDocument>('Budget', budgetSchema);
