"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetController = void 0;
const budget_service_1 = require("../services/budget.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
class BudgetController {
    /**
     * Create budget route handler
     */
    static async create(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'Unauthorized: User context not found');
            }
            const { category, limit, month } = req.body;
            const budget = await budget_service_1.BudgetService.createBudget(Number(userId), category, limit, month);
            res.status(201).json(new ApiResponse_1.ApiResponse(budget, 'Budget set successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List budgets route handler
     */
    static async list(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'Unauthorized: User context not found');
            }
            const month = req.query.month;
            const budgets = await budget_service_1.BudgetService.getBudgets(Number(userId), month);
            res.status(200).json(new ApiResponse_1.ApiResponse(budgets, 'Budgets retrieved successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete budget route handler
     */
    static async delete(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'Unauthorized: User context not found');
            }
            const budgetId = Number(req.params.id);
            await budget_service_1.BudgetService.deleteBudget(Number(userId), budgetId);
            res.status(200).json(new ApiResponse_1.ApiResponse(null, 'Budget deleted successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Budget progress route handler
     */
    static async progress(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'Unauthorized: User context not found');
            }
            const month = req.query.month;
            const progress = await budget_service_1.BudgetService.getBudgetProgress(Number(userId), month);
            res.status(200).json(progress);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Spending breakdown chart route handler
     */
    static async chart(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'Unauthorized: User context not found');
            }
            const month = req.query.month;
            const chartData = await budget_service_1.BudgetService.getSpendingChart(Number(userId), month);
            res.status(200).json(chartData);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BudgetController = BudgetController;
//# sourceMappingURL=budget.controller.js.map