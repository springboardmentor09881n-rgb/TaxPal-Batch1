import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class AuthController {
  /**
   * Register user handler
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        email,
        password,
        role,
        fullName,
        username,
        phone,
        country,
        state,
        city,
        language,
        incomeBracket,
      } = req.body;

      const result = await AuthService.register({
        email,
        password,
        role,
        fullName,
        username,
        phone,
        country,
        state,
        city,
        language,
        incomeBracket,
      });

      // Set cookie options
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json(new ApiResponse(result, 'User registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user handler
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json(new ApiResponse(result, 'User logged in successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch current user profile handler
   */
  public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const user = await AuthService.getProfile(userId);
      res.status(200).json(new ApiResponse(user, 'User profile retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile handler
   */
  public static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const user = await AuthService.updateProfile(userId, req.body);
      res.status(200).json(new ApiResponse(user, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user handler
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context not available');
      }

      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token required to logout');
      }

      await AuthService.logout(userId, refreshToken);

      // Clear authentication cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(200).json(new ApiResponse(null, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Token refresh handler
   */
  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token required');
      }

      const result = await AuthService.refreshTokens(refreshToken);
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json(new ApiResponse(result, 'Tokens refreshed successfully'));
    } catch (error) {
      next(error);
    }
  }
}
