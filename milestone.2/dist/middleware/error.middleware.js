"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const ApiError_1 = require("../utils/ApiError");
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || [];
    // Prisma / database errors processing
    if (!(err instanceof ApiError_1.ApiError)) {
        if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
            if (err.code === 'P2002') {
                statusCode = 400;
                const fields = err.meta?.target || [];
                message = `Unique constraint failed on field(s): ${fields.join(', ')}`;
                errors = fields.map((f) => ({
                    field: f,
                    message: `Value already exists for ${f}`,
                }));
            }
            else if (err.code === 'P2025') {
                statusCode = 404;
                message = err.meta?.cause || 'Record not found';
            }
        }
    }
    // Log error stack trace if internal 500 server error
    if (statusCode === 500) {
        logger_1.logger.error(`[500 Error] ${req.method} ${req.path} - Details:`, err);
        if (env_1.env.NODE_ENV === 'production') {
            message = 'Internal Server Error';
        }
    }
    else {
        logger_1.logger.warn(`[${statusCode} Error] ${req.method} ${req.path} - ${message}`);
    }
    res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map