import { UserRole } from '../utils/constants';

export interface IUserPayload {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUserPayload;
    }
  }
}
