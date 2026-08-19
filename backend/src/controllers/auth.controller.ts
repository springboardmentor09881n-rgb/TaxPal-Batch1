import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { CategoryService } from '../services/category.service';
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

      const userAgent = req.headers['user-agent'] || '';
      let deviceName = 'Chrome Browser (Windows)';
      if (userAgent.includes('iPhone')) deviceName = 'iPhone - Safari';
      else if (userAgent.includes('Android')) deviceName = 'Android Mobile - Chrome';
      else if (userAgent.includes('Macintosh')) deviceName = 'macOS - Safari';
      else if (userAgent.includes('Firefox')) deviceName = 'Firefox Browser (Linux)';
      
      const ipAddress = (req.ip || req.socket.remoteAddress || '127.0.0.1').toString();

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
      }, { deviceName, ipAddress });

      // Initialize default categories for the new user
      await CategoryService.initializeDefaultCategories(result.user.id);

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
      
      const userAgent = req.headers['user-agent'] || '';
      let deviceName = 'Chrome Browser (Windows)';
      if (userAgent.includes('iPhone')) deviceName = 'iPhone - Safari';
      else if (userAgent.includes('Android')) deviceName = 'Android Mobile - Chrome';
      else if (userAgent.includes('Macintosh')) deviceName = 'macOS - Safari';
      else if (userAgent.includes('Firefox')) deviceName = 'Firefox Browser (Linux)';
      
      const ipAddress = (req.ip || req.socket.remoteAddress || '127.0.0.1').toString();

      const result = await AuthService.login(email, password, { deviceName, ipAddress });

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
  public static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  /**
   * Change user password handler
   */
  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      await AuthService.changePassword(userId, currentPassword, newPassword);
      res.status(200).json(new ApiResponse(null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch active device sessions handler
   */
  public static async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const sessions = await AuthService.getSessions(userId);
      res.status(200).json(new ApiResponse(sessions, 'Device sessions retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout other device sessions handler
   */
  public static async logoutOtherSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      // Get the current token from cookies or authorization header
      const currentToken = req.cookies.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : '');

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      await AuthService.logoutOtherSessions(userId, currentToken);
      res.status(200).json(new ApiResponse(null, 'Other device sessions logged out successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send password reset OTP handler
   */
  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        throw new ApiError(400, 'Email address is required');
      }

      const user = await import('../models/User').then(m => m.User.findOne({ email }));
      if (!user) {
        throw new ApiError(404, 'User with this email does not exist');
      }

      // Generate a 6-digit verification code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetOtp = otp;
      user.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      // Send OTP via MailerService
      const mailer = await import('../services/mailer.service').then(m => m.MailerService);
      const sent = await mailer.sendOtpMail(email, otp);

      if (!sent) {
        throw new ApiError(500, 'Failed to deliver OTP. Please try again.');
      }

      res.status(200).json(new ApiResponse(null, 'Reset OTP sent successfully to your email'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP and reset password handler
   */
  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        throw new ApiError(400, 'Email, OTP, and new password are required');
      }

      const user = await import('../models/User').then(m => m.User.findOne({ email }).select('+password'));
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (!user.resetOtp || user.resetOtp !== otp) {
         throw new ApiError(400, 'Invalid OTP code');
      }

      if (!user.resetOtpExpires || new Date() > user.resetOtpExpires) {
        throw new ApiError(400, 'OTP code has expired');
      }

      // Update password and clear OTP
      user.password = newPassword;
      user.resetOtp = undefined;
      user.resetOtpExpires = undefined;
      await user.save();

      res.status(200).json(new ApiResponse(null, 'Password has been reset successfully. You can now login.'));
    } catch (error) {
      next(error);
    }
  }
}
