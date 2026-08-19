import { Schema, model, Document } from 'mongoose';

export interface IScheduledReport extends Document {
  userId: Schema.Types.ObjectId;
  email: string;
  reportType: string;
  format: 'PDF' | 'CSV';
  status: 'active' | 'inactive';
  lastSent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const scheduledReportSchema = new Schema<IScheduledReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    reportType: { type: String, required: true },
    format: { type: String, enum: ['PDF', 'CSV'], default: 'PDF' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastSent: { type: Date }
  },
  { timestamps: true }
);

export const ScheduledReport = model<IScheduledReport>('ScheduledReport', scheduledReportSchema);
