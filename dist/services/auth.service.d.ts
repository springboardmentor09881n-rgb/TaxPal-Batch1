interface AuthResponse {
    user: {
        id: number;
        name: string;
        email: string;
        country: string;
        income_bracket: string | null;
    };
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    /**
     * Register a new user and seed default categories
     */
    static register(name: string, email: string, password: string, country: string, income_bracket?: string): Promise<AuthResponse>;
    /**
     * Login user and verify credentials
     */
    static login(email: string, password: string): Promise<AuthResponse>;
}
export {};
