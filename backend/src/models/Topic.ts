import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITopic extends Document {
  superGroupId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  icon?: string;
  createdBy: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    superGroupId: { type: Schema.Types.ObjectId, ref: 'SuperGroup', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, default: '💬' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageTime: { type: Date },
  },
  { timestamps: true }
);

TopicSchema.index({ superGroupId: 1 });

const Topic: Model<ITopic> = mongoose.model<ITopic>('Topic', TopicSchema);

export default Topic;
