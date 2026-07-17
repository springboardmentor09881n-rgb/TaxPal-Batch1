"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const db_1 = require("../config/db");
const ApiError_1 = require("../utils/ApiError");
class CategoryService {
    /**
     * Create a custom category
     */
    static async createCategory(userId, name) {
        const trimmedName = name.trim();
        // Check if category with same name already exists for the user (custom or default)
        const existing = await db_1.prisma.category.findFirst({
            where: {
                userId,
                name: {
                    equals: trimmedName,
                    mode: 'insensitive', // Case-insensitive check
                },
            },
        });
        if (existing) {
            throw new ApiError_1.ApiError(400, `Category '${trimmedName}' already exists`);
        }
        return db_1.prisma.category.create({
            data: {
                userId,
                name: trimmedName,
                isDefault: false,
            },
        });
    }
    /**
     * List all categories (custom + default) for the user
     */
    static async getCategories(userId) {
        return db_1.prisma.category.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' }, // Show default categories first
                { name: 'asc' }, // Then custom categories alphabetically
            ],
        });
    }
    /**
     * Update category name
     */
    static async updateCategory(userId, categoryId, name) {
        const trimmedName = name.trim();
        // Find category
        const category = await db_1.prisma.category.findFirst({
            where: { id: categoryId, userId },
        });
        if (!category) {
            throw new ApiError_1.ApiError(404, 'Category not found');
        }
        if (category.isDefault) {
            throw new ApiError_1.ApiError(400, 'Default categories cannot be renamed');
        }
        // Check duplicate name
        const existing = await db_1.prisma.category.findFirst({
            where: {
                userId,
                id: { not: categoryId },
                name: {
                    equals: trimmedName,
                    mode: 'insensitive',
                },
            },
        });
        if (existing) {
            throw new ApiError_1.ApiError(400, `Another category named '${trimmedName}' already exists`);
        }
        return db_1.prisma.category.update({
            where: { id: categoryId },
            data: { name: trimmedName },
        });
    }
    /**
     * Delete custom category
     */
    static async deleteCategory(userId, categoryId) {
        const category = await db_1.prisma.category.findFirst({
            where: { id: categoryId, userId },
        });
        if (!category) {
            throw new ApiError_1.ApiError(404, 'Category not found');
        }
        if (category.isDefault) {
            throw new ApiError_1.ApiError(400, 'Default categories cannot be deleted');
        }
        // Check if transactions exist using this category name
        const activeTransactions = await db_1.prisma.transaction.count({
            where: {
                userId,
                category: {
                    equals: category.name,
                    mode: 'insensitive',
                },
            },
        });
        if (activeTransactions > 0) {
            throw new ApiError_1.ApiError(400, `Cannot delete category '${category.name}' because it is in use by ${activeTransactions} transaction(s)`);
        }
        // Check if budgets exist using this category name
        const activeBudgets = await db_1.prisma.budget.count({
            where: {
                userId,
                category: {
                    equals: category.name,
                    mode: 'insensitive',
                },
            },
        });
        if (activeBudgets > 0) {
            throw new ApiError_1.ApiError(400, `Cannot delete category '${category.name}' because it is in use by ${activeBudgets} budget(s)`);
        }
        await db_1.prisma.category.delete({
            where: { id: categoryId },
        });
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map