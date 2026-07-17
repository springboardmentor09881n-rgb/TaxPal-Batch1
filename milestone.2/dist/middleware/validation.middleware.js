"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
/**
 * Express middleware to validate incoming request data using Zod schema
 */
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            // Assign back parsed data (Zod can strip unknown or sanitize inputs)
            req.body = parsed.body;
            req.query = parsed.query;
            req.params = parsed.params;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.length > 1 ? err.path.slice(1).join('.') : err.path[0],
                    message: err.message,
                }));
                next(new ApiError_1.ApiError(400, 'Validation failed', errors));
                return;
            }
            next(error);
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.middleware.js.map