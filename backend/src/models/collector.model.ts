import { db } from '../config/db';

export class CollectorModel {
  static async updateLocation(userId: string, lat: number, lng: number) {
    // Note: PostGIS ST_MakePoint uses (Longitude, Latitude)
    const query = `
      INSERT INTO collector_profiles (user_id, current_location, updated_at)
      VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), now())
      ON CONFLICT (user_id) DO UPDATE 
      SET current_location = EXCLUDED.current_location,
          updated_at = now()
      RETURNING *;
    `;
    const result = await db.query(query, [userId, lng, lat]);
    return result.rows[0];
  }

  static async updateAvailability(userId: string, isAvailable: boolean) {
    const query = `
      UPDATE collector_profiles
      SET is_available = $2, updated_at = now()
      WHERE user_id = $1
      RETURNING *;
    `;
    const result = await db.query(query, [userId, isAvailable]);
    return result.rows[0];
  }

  static async getProfile(userId: string) {
    const query = `
      SELECT c.*, u.name, u.email, u.phone 
      FROM collector_profiles c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = $1;
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }
}
