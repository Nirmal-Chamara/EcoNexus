/**
 * matching.service.ts
 *
 * Matching service that integrates PostGIS spatial queries,
 * vehicle load tracking, and multi-criteria scoring to identify
 * and recommend the best collector for a waste pickup request.
 */

import { db } from '../../config/db';
import { PickupRequestModel } from '../../models/pickupRequest.model';
import { AppError } from '../../utils/AppError';
import { CollectorCandidate, PickupRequirement } from './eligibility';
import { rankCollectors, ScoredCollector } from './scoring';

export class MatchingService {
  /**
   * Retrieves active, available collectors within the radial catchment area
   * along with their current active route loads.
   */
  static async getAvailableCandidatesInRadius(
    lng: number,
    lat: number,
    radiusMeters: number = 25000
  ): Promise<CollectorCandidate[]> {
    const query = `
      SELECT 
        c.user_id, c.vehicle_type, c.vehicle_capacity, c.is_available, 
        c.rating, c.completed_pickups,
        u.name, u.email, u.phone, u.status AS account_status,
        ST_Y(c.current_location::geometry) AS latitude,
        ST_X(c.current_location::geometry) AS longitude,
        COALESCE(active.stops_count, 0)::int AS active_stops_count,
        COALESCE(active.total_load_kg, 0)::numeric(10,2) AS current_route_load_kg
      FROM collector_profiles c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN (
        SELECT 
          a.collector_id,
          COUNT(*)::int AS stops_count,
          SUM(COALESCE(p.actual_weight, p.estimated_weight, 0))::numeric(10,2) AS total_load_kg
        FROM pickup_allocations a
        JOIN pickup_requests p ON a.pickup_request_id = p.id
        WHERE a.status IN ('ACCEPTED', 'IN_TRANSIT')
        GROUP BY a.collector_id
      ) active ON active.collector_id = c.user_id
      WHERE c.is_available = true
        AND u.status = 'ACTIVE'
        AND c.current_location IS NOT NULL
        AND ST_DWithin(c.current_location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3);
    `;

    const result = await db.query(query, [lng, lat, radiusMeters]);

    return result.rows.map((r: any) => ({
      userId: r.user_id,
      name: r.name,
      vehicleType: r.vehicle_type || 'VAN',
      vehicleCapacity: Number(r.vehicle_capacity) || 500,
      isAvailable: Boolean(r.is_available),
      accountStatus: r.account_status,
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
      rating: Number(r.rating) || 5.0,
      completedPickups: Number(r.completed_pickups) || 0,
      activeStopsCount: Number(r.active_stops_count) || 0,
      currentRouteLoadKg: Number(r.current_route_load_kg) || 0,
    }));
  }

  /**
   * Finds and ranks all eligible collectors for an existing pickup request.
   */
  static async findRankedCollectorsForPickup(
    pickupId: string,
    radiusMeters: number = 25000,
    limit: number = 10
  ): Promise<ScoredCollector[]> {
    const pickup = await PickupRequestModel.findById(pickupId);
    if (!pickup) {
      throw new AppError(404, 'Pickup request not found', 'NOT_FOUND');
    }

    if (pickup.latitude === null || pickup.longitude === null) {
      throw new AppError(400, 'Pickup request lacks valid GPS coordinates', 'MISSING_COORDINATES');
    }

    const requirement: PickupRequirement = {
      id: pickup.id,
      wasteType: pickup.waste_type,
      estimatedWeight: Number(pickup.estimated_weight) || 1,
      latitude: Number(pickup.latitude),
      longitude: Number(pickup.longitude),
      scheduledTime: pickup.scheduled_time,
    };

    const candidates = await this.getAvailableCandidatesInRadius(
      requirement.longitude,
      requirement.latitude,
      radiusMeters
    );

    const ranked = rankCollectors(candidates, requirement, radiusMeters);
    return ranked.slice(0, limit);
  }

  /**
   * Identifies the single highest-scoring collector for a pickup request.
   */
  static async findBestCollectorForPickup(
    pickupId: string,
    radiusMeters: number = 25000
  ): Promise<ScoredCollector | null> {
    const ranked = await this.findRankedCollectorsForPickup(pickupId, radiusMeters, 1);
    return ranked.length > 0 ? ranked[0] : null;
  }

  /**
   * General recommendation query for arbitrary coordinates (e.g. for User 'Explore' screen).
   */
  static async getRecommendedCollectors(
    lat: number,
    lng: number,
    wasteType: string = 'PLASTIC',
    estimatedWeight: number = 5,
    radiusMeters: number = 25000
  ): Promise<ScoredCollector[]> {
    const requirement: PickupRequirement = {
      id: 'preview',
      wasteType,
      estimatedWeight,
      latitude: lat,
      longitude: lng,
    };

    const candidates = await this.getAvailableCandidatesInRadius(lng, lat, radiusMeters);
    return rankCollectors(candidates, requirement, radiusMeters);
  }
}
