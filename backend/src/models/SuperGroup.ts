import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISuperGroup extends Document {
  name: string;
  description?: string;
  avatar?: string;
  creator: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  topics: mongoose.Types.ObjectId[];
  isPublic: boolean;
  username?: string; // unique handle like @MyChannel
  createdAt: Date;
  updatedAt: Date;
}

const SuperGroupSchema = new Schema<ISuperGroup>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    avatar: { type: String },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    topics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    isPublic: { type: Boolean, default: true },
    username: { type: String, unique: true, sparse: true, trim: true },
  },
  { timestamps: true }
);

SuperGroupSchema.index({ members: 1 });
SuperGroupSchema.index({ username: 1 });

const SuperGroup: Model<ISuperGroup> = mongoose.model<ISuperGroup>('SuperGroup', SuperGroupSchema);

export default SuperGroup;
