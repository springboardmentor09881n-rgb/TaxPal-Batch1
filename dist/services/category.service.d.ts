export declare class CategoryService {
    /**
     * Create a custom category
     */
    static createCategory(userId: number, name: string): Promise<any>;
    /**
     * List all categories (custom + default) for the user
     */
    static getCategories(userId: number): Promise<any>;
    /**
     * Update category name
     */
    static updateCategory(userId: number, categoryId: number, name: string): Promise<any>;
    /**
     * Delete custom category
     */
    static deleteCategory(userId: number, categoryId: number): Promise<void>;
}
