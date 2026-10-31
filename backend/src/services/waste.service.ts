import { PoolClient } from "pg";
import { pool } from "../config/database";
import { AppError } from "../utils/AppError";

// ---------- Types ----------
export type ListingScope = "active" | "scheduled" | "history" | "drafts";

// Which statuses each tab of "My Listings" shows
const SCOPE_STATUSES: Record<ListingScope, string[]> = {
  active: ["active", "requested"], // requested = "Awaiting Hauler"
  scheduled: ["scheduled"],
  history: ["collected", "cancelled"],
  drafts: ["draft"],
};

export interface PhotoInput {
  url: string;
  label?: string | null;
}

export interface ListingInput {
  categoryId: number;
  title?: string;
  description?: string | null;
  quantity: number;
  unit?: "kg" | "items";
  containerSize?: "small" | "medium" | "bulk" | null;
  isCleaned?: boolean;
  isSorted?: boolean;
  pathway?: "recycle" | "sell" | "donate" | "reuse";
  status?: "draft" | "active";
  photos?: PhotoInput[];
}

export interface RequestInput {
  listingIds: string[];
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupDate: string;
  timeSlot: "morning" | "afternoon" | "evening";
  dispatchMode?: "smart" | "specific";
  preferredCollectorId?: string | null;
  notes?: string | null;
}

// ---------- Reward estimate ----------
// PLACEHOLDER until the rewards module provides the real numbers.
const POINTS_PER_KG = 15;
const VALUE_PER_POINT = 0.033;

export function estimateReward(kg: number) {
  const points = Math.round(kg * POINTS_PER_KG);
  return { points, value: Math.round(points * VALUE_PER_POINT * 100) / 100 };
}

function withReward<T extends { quantity: string | number; unit: string }>(row: T) {
  const r = row.unit === "kg" ? estimateReward(Number(row.quantity)) : { points: 0, value: 0 };
  return { ...row, estimated_points: r.points, estimated_value: r.value };
}

// ---------- Categories ----------
export async function getCategories() {
  const result = await pool.query(
    `SELECT id, name, description, icon
     FROM waste_categories WHERE is_active = TRUE
     ORDER BY sort_order, name`
  );
  return result.rows;
}

// ---------- Listings ----------
const LISTING_SELECT = `
  SELECT l.id, l.listing_code, l.title, l.description, l.quantity, l.unit,
         l.condition, l.container_size, l.is_cleaned, l.is_sorted, l.pathway,
         l.status, l.created_at, l.updated_at,
         c.id AS category_id, c.name AS category_name,
         COALESCE(
           json_agg(json_build_object('url', i.image_url, 'label', i.label) ORDER BY i.id)
             FILTER (WHERE i.id IS NOT NULL),
           '[]'
         ) AS images
  FROM waste_listings l
  JOIN waste_categories c ON c.id = l.category_id
  LEFT JOIN waste_images i ON i.listing_id = l.id
`;

async function categoryNameOrFail(client: PoolClient, categoryId: number): Promise<string> {
  const r = await client.query(
    "SELECT name FROM waste_categories WHERE id = $1 AND is_active = TRUE",
    [categoryId]
  );
  if (r.rowCount === 0) throw new AppError(400, "Invalid category", "INVALID_CATEGORY");
  return r.rows[0].name;
}

// The design has no title field, so one is generated: "Clean Plastic", "Glass", ...
function buildTitle(d: ListingInput, categoryName: string): string {
  return d.title?.trim() || `${d.isCleaned ? "Clean " : ""}${categoryName}`;
}

async function insertPhotos(client: PoolClient, listingId: string, photos: PhotoInput[] = []) {
  for (const p of photos) {
    await client.query(
      "INSERT INTO waste_images (listing_id, image_url, label) VALUES ($1,$2,$3)",
      [listingId, p.url, p.label ?? null]
    );
  }
}

