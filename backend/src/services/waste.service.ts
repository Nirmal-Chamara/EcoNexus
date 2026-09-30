import { pool } from "../config/database";

export async function getCategories() {
  const result = await pool.query(
    `SELECT id, name, description, icon
     FROM waste_categories
     WHERE is_active = TRUE
     ORDER BY name`
  );
  return result.rows;
}