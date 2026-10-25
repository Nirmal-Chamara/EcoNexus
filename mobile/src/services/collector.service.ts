import { apiClient } from './api';
import {
  CollectorProfile,
  UpdateCollectorProfileDto,
  UpdateLocationDto,
  PickupRequest,
} from '../types/collector';

interface ApiResponse<T> {
  message: string;
  data: T;
  count?: number;
}

export const collectorService = {
  /**
   * GET /collector/profile — Fetch current collector profile
   */
  async getProfile(): Promise<CollectorProfile> {
    const res = await apiClient.get<ApiResponse<CollectorProfile>>('/collector/profile');
    return res.data.data;
  },

  /**
   * PUT /collector/profile — Update vehicle type, capacity, and availability
   */
  async updateProfile(data: UpdateCollectorProfileDto): Promise<CollectorProfile> {
    const res = await apiClient.put<ApiResponse<CollectorProfile>>('/collector/profile', data);
    return res.data.data;
  },

  /**
   * PUT /collector/location — Send current live GPS coordinates to backend
   */
  async updateLocation(coords: UpdateLocationDto): Promise<CollectorProfile> {
    const res = await apiClient.put<ApiResponse<CollectorProfile>>('/collector/location', coords);
    return res.data.data;
  },

  /**
   * GET /collector/pickups — Fetch pickups assigned to this collector
   */
  async getAssignedPickups(): Promise<PickupRequest[]> {
    const res = await apiClient.get<ApiResponse<PickupRequest[]>>('/collector/pickups');
    return res.data.data;
  },
};
