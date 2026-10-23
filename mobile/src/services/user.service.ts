import { apiClient } from './api';
import { AuthUser } from '../types/user';

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface UserProfileResponse {
  message: string;
  data: AuthUser & {
    created_at: string;
    updated_at: string;
  };
}

export const userService = {
  /**
   * GET /api/users/me — Fetch full profile of the authenticated user.
   */
  async getMe(): Promise<UserProfileResponse['data']> {
    const response = await apiClient.get<UserProfileResponse>('/users/me');
    return response.data.data;
  },

  /**
   * PATCH /api/users/me — Update name and/or phone.
   */
  async updateMe(input: UpdateProfileInput): Promise<UserProfileResponse['data']> {
    const response = await apiClient.patch<UserProfileResponse>('/users/me', input);
    return response.data.data;
  },

  /**
   * PATCH /api/users/me/password — Change the current user's password.
   * After success, the server increments token_version which forces re-login.
   */
  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    const response = await apiClient.patch<{ message: string }>('/users/me/password', input);
    return response.data;
  },

  /**
   * DELETE /api/users/me — Soft-deactivate the account (status → SUSPENDED).
   */
  async deactivateMe(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/users/me');
    return response.data;
  },
};
