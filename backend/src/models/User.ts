import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'offline' | 'away' | 'dnd';
  lastSeen: Date;
  contacts: mongoose.Types.ObjectId[];
  blockedUsers: mongoose.Types.ObjectId[];
  groups: mongoose.Types.ObjectId[];
  superGroups: mongoose.Types.ObjectId[];
  notificationsEnabled: boolean;
  darkMode: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    avatar: {
      type: String,
      default: function (this: IUser) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.username)}&background=random&color=fff&size=128`;
      },
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot exceed 200 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'dnd'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
    superGroups: [{ type: Schema.Types.ObjectId, ref: 'SuperGroup' }],
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Note: email and username already have indexes via `unique: true`

// Pre-save hook: hash password only if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method: compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method: toJSON — exclude passwordHash
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
