"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBudgetSchema = exports.getBudgetsSchema = exports.createBudgetSchema = void 0;
const zod_1 = require("zod");
const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
exports.createBudgetSchema = zod_1.z.object({
    body: zod_1.z.object({
        category: zod_1.z.string({
            required_error: 'Category is required',
        }).trim().min(1, 'Category cannot be empty'),
        limit: zod_1.z.number({
            required_error: 'Limit is required',
            invalid_type_error: 'Limit must be a number',
        }).positive('Limit must be greater than 0'),
        month: zod_1.z.string({
            required_error: 'Month is required',
        }).regex(monthRegex, 'Month must be in YYYY-MM format'),
    }),
});
exports.getBudgetsSchema = zod_1.z.object({
    query: zod_1.z.object({
        month: zod_1.z.string({
            required_error: 'Month is required',
        }).regex(monthRegex, 'Month must be in YYYY-MM format'),
    }),
});
exports.deleteBudgetSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.coerce.number({
            invalid_type_error: 'Budget ID must be a number',
        }),
    }),
});
//# sourceMappingURL=budget.validator.js.map