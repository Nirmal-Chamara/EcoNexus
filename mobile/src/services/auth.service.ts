import { apiClient } from './api';
import type {
  ApiEnvelope,
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
    const response = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/register', input);
    return response.data.data;
  },

  /**
   * Login with email and password.
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/login', input);
    return response.data.data;
  },

  /**
   * Login or register using Google OAuth ID token.
   */
  async loginWithGoogle(idToken: string, role?: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/google', {
      idToken,
      role,
    });
    return response.data.data;
  },

  /**
   * Refresh the access token using the stored refresh token.
   */
  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<ApiEnvelope<RefreshTokenResponse>>(
      '/auth/refresh-token',
      {
        refreshToken,
      }
    );
    return response.data.data;
  },

  /**
   * Logout and revoke the current session's token family.
   */
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post<{ message: string }>('/auth/logout', { refreshToken });
  },

  async logoutAll(): Promise<void> {
    await apiClient.post<{ message: string }>('/auth/logout-all');
  },

  async requestPasswordReset(email: string): Promise<{ message: string; devResetToken?: string }> {
    const response = await apiClient.post<{ message: string; devResetToken?: string }>(
      '/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword });
  },
};
