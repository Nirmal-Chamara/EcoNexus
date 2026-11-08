/**
 * admin.service.ts
 *
 * API client helpers for all ADMIN-gated endpoints:
 *   GET  /api/admin/users
 *   GET  /api/admin/users/:id          (derived — re-uses getUsers with id filter hack,
 *                                       or we call a dedicated lookup via /users/me equivalent)
 *   PATCH /api/admin/users/:id/status
 *   GET  /api/admin/verifications
 *   PATCH /api/admin/verifications/:id/process
 */

import { apiClient } from './api';
import type { UserRole, AccountStatus, AdminUser, UserSummary } from '../types/user';
import type { PaginatedMeta } from '../types/api';
import type { VerificationRequest, VerificationStatus } from '../types/verification';
export type { AdminUser } from '../types/user';
export type { PaginatedMeta } from '../types/api';
export type { VerificationRequest, VerificationStatus } from '../types/verification';

// ─── User Types ────────────────────────────────────────────────────────────────

export interface GetUsersParams {
  search?: string;
  role?: UserRole | '';
  status?: AccountStatus | '';
  page?: number;
  limit?: number;
}

export interface GetUsersResponse {
  message: string;
  data: AdminUser[];
  meta: PaginatedMeta;
}

export interface AdminAuditLog {
  id: number;
  action: string;
  target_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  actor_id: string | null;
  actor_name: string;
}

export interface AdminUserDetail extends AdminUser {
  updated_at: string;
  activity: AdminAuditLog[];
}

// ─── Verification Types ────────────────────────────────────────────────────────

export interface GetVerificationsParams {
  status?: VerificationStatus | '';
  page?: number;
  limit?: number;
}

export interface GetVerificationsResponse {
  message: string;
  data: VerificationRequest[];
  meta: PaginatedMeta;
}

export interface ProcessVerificationInput {
  status: 'APPROVED' | 'REJECTED';
  review_note?: string;
}

// ─── Dashboard Metrics Types ──────────────────────────────────────────────────

export interface AdminDashboardNotice {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'alert';
  active: boolean;
}

export interface AdminDashboardMetricsData {
  totalDivertedTons: number;
  divertedGrowthMoM: string;
  haulerCount: number;
  onDutyHaulers: number;
  centerCount: number;
  centersNearingCapacity: number;
  ecoPointsIssued: string;
  ecoPointsRedeemedValue: string;
}

export interface PriorityVerificationItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  requestedRole: UserRole;
  organizationName: string;
  vehicleInfo?: string;
  status: VerificationStatus;
  createdAt: string;
  documentUrl?: string;
  documents?: string[];
}

export interface MaterialVolumeFlowItem {
  category: string;
  percentage: number;
  weightTons: number;
  color: string;
}

export interface SectorClusterItem {
  name: string;
  status: 'Normal' | 'Heavy' | 'Bottleneck';
  efficiency: number;
  pickupsRate: string;
  color: string;
}

export interface SystemVitalityMetrics {
  activeFleetTotal: number;
  complianceRate: number;
  avgSlaHours: number;
}

export interface AdminDashboardData {
  notice: AdminDashboardNotice;
  metrics: AdminDashboardMetricsData;
  pendingVerificationsCount: number;
  priorityVerifications: PriorityVerificationItem[];
  materialVolumeFlow: MaterialVolumeFlowItem[];
  sectorClusters: SectorClusterItem[];
  systemVitality: SystemVitalityMetrics;
}

export interface AdminDashboardResponse {
  message: string;
  data: AdminDashboardData;
}

// ─── Admin Service ──────────────────────────────────────────────────────────────

export const adminService = {
  /**
   * GET /api/admin/dashboard
   * Consolidated statistics, pending verifications, material volume flow, and sector clusters.
   */
  async getDashboardMetrics(): Promise<AdminDashboardResponse> {
    const response = await apiClient.get<AdminDashboardResponse>('/admin/dashboard');
    return response.data;
  },

  /**
   * GET /api/admin/users
   * Fetch paginated, filterable user list.
   */
  async getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
    const response = await apiClient.get<GetUsersResponse>('/admin/users', {
      params: {
        ...(params.search ? { search: params.search } : {}),
        ...(params.role ? { role: params.role } : {}),
        ...(params.status ? { status: params.status } : {}),
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    });
    return response.data;
  },

  /**
   * GET /api/admin/users/:id
   * Fetch a full profile and recent audit activity for one user.
   */
  async getUser(userId: string): Promise<{ message: string; data: AdminUserDetail }> {
    const response = await apiClient.get<{ message: string; data: AdminUserDetail }>(
      `/admin/users/${userId}`
    );
    return response.data;
  },

  /**
   * PATCH /api/admin/users/:id/status
   * Update a user's account_status and auto-invalidate their sessions.
   */
  async updateUserStatus(
    userId: string,
    status: AccountStatus,
    reason?: string
  ): Promise<{ message: string; data: UserSummary }> {
    const response = await apiClient.patch<{ message: string; data: UserSummary }>(
      `/admin/users/${userId}/status`,
      { status, ...(reason ? { reason } : {}) }
    );
    return response.data;
  },

  /**
   * GET /api/admin/verifications
   * Fetch paginated verification queue.
   */
  async getVerifications(params: GetVerificationsParams = {}): Promise<GetVerificationsResponse> {
    const response = await apiClient.get<GetVerificationsResponse>('/admin/verifications', {
      params: {
        ...(params.status ? { status: params.status } : {}),
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    });
    return response.data;
  },

  /**
   * PATCH /api/admin/verifications/:id/process
   * Approve or reject a pending verification request.
   */
  async processVerification(
    verificationId: string,
    input: ProcessVerificationInput
  ): Promise<{ message: string }> {
    const response = await apiClient.patch<{ message: string }>(
      `/admin/verifications/${verificationId}/process`,
      input
    );
    return response.data;
  },
};
