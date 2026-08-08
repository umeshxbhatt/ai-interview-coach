import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  profilePhoto?: string;
  targetCompany?: string;
  experienceLevel?: 'Junior' | 'Mid' | 'Senior';
  preferredStack?: string;
  resumeUrl?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Prevents password from being returned in queries by default
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    targetCompany: {
      type: String,
      default: '',
    },
    experienceLevel: {
      type: String,
      enum: {
        values: ['Junior', 'Mid', 'Senior'],
        message: 'Experience level must be Junior, Mid, or Senior',
      },
      default: 'Junior',
    },
    preferredStack: {
      type: String,
      default: '',
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', userSchema);
