"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const db_1 = require("../config/db");
const ApiError_1 = require("../utils/ApiError");
const generateToken_1 = require("../utils/generateToken");
const bcrypt_1 = __importDefault(require("bcrypt"));
class AuthService {
    /**
     * Register a new user and seed default categories
     */
    static async register(name, email, password, country, income_bracket) {
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            throw new ApiError_1.ApiError(400, 'User with this email already exists');
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await db_1.prisma.user.create({
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
        await db_1.prisma.category.createMany({
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
        const accessToken = (0, generateToken_1.generateAccessToken)(payload);
        const refreshToken = (0, generateToken_1.generateRefreshToken)(payload);
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
    static async login(email, password) {
        const user = await db_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            throw new ApiError_1.ApiError(401, 'Invalid email or password');
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new ApiError_1.ApiError(401, 'Invalid email or password');
        }
        const payload = {
            id: user.id,
            email: user.email,
            role: 'User',
        };
        const accessToken = (0, generateToken_1.generateAccessToken)(payload);
        const refreshToken = (0, generateToken_1.generateRefreshToken)(payload);
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
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map