import { apiClient } from './api';
import {
  AuthResponse,
  LoginInput,
  RegisterInput,
  RefreshTokenResponse,
} from '../types/user';

export const authService = {
  /**
   * Register a new user account.
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', input);
    return response.data;
  },

  /**
   * Login with email and password.
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', input);
    return response.data;
  },

  /**
   * Refresh the access token using the stored refresh token.
   */
  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Logout and revoke the current session's token family.
   */
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },
};
