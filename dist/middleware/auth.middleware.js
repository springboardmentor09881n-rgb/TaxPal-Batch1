"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
const db_1 = require("../config/db");
/**
 * Middleware to authenticate requests via JWT access token
 */
const authenticate = async (req, res, next) => {
    try {
        let token = '';
        // Check Authorization header or cookies
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            throw new ApiError_1.ApiError(401, 'Authentication token missing');
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            // Verify the user still exists in the database
            const userExists = await db_1.prisma.user.findUnique({
                where: { id: Number(decoded.id) },
                select: { id: true, email: true },
            });
            if (!userExists) {
                throw new ApiError_1.ApiError(401, 'User account no longer exists');
            }
            req.user = {
                id: Number(userExists.id),
                email: userExists.email,
                role: decoded.role || 'User',
            };
            next();
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new ApiError_1.ApiError(401, 'Access token has expired');
            }
            throw new ApiError_1.ApiError(401, 'Unauthorized: Access token is invalid');
        }
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map