import mongoose, { Document, Schema } from 'mongoose';

export interface IAnomaly extends Document {
  userId: mongoose.Types.ObjectId;
  transactionId?: mongoose.Types.ObjectId;
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  explanation: string;
  detectedAt: Date;
}

const anomalySchema = new Schema<IAnomaly>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: false },
    type: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    explanation: { type: String, required: true },
    detectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Anomaly = mongoose.model<IAnomaly>('Anomaly', anomalySchema);
