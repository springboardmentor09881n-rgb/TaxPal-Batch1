import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryDocument extends ICategory, Document {}

const categorySchema = new Schema<ICategoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Category type is required'],
      enum: {
        values: ['expense', 'income'],
        message: '{VALUE} is not a valid category type (must be expense or income)',
      },
    },
    color: {
      type: String,
      required: [true, 'Category color is required'],
      default: '#6366f1',
    },
    icon: {
      type: String,
      required: [true, 'Category icon is required'],
      default: 'tag',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for userId, name, and type to ensure uniqueness per user per type
categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export const Category = mongoose.model<ICategoryDocument>('Category', categorySchema);
