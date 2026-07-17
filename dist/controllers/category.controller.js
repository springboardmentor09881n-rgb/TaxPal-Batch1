"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("../services/category.service");
const categorySuggester_1 = require("../utils/categorySuggester");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
class CategoryController {
    /**
     * Create category route handler
     */
    static async create(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'Unauthorized: User context not found');
            }
            const { name } = req.body;
            const category = await category_service_1.CategoryService.createCategory(Number(userId), name);
            res.status(201).json(new ApiResponse_1.ApiResponse(category, 'Category created successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List categories route handler
     */
    static async list(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'Unauthorized: User context not found');
            }
            const categories = await category_service_1.CategoryService.getCategories(Number(userId));
            res.status(200).json(new ApiResponse_1.ApiResponse(categories, 'Categories retrieved successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update category route handler
     */
    static async update(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'Unauthorized: User context not found');
            }
            const categoryId = Number(req.params.id);
            const { name } = req.body;
            const category = await category_service_1.CategoryService.updateCategory(Number(userId), categoryId, name);
            res.status(200).json(new ApiResponse_1.ApiResponse(category, 'Category updated successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete category route handler
     */
    static async delete(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'Unauthorized: User context not found');
            }
            const categoryId = Number(req.params.id);
            await category_service_1.CategoryService.deleteCategory(Number(userId), categoryId);
            res.status(200).json(new ApiResponse_1.ApiResponse(null, 'Category deleted successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Suggest category route handler
     */
    static async suggest(req, res, next) {
        try {
            const { description } = req.body;
            const suggestedCategory = (0, categorySuggester_1.suggestCategory)(description);
            res.status(200).json({
                suggestedCategory,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CategoryController = CategoryController;
//# sourceMappingURL=category.controller.js.map