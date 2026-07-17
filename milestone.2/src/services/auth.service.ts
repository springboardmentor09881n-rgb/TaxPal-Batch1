import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';
import bcrypt from 'bcrypt';

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    country: string;
    income_bracket: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user and seed default categories
   */
  public static async register(
    name: string,
    email: string,
    password: string,
    country: string,
    income_bracket?: string
  ): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        country,
        income_bracket,
      },
    });

    // Seed default categories for the new user
    const defaultCategories = ['Transport', 'Food', 'Utilities', 'Income', 'Other'];
    await prisma.category.createMany({
      data: defaultCategories.map((catName) => ({
        userId: user.id,
        name: catName,
        isDefault: true,
      })),
    });

    const payload = {
      id: user.id,
      email: user.email,
      role: 'User',
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
        income_bracket: user.income_bracket,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user and verify credentials
   */
  public static async login(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: 'User',
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
        income_bracket: user.income_bracket,
      },
      accessToken,
      refreshToken,
    };
  }
}
