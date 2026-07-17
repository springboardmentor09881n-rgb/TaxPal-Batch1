export interface TokenPayload {
    id: number;
    email: string;
    role: string;
}
/**
 * Generate a JWT Access Token
 */
export declare const generateAccessToken: (payload: TokenPayload) => string;
/**
 * Generate a JWT Refresh Token
 */
export declare const generateRefreshToken: (payload: TokenPayload) => string;
