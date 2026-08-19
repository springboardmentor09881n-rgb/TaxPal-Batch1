import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserRole } from '../utils/constants';

export interface IUser {
  email: string;
  password?: string;
  role: UserRole;
  fullName: string;
  username: string;
  phone?: string;
  country: string;
  state?: string;
  city?: string;
  language?: string;
  incomeBracket?: string;
  avatar?: string;
  currencyPreference?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: string;
  deviceSessions?: Array<{
    id: string;
    deviceName: string;
    ipAddress: string;
    loginTime: Date;
    token: string;
  }>;
  refreshTokens: string[];
  autoCategorizeEnabled: boolean;
  categoryMappings: Array<{ keyword: string; category: string }>;
  resetOtp?: string;
  resetOtpExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.EMPLOYEE,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
    },
    incomeBracket: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    currencyPreference: {
      type: String,
      default: 'INR',
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorMethod: {
      type: String,
      default: 'app',
    },
    deviceSessions: {
      type: [
        {
          id: { type: String, required: true },
          deviceName: { type: String, required: true },
          ipAddress: { type: String, required: true },
          loginTime: { type: Date, default: Date.now },
          token: { type: String, required: true }
        }
      ],
      default: []
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    autoCategorizeEnabled: {
      type: Boolean,
      default: true,
    },
    categoryMappings: {
      type: [
        {
          keyword: { type: String, required: true },
          category: { type: String, required: true },
        }
      ],
      default: [
        { keyword: 'adobe', category: 'Software/SaaS' },
        { keyword: 'figma', category: 'Software/SaaS' },
        { keyword: 'aws', category: 'Software/SaaS' },
        { keyword: 'github', category: 'Software/SaaS' },
        { keyword: 'slack', category: 'Software/SaaS' },
        { keyword: 'uber', category: 'Travel/Meals' },
        { keyword: 'taxi', category: 'Travel/Meals' },
        { keyword: 'hotel', category: 'Travel/Meals' },
        { keyword: 'food', category: 'Travel/Meals' },
        { keyword: 'meals', category: 'Travel/Meals' },
        { keyword: 'ads', category: 'Marketing/Ads' },
        { keyword: 'facebook', category: 'Marketing/Ads' },
        { keyword: 'google', category: 'Marketing/Ads' },
        { keyword: 'marketing', category: 'Marketing/Ads' },
        { keyword: 'macbook', category: 'Hardware/Gadgets' },
        { keyword: 'laptop', category: 'Hardware/Gadgets' },
        { keyword: 'monitor', category: 'Hardware/Gadgets' },
        { keyword: 'phone', category: 'Hardware/Gadgets' },
        { keyword: 'paper', category: 'Office Supplies' },
        { keyword: 'notebook', category: 'Office Supplies' },
        { keyword: 'pen', category: 'Office Supplies' },
        { keyword: 'office', category: 'Office Supplies' }
      ]
    },
    resetOtp: {
      type: String
    },
    resetOtpExpires: {
      type: Date
    }
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare input password with database hashed password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument>('User', userSchema);
