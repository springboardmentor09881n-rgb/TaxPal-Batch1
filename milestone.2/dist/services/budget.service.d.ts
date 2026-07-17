export declare class BudgetService {
    /**
     * Create or update monthly budget
     */
    static createBudget(userId: number, category: string, limit: number, month: string): Promise<any>;
    /**
     * List budgets for a month
     */
    static getBudgets(userId: number, month: string): Promise<any>;
    /**
     * Delete a budget
     */
    static deleteBudget(userId: number, budgetId: number): Promise<void>;
    /**
     * Retrieve budget progress for a month
     */
    static getBudgetProgress(userId: number, month: string): Promise<any>;
    /**
     * Retrieve spending breakdown chart data
     */
    static getSpendingChart(userId: number, month: string): Promise<{
        labels: string[];
        values: number[];
    }>;
}
