export interface IUserPayload {
    id: number;
    email: string;
    role: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: IUserPayload;
        }
    }
}
