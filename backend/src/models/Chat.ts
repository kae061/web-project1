import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  messages: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      validate: [
        (val: any[]) => val.length === 2,
        'Personal chat must have exactly 2 participants',
      ],
      required: true,
    },
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageTime: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Index to quickly find chats for a user
ChatSchema.index({ participants: 1 });

const Chat: Model<IChat> = mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
