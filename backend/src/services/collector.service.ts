import { CollectorModel, UpdateCollectorProfileDto } from '../models/collector.model';
import { AppError } from '../utils/AppError';
import { emitCollectorLocation } from '../sockets/pickup.socket';

export class CollectorService {
  /**
   * Update collector's GPS coordinates
   */
  static async updateLocation(collectorId: string, lat: number, lng: number) {
    const profile = await CollectorModel.updateLocation(collectorId, lat, lng);

    // Emit live location update to customers tracking this collector
    try {
      emitCollectorLocation(collectorId, { latitude: lat, longitude: lng });
    } catch {
      // Non-blocking
    }

    return profile;
  }

  /**
   * Update collector profile details (vehicle, capacity, availability)
   */
  static async updateProfile(collectorId: string, data: UpdateCollectorProfileDto) {
    return await CollectorModel.updateProfile(collectorId, data);
  }

  /**
   * Fetch collector profile information
   */
  static async getProfile(collectorId: string) {
    const profile = await CollectorModel.getProfile(collectorId);
    if (!profile) {
      // Return a default profile skeleton if not yet populated
      return {
        user_id: collectorId,
        vehicle_type: null,
        vehicle_capacity: null,
        is_available: false,
        rating: 0,
        completed_pickups: 0,
      };
    }
    return profile;
  }

  /**
   * Get all pickups assigned to this collector
   */
  static async getAssignedPickups(collectorId: string) {
    return await CollectorModel.getAssignedPickups(collectorId);
  }
}
