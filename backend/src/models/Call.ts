import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICall extends Document {
  callerId: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  type: 'voice' | 'video';
  status: 'initiated' | 'ringing' | 'ongoing' | 'ended' | 'missed' | 'rejected';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  participants: {
    userId: mongoose.Types.ObjectId;
    joinedAt: Date;
    leftAt?: Date;
  }[];
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CallSchema = new Schema<ICall>(
  {
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    type: { type: String, enum: ['voice', 'video'], required: true },
    status: { 
      type: String, 
      enum: ['initiated', 'ringing', 'ongoing', 'ended', 'missed', 'rejected'],
      default: 'initiated'
    },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number, default: 0 },
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
      },
    ],
    recordingUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
CallSchema.index({ callerId: 1, createdAt: -1 });
CallSchema.index({ recipientId: 1, createdAt: -1 });

const Call: Model<ICall> = mongoose.model<ICall>('Call', CallSchema);

export default Call;