export async function createListing(userId: string, d: ListingInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const categoryName = await categoryNameOrFail(client, d.categoryId);
    const cleaned = !!d.isCleaned;
    const r = await client.query(
      `INSERT INTO waste_listings
         (user_id, category_id, title, description, quantity, unit, condition,
          container_size, is_cleaned, is_sorted, pathway, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [
        userId, d.categoryId, buildTitle(d, categoryName), d.description ?? null,
        d.quantity, d.unit ?? "kg", cleaned ? "clean" : "dirty",
        d.containerSize ?? null, cleaned, !!d.isSorted,
        d.pathway ?? "recycle", d.status ?? "active",
      ]
    );
    const id: string = r.rows[0].id;
    await insertPhotos(client, id, d.photos);
    await client.query("COMMIT");
    return getListingById(id, userId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getMyListings(userId: string, scope: ListingScope) {
  const result = await pool.query(
    `${LISTING_SELECT}
     WHERE l.user_id = $1 AND l.status = ANY($2)
     GROUP BY l.id, c.id
     ORDER BY l.created_at DESC`,
    [userId, SCOPE_STATUSES[scope]]
  );
  return result.rows.map(withReward);
}

export async function getListingById(id: string, userId: string) {
  const result = await pool.query(
    `${LISTING_SELECT}
     WHERE l.id = $1 AND l.user_id = $2
     GROUP BY l.id, c.id`,
    [id, userId]
  );
  return result.rows[0] ? withReward(result.rows[0]) : null;
}

// Numbers for the tab badges and the stats row on My Listings
export async function getSummary(userId: string) {
  const r = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('active','requested'))::int  AS active,
       COUNT(*) FILTER (WHERE status = 'scheduled')::int              AS scheduled,
       COUNT(*) FILTER (WHERE status IN ('collected','cancelled'))::int AS history,
       COUNT(*) FILTER (WHERE status = 'draft')::int                  AS drafts,
       COALESCE(SUM(quantity) FILTER (WHERE status = 'collected' AND unit = 'kg'), 0) AS recycled_kg
     FROM waste_listings WHERE user_id = $1`,
    [userId]
  );
  const row = r.rows[0];
  return {
    counts: { active: row.active, scheduled: row.scheduled, history: row.history, drafts: row.drafts },
    recycled_kg: Number(row.recycled_kg),
  };
}

