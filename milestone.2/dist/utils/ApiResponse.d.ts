export declare class ApiResponse<T = any> {
    readonly success: boolean;
    readonly message: string;
    readonly data: T;
    constructor(data: T, message?: string);
}
