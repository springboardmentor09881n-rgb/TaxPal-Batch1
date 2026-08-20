import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface IChat {
  user: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatDocument extends IChat, Document {}

const chatSchema = new Schema<IChatDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Chat title is required'],
      trim: true,
    },
    messages: [
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
    ],
  },
  {
    timestamps: true,
  }
);

// Index to efficiently query chats by user and update date
chatSchema.index({ user: 1, updatedAt: -1 });

export const Chat = mongoose.model<IChatDocument>('Chat', chatSchema);
