// recycling.service.ts — API client for all /api/recycling/* endpoints

import { apiClient } from './api';
import type {
  RecyclingCenterProfile,
  UpdateProfileInput,
  VerificationStatusRecord,
  AcceptedCategory,
  IntakeRecord,
  CreateIntakeInput,
  DashboardSummary,
  IntakeStatus,
} from '../types/recyclingCenter';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export const recyclingService = {
  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(): Promise<DashboardSummary> {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/recycling/dashboard');
    return res.data.data;
  },

  // ── Profile ───────────────────────────────────────────────────────────────

  async getProfile(): Promise<RecyclingCenterProfile | null> {
    const res =
      await apiClient.get<ApiResponse<RecyclingCenterProfile | null>>('/recycling/profile');
    return res.data.data;
  },

  async updateProfile(data: UpdateProfileInput): Promise<RecyclingCenterProfile> {
    const res = await apiClient.put<ApiResponse<RecyclingCenterProfile>>(
      '/recycling/profile',
      data
    );
    return res.data.data;
  },

  // ── Verification Status ───────────────────────────────────────────────────

  async getVerificationStatus(): Promise<VerificationStatusRecord | null> {
    const res =
      await apiClient.get<ApiResponse<VerificationStatusRecord | null>>('/recycling/status');
    return res.data.data;
  },

  // ── Accepted Categories ───────────────────────────────────────────────────

  async getAcceptedCategories(): Promise<AcceptedCategory[]> {
    const res = await apiClient.get<ApiResponse<AcceptedCategory[]>>('/recycling/categories');
    return res.data.data;
  },

  async addCategory(categoryId: number): Promise<void> {
    await apiClient.post('/recycling/categories', { category_id: categoryId });
  },

  async removeCategory(categoryId: number): Promise<void> {
    await apiClient.delete(`/recycling/categories/${categoryId}`);
  },

  // ── Intake Records ────────────────────────────────────────────────────────

  async getIntakeRecords(statusFilter?: IntakeStatus): Promise<IntakeRecord[]> {
    const params = statusFilter ? { status: statusFilter } : {};
    const res = await apiClient.get<ApiResponse<IntakeRecord[]>>('/recycling/intake', { params });
    return res.data.data;
  },

  async getIntakeById(id: string): Promise<IntakeRecord> {
    const res = await apiClient.get<ApiResponse<IntakeRecord>>(`/recycling/intake/${id}`);
    return res.data.data;
  },

  async createIntake(data: CreateIntakeInput): Promise<IntakeRecord> {
    const res = await apiClient.post<ApiResponse<IntakeRecord>>('/recycling/intake', data);
    return res.data.data;
  },

  async updateIntakeStatus(id: string, status: IntakeStatus): Promise<IntakeRecord> {
    const res = await apiClient.put<ApiResponse<IntakeRecord>>(`/recycling/intake/${id}/status`, {
      status,
    });
    return res.data.data;
  },
};
