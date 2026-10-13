export type UserRole = 'USER' | 'COLLECTOR' | 'RECYCLING_CENTER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'REJECTED' | 'SUSPENDED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  organizationName?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