// Only a draft or an active (not yet requested) listing can be edited.
export async function updateListing(id: string, userId: string, d: ListingInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const categoryName = await categoryNameOrFail(client, d.categoryId);
    const cleaned = !!d.isCleaned;
    const r = await client.query(
      `UPDATE waste_listings
       SET category_id=$3, title=$4, description=$5, quantity=$6, unit=$7,
           condition=$8, container_size=$9, is_cleaned=$10, is_sorted=$11,
           pathway=$12, status=COALESCE($13::varchar, status), updated_at=NOW()
       WHERE id=$1 AND user_id=$2 AND status IN ('draft','active')
       RETURNING id`,
      [
        id, userId, d.categoryId, buildTitle(d, categoryName), d.description ?? null,
        d.quantity, d.unit ?? "kg", cleaned ? "clean" : "dirty",
        d.containerSize ?? null, cleaned, !!d.isSorted,
        d.pathway ?? "recycle", d.status ?? null,
      ]
    );
    if (r.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    if (d.photos) {
      await client.query("DELETE FROM waste_images WHERE listing_id = $1", [id]);
      await insertPhotos(client, id, d.photos);
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
    "DELETE FROM waste_listings WHERE id = $1 AND user_id = $2 AND status IN ('draft','active')",
    [id, userId]
  );
  return (r.rowCount ?? 0) > 0;
}

// ---------- Collection requests ----------
export async function getRequestById(id: string, userId: string) {
  const head = await pool.query(
    `SELECT r.id, r.status, r.pickup_address, r.notes, r.pickup_date, r.time_slot,
            r.dispatch_mode, r.collector_id, r.preferred_collector_id,
            r.created_at, r.updated_at,
            ST_Y(r.pickup_location::geometry) AS pickup_lat,
            ST_X(r.pickup_location::geometry) AS pickup_lng
     FROM pickup_requests r
     WHERE r.id = $1 AND r.requester_id = $2`,
    [id, userId]
  );
  const request = head.rows[0];
  if (!request) return null;

  const [items, events] = await Promise.all([
    pool.query(
      `SELECT l.id, l.listing_code, l.title, l.quantity, l.unit, l.is_cleaned, l.is_sorted,
              c.name AS category_name,
              (SELECT image_url FROM waste_images i
                WHERE i.listing_id = l.id ORDER BY i.id LIMIT 1) AS image
       FROM pickup_request_items it
       JOIN waste_listings l ON l.id = it.listing_id
       JOIN waste_categories c ON c.id = l.category_id
       WHERE it.request_id = $1
       ORDER BY l.created_at`,
      [id]
    ),
    pool.query(
      `SELECT status, note, created_at
       FROM pickup_request_events
       WHERE request_id = $1 ORDER BY created_at, id`,
      [id]
    ),
  ]);

  const totalKg = items.rows.reduce(
    (sum, i) => sum + (i.unit === "kg" ? Number(i.quantity) : 0),
    0
  );
  const reward = estimateReward(totalKg);
  return {
    ...request,
    items: items.rows,
    events: events.rows,
    total_weight: totalKg,
    estimated_points: reward.points,
    estimated_value: reward.value,
  };
}

export async function getMyRequests(userId: string) {
  const result = await pool.query(
    `SELECT r.id, r.status, r.pickup_address, r.pickup_date, r.time_slot, r.created_at,
            COUNT(it.listing_id)::int AS item_count,
            COALESCE(SUM(l.quantity), 0) AS total_weight
     FROM pickup_requests r
     LEFT JOIN pickup_request_items it ON it.request_id = r.id
     LEFT JOIN waste_listings l ON l.id = it.listing_id
     WHERE r.requester_id = $1
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
}

// One request can cover several of the user's active listings.
export async function createRequest(userId: string, d: RequestInput) {
  const ids = [...new Set(d.listingIds)];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Only the user's own, still-available listings can be requested
    const locked = await client.query(
      `UPDATE waste_listings SET status = 'requested', updated_at = NOW()
       WHERE id = ANY($1::uuid[]) AND user_id = $2 AND status = 'active'
       RETURNING id`,
      [ids, userId]
    );
    if (locked.rowCount !== ids.length) {
      throw new AppError(
        409,
        "One or more listings are not available for collection",
        "LISTING_NOT_AVAILABLE"
      );
    }

    const mode = d.dispatchMode ?? "smart";
    const r = await client.query(
      `INSERT INTO pickup_requests
         (requester_id, pickup_address, pickup_location, pickup_date, time_slot,
          dispatch_mode, preferred_collector_id, notes)
       VALUES ($1, $2,
         CASE WHEN $3::float8 IS NULL OR $4::float8 IS NULL THEN NULL
              ELSE ST_SetSRID(ST_MakePoint($4::float8, $3::float8), 4326)::geography END,
         $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        userId, d.pickupAddress, d.pickupLat ?? null, d.pickupLng ?? null,
        d.pickupDate, d.timeSlot, mode,
        mode === "specific" ? d.preferredCollectorId ?? null : null,
        d.notes ?? null,
      ]
    );
    const requestId: string = r.rows[0].id;

    await client.query(
      `INSERT INTO pickup_request_items (request_id, listing_id)
       SELECT $1, unnest($2::uuid[])`,
      [requestId, ids]
    );
    await client.query(
      `INSERT INTO pickup_request_events (request_id, status, note)
       VALUES ($1, 'pending', 'Request submitted')`,
      [requestId]
    );

    await client.query("COMMIT");
    return getRequestById(requestId, userId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Cancel is allowed until the collector is on the way; the listings become active again.
export async function cancelRequest(id: string, userId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      `UPDATE pickup_requests SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND requester_id = $2 AND status IN ('pending','accepted')
       RETURNING id`,
      [id, userId]
    );
    if (r.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query(
      `UPDATE waste_listings SET status = 'active', updated_at = NOW()
       WHERE status IN ('requested','scheduled')
         AND id IN (SELECT listing_id FROM pickup_request_items WHERE request_id = $1)`,
      [id]
    );
    await client.query(
      `INSERT INTO pickup_request_events (request_id, status, note)
       VALUES ($1, 'cancelled', 'Cancelled by user')`,
      [id]
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