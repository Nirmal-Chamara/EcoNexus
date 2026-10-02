export type UserRole = 'USER' | 'COLLECTOR' | 'RECYCLING_CENTER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'REJECTED' | 'SUSPENDED';

export interface AuthUser {
  id: string;
  role: UserRole;
  status: AccountStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
