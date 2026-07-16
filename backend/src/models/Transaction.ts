import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction {
  userId: mongoose.Types.ObjectId;
  type: 'Income' | 'Expense';
  description: string;
  category: string;
  amount: number;
  transactionDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionDocument extends ITransaction, Document {}

const transactionSchema = new Schema<ITransactionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['Income', 'Expense'],
        message: '{VALUE} is not a valid transaction type (must be Income or Expense)',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', transactionSchema);
