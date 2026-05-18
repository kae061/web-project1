import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  chatId?: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  superGroupId?: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId;
  content: string;
  mediaAttachments: {
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
  }[];
  isEdited: boolean;
  editedAt?: Date;
  reactions: {
    emoji: string;
    users: mongoose.Types.ObjectId[];
  }[];
  replyTo?: mongoose.Types.ObjectId;
  deletedFor: mongoose.Types.ObjectId[];
  isDeleted: boolean;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat' },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    superGroupId: { type: Schema.Types.ObjectId, ref: 'SuperGroup' },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    content: { type: String, default: '' },
    mediaAttachments: [
      {
        type: {
          type: String,
          enum: ['image', 'video', 'audio', 'file'],
          required: true,
        },
        url: { type: String, required: true },
        fileName: { type: String },
        fileSize: { type: Number },
        duration: { type: Number },
      },
    ],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

// Indexes
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ groupId: 1, createdAt: -1 });

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
