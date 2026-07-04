import { User } from '../models/User';
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
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  public static async register(email: string, password: string, role: UserRole): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const user = new User({
      email,
      password,
      role,
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
    await user.save();

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user and generate access/refresh tokens
   */
  public static async login(email: string, password: string): Promise<AuthResponse> {
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
    await user.save();

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
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
}
