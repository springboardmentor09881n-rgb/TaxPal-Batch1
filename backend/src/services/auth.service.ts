import { User } from '../models/User';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';
import { UserRole } from '../utils/constants';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUserPayload } from '../types';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    username: string;
    phone?: string;
    country: string;
    state?: string;
    city?: string;
    language?: string;
    incomeBracket?: string;
    autoCategorizeEnabled?: boolean;
    categoryMappings?: Array<{ keyword: string; category: string }>;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  public static async register(
    userData: {
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
    },
    reqContext?: { deviceName?: string; ipAddress?: string }
  ): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const existingUsername = await User.findOne({ username: userData.username });
    if (existingUsername) {
      throw new ApiError(400, 'Username is already taken');
    }

    const user = new User({
      email: userData.email,
      password: userData.password,
      role: userData.role,
      fullName: userData.fullName,
      username: userData.username,
      phone: userData.phone,
      country: userData.country,
      state: userData.state,
      city: userData.city,
      language: userData.language,
      incomeBracket: userData.incomeBracket,
    });

    await user.save();

    const payload: IUserPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshTokens.push(refreshToken);

    // Log initial device session
    const deviceName = reqContext?.deviceName || 'Chrome Browser (Windows)';
    const ipAddress = reqContext?.ipAddress || '127.0.0.1';
    user.deviceSessions = [{
      id: new mongoose.Types.ObjectId().toString(),
      deviceName,
      ipAddress,
      loginTime: new Date(),
      token: accessToken
    }];

    await user.save();

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        username: user.username,
        phone: user.phone,
        country: user.country,
        state: user.state,
        city: user.city,
        language: user.language,
        incomeBracket: user.incomeBracket,
        autoCategorizeEnabled: user.autoCategorizeEnabled,
        categoryMappings: user.categoryMappings,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user and generate access/refresh tokens
   */
  public static async login(
    email: string, 
    password: string,
    reqContext?: { deviceName?: string; ipAddress?: string }
  ): Promise<AuthResponse> {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const payload: IUserPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Persist refresh token to enable rotation and single-logout capability
    user.refreshTokens.push(refreshToken);
    // Limit stored refresh tokens to 5 to avoid document bloat
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }

    // Log device session
    const deviceName = reqContext?.deviceName || 'Chrome Browser (Windows)';
    const ipAddress = reqContext?.ipAddress || '127.0.0.1';
    if (!user.deviceSessions) {
      user.deviceSessions = [];
    }
    user.deviceSessions.push({
      id: new mongoose.Types.ObjectId().toString(),
      deviceName,
      ipAddress,
      loginTime: new Date(),
      token: accessToken
    });
    if (user.deviceSessions.length > 5) {
      user.deviceSessions.shift();
    }

    await user.save();

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        username: user.username,
        phone: user.phone,
        country: user.country,
        state: user.state,
        city: user.city,
        language: user.language,
        incomeBracket: user.incomeBracket,
        autoCategorizeEnabled: user.autoCategorizeEnabled,
        categoryMappings: user.categoryMappings,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Fetch a user profile by ID
   */
  public static async getProfile(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  /**
   * Update user profile fields
   */
  public static async updateProfile(userId: string, data: any): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (data.email && data.email !== user.email) {
      const emailExists = await User.findOne({ email: data.email });
      if (emailExists) {
        throw new ApiError(400, 'Email is already taken by another user');
      }
      user.email = data.email;
    }

    if (data.username && data.username !== user.username) {
      const usernameExists = await User.findOne({ username: data.username });
      if (usernameExists) {
        throw new ApiError(400, 'Username is already taken');
      }
      user.username = data.username;
    }

    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.country !== undefined) user.country = data.country;
    if (data.state !== undefined) user.state = data.state;
    if (data.city !== undefined) user.city = data.city;
    if (data.language !== undefined) user.language = data.language;
    if (data.incomeBracket !== undefined) user.incomeBracket = data.incomeBracket;
    if (data.avatar !== undefined) user.avatar = data.avatar;
    if (data.currencyPreference !== undefined) user.currencyPreference = data.currencyPreference;
    if (data.twoFactorEnabled !== undefined) user.twoFactorEnabled = data.twoFactorEnabled;
    if (data.twoFactorMethod !== undefined) user.twoFactorMethod = data.twoFactorMethod;
    if (data.autoCategorizeEnabled !== undefined) user.autoCategorizeEnabled = data.autoCategorizeEnabled;
    if (data.categoryMappings !== undefined) user.categoryMappings = data.categoryMappings;

    await user.save();
    return user;
  }

  /**
   * Log out user by removing the active refresh token
   */
  public static async logout(userId: string, refreshToken: string): Promise<void> {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await user.save();
    }
  }

  /**
   * Refresh the access and refresh token pair
   */
  public static async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decodedPayload: IUserPayload;
    try {
      decodedPayload = jwt.verify(refreshToken, env.REFRESH_SECRET) as IUserPayload;
    } catch (error) {
      throw new ApiError(401, 'Refresh token is expired or invalid');
    }

    const user = await User.findById(decodedPayload.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      throw new ApiError(401, 'Refresh token has been revoked or is invalid');
    }

    // Generate new tokens
    const payload: IUserPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Change user password
   */
  public static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(400, 'Invalid current password');
    }

    user.password = newPassword;
    await user.save();
  }

  /**
   * Get active device sessions
   */
  public static async getSessions(userId: string): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user.deviceSessions || [];
  }

  /**
   * Log out from other active sessions
   */
  public static async logoutOtherSessions(userId: string, currentToken: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.deviceSessions) {
      user.deviceSessions = user.deviceSessions.filter((s: any) => s.token === currentToken);
    }

    if (user.refreshTokens.length > 1) {
      user.refreshTokens = [user.refreshTokens[user.refreshTokens.length - 1]];
    }

    await user.save();
  }
}
