export type Role = 'USER' | 'COLLECTOR' | 'RECYCLING_CENTER' | 'ADMIN';
export type UserRole = Role;
export type AccountStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'REJECTED' | 'SUSPENDED';

/** Exact user summary returned by login, registration and admin status updates. */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  /** Optional until the backend includes the latest verification review note in /users/me. */
  rejectionReason?: string | null;
}

/** GET/PATCH /users/me JSON payload. Dates are serialized ISO strings. */
export interface User extends UserSummary {
  phone: string | null;
  created_at: string;
  updated_at: string;
}

/** Local session state can contain either an auth summary or a fetched profile. */
export type AuthUser = UserSummary & Partial<Pick<User, 'phone' | 'created_at' | 'updated_at'>>;

export type AdminUser = Omit<User, 'updated_at'>;

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
  user: UserSummary;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export type { ApiEnvelope } from './api';
