import { db } from '../config/db';

export interface UpdateCollectorProfileDto {
  vehicleType?: string;
  vehicleCapacity?: number;
  isAvailable?: boolean;
}

export class CollectorModel {
  static async updateLocation(userId: string, lat: number, lng: number) {
    // PostGIS ST_MakePoint uses (Longitude, Latitude)
    const query = `
      INSERT INTO collector_profiles (user_id, current_location, updated_at)
      VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), now())
      ON CONFLICT (user_id) DO UPDATE 
      SET current_location = EXCLUDED.current_location,
          updated_at = now()
      RETURNING 
        user_id, vehicle_type, vehicle_capacity, is_available, rating, completed_pickups, updated_at,
        ST_Y(current_location::geometry) AS latitude,
        ST_X(current_location::geometry) AS longitude;
    `;
    const result = await db.query(query, [userId, lng, lat]);
    return result.rows[0];
  }

  static async updateAvailability(userId: string, isAvailable: boolean) {
    const query = `
      INSERT INTO collector_profiles (user_id, is_available, updated_at)
      VALUES ($1, $2, now())
      ON CONFLICT (user_id) DO UPDATE
      SET is_available = $2, updated_at = now()
      RETURNING *;
    `;
    const result = await db.query(query, [userId, isAvailable]);
    return result.rows[0];
  }

  static async updateProfile(userId: string, data: UpdateCollectorProfileDto) {
    const query = `
      INSERT INTO collector_profiles (user_id, vehicle_type, vehicle_capacity, is_available, updated_at)
      VALUES ($1, $2, $3, COALESCE($4, false), now())
      ON CONFLICT (user_id) DO UPDATE
      SET vehicle_type = COALESCE($2, collector_profiles.vehicle_type),
          vehicle_capacity = COALESCE($3, collector_profiles.vehicle_capacity),
          is_available = COALESCE($4, collector_profiles.is_available),
          updated_at = now()
      RETURNING 
        user_id, vehicle_type, vehicle_capacity, is_available, rating, completed_pickups, updated_at,
        ST_Y(current_location::geometry) AS latitude,
        ST_X(current_location::geometry) AS longitude;
    `;
    const result = await db.query(query, [
      userId,
      data.vehicleType || null,
      data.vehicleCapacity || null,
      data.isAvailable !== undefined ? data.isAvailable : null,
    ]);
    return result.rows[0];
  }

  static async getProfile(userId: string) {
    const query = `
      SELECT 
        c.user_id, c.vehicle_type, c.vehicle_capacity, c.is_available,
        c.rating, c.completed_pickups, c.created_at, c.updated_at,
        ST_Y(c.current_location::geometry) AS latitude,
        ST_X(c.current_location::geometry) AS longitude,
        u.name, u.email, u.phone
      FROM collector_profiles c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = $1;
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }

  static async getAssignedPickups(collectorId: string) {
    const query = `
      SELECT 
        p.id, p.user_id, p.address_text, p.waste_type, p.estimated_weight,
        p.status, p.notes, p.scheduled_time, p.created_at,
        ST_Y(p.pickup_location::geometry) AS latitude,
        ST_X(p.pickup_location::geometry) AS longitude,
        a.id AS allocation_id, a.assigned_at, a.completed_at,
        u.name AS user_name, u.phone AS user_phone, u.email AS user_email
      FROM pickup_allocations a
      JOIN pickup_requests p ON a.pickup_request_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.collector_id = $1
      ORDER BY a.assigned_at DESC;
    `;
    const result = await db.query(query, [collectorId]);
    return result.rows;
  }
}
