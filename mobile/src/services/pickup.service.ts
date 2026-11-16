import { apiClient } from './api';
import {
  PickupRequest,
  CreatePickupDto,
  PickupStatus,
} from '../types/collector';

interface ApiResponse<T> {
  message: string;
  data: T;
  count?: number;
}

export const pickupService = {
  /**
   * POST /pickup/request — User submits a new waste pickup request
   */
  async createPickup(data: CreatePickupDto): Promise<PickupRequest> {
    const res = await apiClient.post<ApiResponse<PickupRequest>>('/pickup/request', data);
    return res.data.data;
  },

  /**
   * GET /pickup/nearby — Collector queries open requests near GPS coords
   */
  async getNearbyPickups(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<PickupRequest[]> {
    const res = await apiClient.get<ApiResponse<PickupRequest[]>>('/pickup/nearby', {
      params: { latitude, longitude, radius },
    });
    return res.data.data;
  },

  /**
   * GET /pickup/my — User views their own pickup history & open requests
   */
  async getMyPickups(): Promise<PickupRequest[]> {
    const res = await apiClient.get<ApiResponse<PickupRequest[]>>('/pickup/my');
    return res.data.data;
  },

  /**
   * GET /pickup/:id — Fetch pickup request details including allocation info
   */
  async getPickupById(id: string): Promise<PickupRequest> {
    const res = await apiClient.get<ApiResponse<PickupRequest>>(`/pickup/${id}`);
    return res.data.data;
  },

  /**
   * POST /pickup/:id/accept — Collector claims a pending pickup request
   */
  async acceptPickup(id: string): Promise<{ message: string; data: any }> {
    const res = await apiClient.post<ApiResponse<any>>(`/pickup/${id}/accept`);
    return res.data;
  },

  /**
   * PUT /pickup/:id/status — Update pickup lifecycle state (IN_TRANSIT, COMPLETED, CANCELLED)
   */
  async updatePickupStatus(id: string, status: PickupStatus): Promise<PickupRequest> {
    const res = await apiClient.put<ApiResponse<PickupRequest>>(`/pickup/${id}/status`, {
      status,
    });
    return res.data.data;
  },
};
