"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const ApiResponse_1 = require("../utils/ApiResponse");
class AuthController {
    /**
     * Register user handler
     */
    static async register(req, res, next) {
        try {
            const { name, email, password, country, income_bracket } = req.body;
            const result = await auth_service_1.AuthService.register(name, email, password, country, income_bracket);
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
            res.status(201).json(new ApiResponse_1.ApiResponse(result, 'User registered successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Login user handler
     */
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.AuthService.login(email, password);
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
            res.status(200).json(new ApiResponse_1.ApiResponse(result, 'User logged in successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Logout user handler
     */
    static async logout(req, res, next) {
        try {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.status(200).json(new ApiResponse_1.ApiResponse(null, 'Logged out successfully'));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map