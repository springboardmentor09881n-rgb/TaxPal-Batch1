"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/**
 * Generate a JWT Access Token
 */
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES,
    });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generate a JWT Refresh Token
 */
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.REFRESH_SECRET, {
        expiresIn: env_1.env.REFRESH_EXPIRES,
    });
};
exports.generateRefreshToken = generateRefreshToken;
//# sourceMappingURL=generateToken.js.map