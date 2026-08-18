import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface IChatDocument extends Document {
  user: mongoose.Types.ObjectId;
  title?: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'model'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSchema = new Schema<IChatDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
    },
    messages: [chatMessageSchema],
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.model<IChatDocument>('Chat', chatSchema);
