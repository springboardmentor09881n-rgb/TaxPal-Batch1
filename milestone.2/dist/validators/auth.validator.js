"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Full name is required' }).trim().min(1, 'Full name cannot be empty'),
        email: zod_1.z.string({ required_error: 'Email is required' }).email('Invalid email address'),
        password: zod_1.z
            .string({ required_error: 'Password is required' })
            .min(6, 'Password must be at least 6 characters'),
        country: zod_1.z.string({ required_error: 'Country is required' }).trim().min(1, 'Country cannot be empty'),
        income_bracket: zod_1.z.string().optional(),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }).email('Invalid email address'),
        password: zod_1.z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
    }),
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string({ required_error: 'Refresh token is required' }).min(1),
    }),
});
//# sourceMappingURL=auth.validator.js.map