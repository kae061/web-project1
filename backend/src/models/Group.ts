import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  avatar?: string;
  creator: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    avatar: { type: String },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageTime: { type: Date },
  },
  { timestamps: true }
);

GroupSchema.index({ members: 1 });
GroupSchema.index({ lastMessageTime: -1 });

const Group: Model<IGroup> = mongoose.model<IGroup>('Group', GroupSchema);

export default Group;
