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
      const { name, email, password, country, income_bracket } = req.body;
      const result = await AuthService.register(name, email, password, country, income_bracket);

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
   * Logout user handler
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(200).json(new ApiResponse(null, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }
}
