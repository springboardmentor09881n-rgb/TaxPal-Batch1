import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert {
  userId: mongoose.Types.ObjectId;
  type: string;
  message: string;
  alertDate: Date;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAlertDocument extends IAlert, Document {}

const alertSchema = new Schema<IAlertDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true,
    },
    alertDate: {
      type: Date,
      required: [true, 'Alert date is required'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index to efficiently query alerts by user and alert date
alertSchema.index({ userId: 1, alertDate: -1 });

export const Alert = mongoose.model<IAlertDocument>('Alert', alertSchema);
