export declare class ApiError extends Error {
    readonly statusCode: number;
    readonly success: boolean;
    readonly errors: any[];
    readonly isOperational: boolean;
    constructor(statusCode: number, message?: string, errors?: any[], stack?: string);
}
