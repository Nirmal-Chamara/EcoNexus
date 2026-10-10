import { db } from '../config/db';

export class PickupRequestModel {
  static async createRequest(
    userId: string,
    lat: number,
    lng: number,
    address: string,
    wasteType: string,
    estimatedWeight: number,
    notes?: string
  ) {
    // Note: PostGIS ST_MakePoint uses (Longitude, Latitude)
    const query = `
      INSERT INTO pickup_requests (
        user_id, pickup_location, address_text, waste_type, estimated_weight, notes
      )
      VALUES (
        $1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7
      )
      RETURNING id, status, created_at;
    `;
    const result = await db.query(query, [
      userId, lng, lat, address, wasteType, estimatedWeight, notes
    ]);
    return result.rows[0];
  }

  static async findNearby(lat: number, lng: number, radiusMeters: number = 5000) {
    const query = `
      SELECT id, address_text, waste_type, estimated_weight, status, created_at,
             ST_DistanceSphere(pickup_location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance_meters
      FROM pickup_requests
      WHERE status = 'PENDING'
        AND ST_DWithin(pickup_location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
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
      const reqUpdate = await client.query(`
        UPDATE pickup_requests SET status = 'ACCEPTED', updated_at = now()
        WHERE id = $1 AND status = 'PENDING' RETURNING id
      `, [requestId]);

      if (reqUpdate.rows.length === 0) {
        throw new Error('Request is no longer pending or does not exist');
      }

      // Create allocation record
      await client.query(`
        INSERT INTO pickup_allocations (pickup_request_id, collector_id)
        VALUES ($1, $2)
      `, [requestId, collectorId]);

      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async updateStatus(requestId: string, status: string) {
    const query = `
      UPDATE pickup_requests 
      SET status = $2, updated_at = now()
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(query, [requestId, status]);
    return result.rows[0];
  }
}
