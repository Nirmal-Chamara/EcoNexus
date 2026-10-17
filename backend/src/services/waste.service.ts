import { pool } from "../config/database";

export interface ListingInput {
  categoryId: number;
  title: string;
  description?: string;
  quantity: number;
  unit: "kg" | "items";
  condition: "clean" | "dirty" | "damaged" | "reusable";
  imageUrls?: string[];
}

export async function getCategories() {
  const result = await pool.query(
    `SELECT id, name, description, icon
     FROM waste_categories WHERE is_active = TRUE ORDER BY name`
  );
  return result.rows;
}

const LISTING_SELECT = `
  SELECT l.id, l.title, l.description, l.quantity, l.unit, l.condition,
         l.status, l.created_at, l.updated_at,
         c.id AS category_id, c.name AS category_name,
         COALESCE(json_agg(i.image_url) FILTER (WHERE i.id IS NOT NULL), '[]') AS images
  FROM waste_listings l
  JOIN waste_categories c ON c.id = l.category_id
  LEFT JOIN waste_images i ON i.listing_id = l.id
`;

export async function createListing(userId: string, d: ListingInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      `INSERT INTO waste_listings
         (user_id, category_id, title, description, quantity, unit, condition)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [userId, d.categoryId, d.title, d.description ?? null, d.quantity, d.unit, d.condition]
    );
    const id: string = r.rows[0].id;
    for (const url of d.imageUrls ?? []) {
      await client.query(
        "INSERT INTO waste_images (listing_id, image_url) VALUES ($1,$2)",
        [id, url]
      );
    }
    await client.query("COMMIT");
    return getListingById(id, userId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getMyListings(userId: string, scope: "active" | "history") {
  const statuses = scope === "history" ? ["collected", "cancelled"] : ["active", "requested"];
  const result = await pool.query(
    `${LISTING_SELECT}
     WHERE l.user_id = $1 AND l.status = ANY($2)
     GROUP BY l.id, c.id
     ORDER BY l.created_at DESC`,
    [userId, statuses]
  );
  return result.rows;
}

export async function getListingById(id: string, userId: string) {
  const result = await pool.query(
    `${LISTING_SELECT}
     WHERE l.id = $1 AND l.user_id = $2
     GROUP BY l.id, c.id`,
    [id, userId]
  );
  return result.rows[0] ?? null;
}

// Only an "active" listing can be edited or deleted.
export async function updateListing(id: string, userId: string, d: ListingInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      `UPDATE waste_listings
       SET category_id=$3, title=$4, description=$5, quantity=$6, unit=$7,
           condition=$8, updated_at=NOW()
       WHERE id=$1 AND user_id=$2 AND status='active' RETURNING id`,
      [id, userId, d.categoryId, d.title, d.description ?? null, d.quantity, d.unit, d.condition]
    );
    if (r.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    if (d.imageUrls) {
      await client.query("DELETE FROM waste_images WHERE listing_id=$1", [id]);
      for (const url of d.imageUrls) {
        await client.query(
          "INSERT INTO waste_images (listing_id, image_url) VALUES ($1,$2)",
          [id, url]
        );
      }
    }
    await client.query("COMMIT");
    return getListingById(id, userId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteListing(id: string, userId: string) {
  const r = await pool.query(
    "DELETE FROM waste_listings WHERE id=$1 AND user_id=$2 AND status='active'",
    [id, userId]
  );
  return (r.rowCount ?? 0) > 0;
}

export interface RequestInput {
  listingId: string;
  pickupAddress: string;
  preferredTime?: string;
  notes?: string;
}

const REQUEST_SELECT = `
  SELECT r.id, r.status, r.pickup_address, r.preferred_time, r.notes,
         r.collector_id, r.created_at, r.updated_at,
         l.id AS listing_id, l.title AS listing_title, l.quantity, l.unit,
         c.name AS category_name
  FROM pickup_requests r
  JOIN waste_listings l ON l.id = r.listing_id
  JOIN waste_categories c ON c.id = l.category_id
`;

export async function getRequestById(id: string, userId: string) {
  const result = await pool.query(
    `${REQUEST_SELECT} WHERE r.id = $1 AND r.requester_id = $2`,
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function getMyRequests(userId: string) {
  const result = await pool.query(
    `${REQUEST_SELECT} WHERE r.requester_id = $1 ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
}

// Creates the request and marks the listing as "requested" in one step.
export async function createRequest(userId: string, d: RequestInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const l = await client.query(
      `UPDATE waste_listings SET status='requested', updated_at=NOW()
       WHERE id=$1 AND user_id=$2 AND status='active' RETURNING id`,
      [d.listingId, userId]
    );
    if (l.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    const r = await client.query(
      `INSERT INTO pickup_requests
         (listing_id, requester_id, pickup_address, preferred_time, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [d.listingId, userId, d.pickupAddress, d.preferredTime ?? null, d.notes ?? null]
    );
    await client.query("COMMIT");
    return getRequestById(r.rows[0].id, userId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Only a "pending" request can be cancelled; the listing becomes "active" again.
export async function cancelRequest(id: string, userId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      `UPDATE pickup_requests SET status='cancelled', updated_at=NOW()
       WHERE id=$1 AND requester_id=$2 AND status='pending' RETURNING listing_id`,
      [id, userId]
    );
    if (r.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query(
      `UPDATE waste_listings SET status='active', updated_at=NOW() WHERE id=$1`,
      [r.rows[0].listing_id]
    );
    await client.query("COMMIT");
    return getRequestById(id, userId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}