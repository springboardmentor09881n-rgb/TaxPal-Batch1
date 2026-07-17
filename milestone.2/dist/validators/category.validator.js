"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestCategorySchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({
            required_error: 'Category name is required',
        }).trim().min(1, 'Category name cannot be empty'),
    }),
});
exports.updateCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({
            required_error: 'Category name is required',
        }).trim().min(1, 'Category name cannot be empty'),
    }),
    params: zod_1.z.object({
        id: zod_1.z.coerce.number({
            invalid_type_error: 'Category ID must be a number',
        }),
    }),
});
exports.suggestCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        description: zod_1.z.string({
            required_error: 'Transaction description is required',
        }).trim().min(1, 'Transaction description cannot be empty'),
    }),
});
//# sourceMappingURL=category.validator.js.map