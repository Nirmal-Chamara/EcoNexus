import { db } from '../config/db';

export interface CreatePickupDto {
  userId: string;
  lat: number;
  lng: number;
  address: string;
  wasteType: string;
  estimatedWeight?: number;
  notes?: string;
  images?: string[];
  scheduledTime?: string;
}

export class PickupRequestModel {
  static async createRequest(data: CreatePickupDto) {
    // PostGIS ST_MakePoint takes (Longitude, Latitude)
    const query = `
      INSERT INTO pickup_requests (
        user_id, pickup_location, address_text, waste_type,
        estimated_weight, notes, images, scheduled_time
      )
      VALUES (
        $1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7, $8, $9
      )
      RETURNING 
        id, user_id, address_text, waste_type, estimated_weight, 
        status, notes, images, scheduled_time, created_at;
    `;
    const result = await db.query(query, [
      data.userId,
      data.lng,
      data.lat,
      data.address,
      data.wasteType,
      data.estimatedWeight || null,
      data.notes || null,
      data.images || null,
      data.scheduledTime || null,
    ]);
    return result.rows[0];
  }

  static async findById(id: string) {
    const query = `
      SELECT 
        id, user_id, address_text, waste_type, estimated_weight,
        images, status, notes, scheduled_time, created_at, updated_at,
        ST_Y(pickup_location::geometry) AS latitude,
        ST_X(pickup_location::geometry) AS longitude
      FROM pickup_requests
      WHERE id = $1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string) {
    const query = `
      SELECT 
        id, address_text, waste_type, estimated_weight,
        images, status, notes, scheduled_time, created_at, updated_at,
        ST_Y(pickup_location::geometry) AS latitude,
        ST_X(pickup_location::geometry) AS longitude
      FROM pickup_requests
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async findNearby(lat: number, lng: number, radiusMeters: number = 5000) {
    const query = `
      SELECT 
        p.id, p.user_id, p.address_text, p.waste_type, p.estimated_weight,
        p.images, p.status, p.notes, p.scheduled_time, p.created_at,
        ST_Y(p.pickup_location::geometry) AS latitude,
        ST_X(p.pickup_location::geometry) AS longitude,
        ROUND(ST_DistanceSphere(p.pickup_location, ST_SetSRID(ST_MakePoint($1, $2), 4326))::numeric, 2) AS distance_meters
      FROM pickup_requests p
      WHERE p.status = 'PENDING'
        AND ST_DWithin(p.pickup_location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance_meters ASC;
    `;
    const result = await db.query(query, [lng, lat, radiusMeters]);
    return result.rows;
  }

  static async assignCollector(requestId: string, collectorId: string) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Update request status ensuring it is still PENDING
      const reqUpdate = await client.query(
        `
        UPDATE pickup_requests
        SET status = 'ACCEPTED', updated_at = now()
        WHERE id = $1 AND status = 'PENDING'
        RETURNING id;
        `,
        [requestId]
      );

      if (reqUpdate.rows.length === 0) {
        throw new Error('Request is no longer pending or does not exist');
      }

      // Create allocation record
      const allocResult = await client.query(
        `
        INSERT INTO pickup_allocations (pickup_request_id, collector_id, status)
        VALUES ($1, $2, 'ACCEPTED')
        RETURNING *;
        `,
        [requestId, collectorId]
      );

      await client.query('COMMIT');
      return allocResult.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async updateStatus(requestId: string, status: string) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const reqResult = await client.query(
        `
        UPDATE pickup_requests 
        SET status = $2, updated_at = now()
        WHERE id = $1
        RETURNING *;
        `,
        [requestId, status]
      );

      if (reqResult.rows.length === 0) {
        throw new Error('Pickup request not found');
      }

      // Sync status with pickup_allocations
      await client.query(
        `
        UPDATE pickup_allocations
        SET status = $2,
            completed_at = CASE WHEN $2 = 'COMPLETED' THEN now() ELSE completed_at END
        WHERE pickup_request_id = $1;
        `,
        [requestId, status]
      );

      await client.query('COMMIT');
      return reqResult.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async getAllocation(requestId: string) {
    const query = `
      SELECT 
        a.id, a.pickup_request_id, a.collector_id, a.assigned_at, a.status, a.completed_at,
        u.name AS collector_name, u.email AS collector_email, u.phone AS collector_phone
      FROM pickup_allocations a
      JOIN users u ON a.collector_id = u.id
      WHERE a.pickup_request_id = $1;
    `;
    const result = await db.query(query, [requestId]);
    return result.rows[0] || null;
  }
}
