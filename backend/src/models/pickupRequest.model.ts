import { db } from '../config/db';
import { AppError } from '../utils/AppError';

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
  verificationPin?: string;
}

export interface VerifyWeighDto {
  handshakePin: string;
  actualWeight: number;
  materials?: Array<{ name: string; weight: number; sub?: string; category?: string }>;
  scalePhotoUrl?: string;
  notes?: string;
}

export class PickupRequestModel {
  static async createRequest(data: CreatePickupDto) {
    const pin = data.verificationPin || String(Math.floor(1000 + Math.random() * 9000));
    // PostGIS ST_MakePoint takes (Longitude, Latitude)
    const query = `
      INSERT INTO pickup_requests (
        user_id, pickup_location, address_text, waste_type,
        estimated_weight, notes, images, scheduled_time, verification_pin
      )
      VALUES (
        $1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING 
        id, user_id, address_text, waste_type, estimated_weight, 
        status, notes, images, scheduled_time, verification_pin, created_at;
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
      pin,
    ]);

    const created = result.rows[0];

    // Log initial timeline event if pickup_request_events exists
    try {
      await db.query(
        `
        INSERT INTO pickup_request_events (request_id, status, note, created_at)
        VALUES ($1, 'PENDING', 'Pickup request placed by citizen', now())
        `,
        [created.id]
      );
    } catch {
      // Non-blocking if table is not yet migrated
    }

    return created;
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
        throw new AppError(409, 'Request is no longer pending or does not exist', 'CONFLICT');
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

      // Record timeline progress event
      try {
        await client.query(
          `
          INSERT INTO pickup_request_events (request_id, status, note, created_at)
          VALUES ($1, 'ACCEPTED', 'Collector accepted pickup order', now())
          `,
          [requestId]
        );
      } catch {
        // Non-blocking
      }

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
        throw new AppError(404, 'Pickup request not found', 'NOT_FOUND');
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

      // If completed, update collector completed trip counter
      if (status === 'COMPLETED') {
        try {
          await client.query(
            `
            UPDATE collector_profiles
            SET completed_pickups = completed_pickups + 1, updated_at = now()
            WHERE user_id = (
              SELECT collector_id FROM pickup_allocations WHERE pickup_request_id = $1 LIMIT 1
            );
            `,
            [requestId]
          );
        } catch {
          // Non-blocking
        }
      }

      // Record timeline progress event
      try {
        await client.query(
          `
          INSERT INTO pickup_request_events (request_id, status, note, created_at)
          VALUES ($1, $2, $3, now())
          `,
          [requestId, status, `Status transitioned to ${status}`]
        );
      } catch {
        // Non-blocking
      }

      await client.query('COMMIT');
      return reqResult.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async verifyAndWeigh(requestId: string, collectorId: string, data: VerifyWeighDto) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Fetch pickup request
      const reqRes = await client.query('SELECT * FROM pickup_requests WHERE id = $1 FOR UPDATE;', [requestId]);
      if (reqRes.rows.length === 0) {
        throw new AppError(404, 'Pickup request not found', 'NOT_FOUND');
      }
      const pickup = reqRes.rows[0];

      // 2. Validate handshake PIN
      const storedPin = (pickup.verification_pin || '').trim();
      const submittedPin = (data.handshakePin || '').trim();
      if (!storedPin || storedPin !== submittedPin) {
        throw new AppError(
          400,
          `Invalid handshake PIN '${submittedPin}'. Please confirm the 4-digit code with the citizen.`,
          'INVALID_HANDSHAKE_PIN'
        );
      }

      // 3. Calculate payout and eco-points
      let payout = 0;
      if (data.materials && data.materials.length > 0) {
        payout = data.materials.reduce((sum, m) => {
          const lower = (m.name || '').toLowerCase();
          const rate = lower.includes('plastic')
            ? 0.25
            : lower.includes('cardboard') || lower.includes('paper')
            ? 0.15
            : lower.includes('metal')
            ? 0.55
            : lower.includes('e-waste')
            ? 1.45
            : 1.03;
          return sum + (Number(m.weight) || 0) * rate;
        }, 0);
      }
      if (payout <= 0) {
        payout = Number((data.actualWeight * 1.03).toFixed(2));
      } else {
        payout = Number(payout.toFixed(2));
      }
      const points = Math.round(data.actualWeight * 30);

      // 4. Update pickup request
      const updateRes = await client.query(
        `
        UPDATE pickup_requests
        SET status = 'IN_TRANSIT',
            actual_weight = $2,
            weighed_materials = $3,
            scale_photo_url = $4,
            payout_amount = $5,
            points_awarded = $6,
            verified_at = now(),
            updated_at = now()
        WHERE id = $1
        RETURNING *;
        `,
        [
          requestId,
          data.actualWeight,
          JSON.stringify(data.materials || []),
          data.scalePhotoUrl || null,
          payout,
          points,
        ]
      );

      // 5. Update allocation status
      await client.query(
        `
        UPDATE pickup_allocations
        SET status = 'IN_TRANSIT'
        WHERE pickup_request_id = $1;
        `,
        [requestId]
      );

      // 6. Record timeline progress event
      try {
        await client.query(
          `
          INSERT INTO pickup_request_events (request_id, status, note, created_at)
          VALUES ($1, 'IN_TRANSIT', $2, now());
          `,
          [
            requestId,
            `Weighed at ${data.actualWeight} kg (${data.materials?.map((m) => `${m.name}: ${m.weight}kg`).join(', ') || 'verified'}). Handshake PIN ${submittedPin} validated.`,
          ]
        );
      } catch {
        // Non-blocking
      }

      await client.query('COMMIT');

      return {
        ...updateRes.rows[0],
        slip: {
          batchCode: `#ECO-${requestId.substring(0, 4).toUpperCase()}`,
          verifiedWeight: data.actualWeight,
          payoutAmount: payout,
          pointsAwarded: points,
          nextStop: 'GreenTech Regional Hub #04',
        },
      };
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

  static async getEvents(requestId: string) {
    try {
      const query = `
        SELECT id, request_id, status, note, created_at
        FROM pickup_request_events
        WHERE request_id = $1
        ORDER BY created_at ASC;
      `;
      const result = await db.query(query, [requestId]);
      return result.rows;
    } catch {
      return [];
    }
  }
}
