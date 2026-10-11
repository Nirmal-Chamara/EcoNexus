import { PickupRequestModel, CreatePickupDto } from '../models/pickupRequest.model';
import { CollectorModel } from '../models/collector.model';
import { AppError } from '../utils/AppError';
import { emitToNearbyCollectors, emitPickupStatusUpdate } from '../sockets/pickup.socket';

// Allowed state transitions for pickup lifecycle
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export class PickupService {
  /**
   * User creates a pickup request
   */
  static async createPickup(dto: CreatePickupDto) {
    const pickup = await PickupRequestModel.createRequest(dto);

    // Notify online collectors in real-time
    try {
      emitToNearbyCollectors('new_pickup_request', pickup);
    } catch {
      // Socket emission is non-blocking
    }

    return pickup;
  }

  /**
   * Collector finds nearby open pickup requests
   */
  static async getNearbyPickups(lat: number, lng: number, radiusMeters: number = 5000) {
    return await PickupRequestModel.findNearby(lat, lng, radiusMeters);
  }

  /**
   * Fetch specific pickup request by ID
   */
  static async getPickupById(id: string) {
    const pickup = await PickupRequestModel.findById(id);
    if (!pickup) {
      throw new AppError(404, 'Pickup request not found', 'NOT_FOUND');
    }
    const allocation = await PickupRequestModel.getAllocation(id);
    return {
      ...pickup,
      allocation: allocation || null,
    };
  }

  /**
   * Fetch user's own pickup requests
   */
  static async getUserPickups(userId: string) {
    return await PickupRequestModel.findByUserId(userId);
  }

  /**
   * Collector claims / accepts a pickup request
   */
  static async acceptPickup(pickupId: string, collectorId: string) {
    const pickup = await PickupRequestModel.findById(pickupId);
    if (!pickup) {
      throw new AppError(404, 'Pickup request not found', 'NOT_FOUND');
    }

    if (pickup.status !== 'PENDING') {
      throw new AppError(400, `Cannot accept pickup with status ${pickup.status}`, 'INVALID_STATE');
    }

    // Assign collector atomically
    const allocation = await PickupRequestModel.assignCollector(pickupId, collectorId);

    // Notify user in real-time
    try {
      emitPickupStatusUpdate(pickupId, {
        status: 'ACCEPTED',
        collectorId,
      });
    } catch {
      // Non-blocking
    }

    return {
      message: 'Pickup request accepted successfully',
      pickupId,
      allocation,
    };
  }

  /**
   * Collector updates the pickup status (e.g. IN_TRANSIT, COMPLETED)
   */
  static async updatePickupStatus(
    pickupId: string,
    collectorId: string,
    newStatus: string,
    userRole: string = 'COLLECTOR'
  ) {
    const pickup = await PickupRequestModel.findById(pickupId);
    if (!pickup) {
      throw new AppError(404, 'Pickup request not found', 'NOT_FOUND');
    }

    // Verify collector assignment unless admin
    if (userRole !== 'ADMIN') {
      const allocation = await PickupRequestModel.getAllocation(pickupId);
      if (!allocation || allocation.collector_id !== collectorId) {
        throw new AppError(403, 'You are not assigned to this pickup request', 'FORBIDDEN');
      }
    }

    // Validate lifecycle state transition
    const allowed = VALID_TRANSITIONS[pickup.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        400,
        `Cannot transition status from ${pickup.status} to ${newStatus}. Allowed transitions: ${allowed.join(', ') || 'none'}`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const updated = await PickupRequestModel.updateStatus(pickupId, newStatus);

    // Notify user in real-time
    try {
      emitPickupStatusUpdate(pickupId, {
        status: newStatus,
        updatedAt: updated.updated_at,
      });
    } catch {
      // Non-blocking
    }

    return updated;
  }
}
