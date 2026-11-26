import { pool } from '../config/database';
import { AppError } from '../utils/AppError';

// ── Profile ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  await ensureProfileExists(userId);
  const { rows } = await pool.query(
    `SELECT rcp.*,
            u.name, u.email, u.phone, u.status AS account_status,
            vr.status AS verification_status,
            vr.review_note,
            vr.reviewed_at
     FROM recycling_center_profiles rcp
     JOIN users u ON u.id = rcp.user_id
     LEFT JOIN verification_requests vr
       ON vr.user_id = rcp.user_id AND vr.requested_role = 'RECYCLING_CENTER'
     WHERE rcp.user_id = $1
     ORDER BY vr.created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function upsertProfile(
  userId: string,
  data: {
    organization_name?: string;
    registration_no?: string;
    contact_phone?: string;
    address_text?: string;
    total_capacity_kg?: number;
    document_url?: string;
  }
) {
  const { rows } = await pool.query(
    `INSERT INTO recycling_center_profiles
       (user_id, organization_name, registration_no, contact_phone, address_text, total_capacity_kg, document_url, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (user_id) DO UPDATE SET
       organization_name = COALESCE(EXCLUDED.organization_name, recycling_center_profiles.organization_name),
       registration_no   = COALESCE(EXCLUDED.registration_no,   recycling_center_profiles.registration_no),
       contact_phone     = COALESCE(EXCLUDED.contact_phone,      recycling_center_profiles.contact_phone),
       address_text      = COALESCE(EXCLUDED.address_text,       recycling_center_profiles.address_text),
       total_capacity_kg = COALESCE(EXCLUDED.total_capacity_kg,  recycling_center_profiles.total_capacity_kg),
       document_url      = COALESCE(EXCLUDED.document_url,       recycling_center_profiles.document_url),
       updated_at        = now()
     RETURNING *`,
    [
      userId,
      data.organization_name ?? null,
      data.registration_no ?? null,
      data.contact_phone ?? null,
      data.address_text ?? null,
      data.total_capacity_kg ?? null,
      data.document_url ?? null,
    ]
  );
  return rows[0];
}

// ── Verification Status ──────────────────────────────────────────────────────

export async function getVerificationStatus(userId: string) {
  const { rows } = await pool.query(
    `SELECT vr.id, vr.status, vr.review_note, vr.reviewed_at, vr.created_at,
            vr.organization_name, vr.registration_no, vr.document_url,
            u.name AS reviewer_name
     FROM verification_requests vr
     LEFT JOIN users u ON u.id = vr.reviewed_by
     WHERE vr.user_id = $1 AND vr.requested_role = 'RECYCLING_CENTER'
     ORDER BY vr.created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// ── Accepted Categories ──────────────────────────────────────────────────────

export async function getAcceptedCategories(userId: string) {
  await ensureProfileExists(userId);
  const { rows } = await pool.query(
    `SELECT wc.id, wc.name, wc.description, wc.icon, wc.sort_order,
            rcc.added_at
     FROM recycling_center_categories rcc
     JOIN waste_categories wc ON wc.id = rcc.category_id
     WHERE rcc.center_user_id = $1
     ORDER BY wc.sort_order ASC`,
    [userId]
  );
  return rows;
}

export async function addAcceptedCategory(userId: string, categoryId: number) {
  // Ensure center profile exists
  await ensureProfileExists(userId);

  // Verify the waste category exists
  const catCheck = await pool.query(
    'SELECT id FROM waste_categories WHERE id = $1 AND is_active = true',
    [categoryId]
  );
  if (catCheck.rowCount === 0) {
    throw new AppError(404, 'Waste category not found', 'NOT_FOUND');
  }

  // Insert (ignore conflict = already added)
  const { rows } = await pool.query(
    `INSERT INTO recycling_center_categories (center_user_id, category_id)
     VALUES ($1, $2)
     ON CONFLICT (center_user_id, category_id) DO NOTHING
     RETURNING *`,
    [userId, categoryId]
  );
  return rows[0] || { center_user_id: userId, category_id: categoryId, already_exists: true };
}

export async function removeAcceptedCategory(userId: string, categoryId: number) {
  const { rowCount } = await pool.query(
    `DELETE FROM recycling_center_categories
     WHERE center_user_id = $1 AND category_id = $2`,
    [userId, categoryId]
  );
  return (rowCount ?? 0) > 0;
}

// ── Intake Records ───────────────────────────────────────────────────────────

export async function getIntakeRecords(
  userId: string,
  statusFilter?: string
) {
  const params: any[] = [userId];
  let statusClause = '';
  if (statusFilter && ['RECEIVED', 'SORTED', 'PROCESSED'].includes(statusFilter)) {
    statusClause = 'AND ir.status = $2';
    params.push(statusFilter);
  }

  const { rows } = await pool.query(
    `SELECT ir.id, ir.quantity_kg, ir.delivery_ref, ir.notes, ir.status,
            ir.received_at, ir.created_at, ir.updated_at,
            wc.id AS category_id, wc.name AS category_name, wc.icon AS category_icon
     FROM intake_records ir
     JOIN waste_categories wc ON wc.id = ir.category_id
     WHERE ir.center_user_id = $1 ${statusClause}
     ORDER BY ir.received_at DESC`,
    params
  );
  return rows;
}

export async function getIntakeById(userId: string, intakeId: string) {
  const { rows } = await pool.query(
    `SELECT ir.id, ir.quantity_kg, ir.delivery_ref, ir.notes, ir.status,
            ir.received_at, ir.created_at, ir.updated_at,
            wc.id AS category_id, wc.name AS category_name, wc.icon AS category_icon
     FROM intake_records ir
     JOIN waste_categories wc ON wc.id = ir.category_id
     WHERE ir.id = $1 AND ir.center_user_id = $2`,
    [intakeId, userId]
  );
  if (!rows[0]) throw new AppError(404, 'Intake record not found', 'NOT_FOUND');
  return rows[0];
}

export async function createIntake(
  userId: string,
  data: {
    category_id: number;
    quantity_kg: number;
    received_at?: string;
    delivery_ref?: string;
    notes?: string;
  }
) {
  await ensureProfileExists(userId);

  // Verify category is accepted by this center
  const catCheck = await pool.query(
    `SELECT 1 FROM recycling_center_categories
     WHERE center_user_id = $1 AND category_id = $2`,
    [userId, data.category_id]
  );
  if (catCheck.rowCount === 0) {
    throw new AppError(
      400,
      'This category is not in your accepted categories list',
      'CATEGORY_NOT_ACCEPTED'
    );
  }

  // Insert intake record
  const { rows } = await pool.query(
    `INSERT INTO intake_records
       (center_user_id, category_id, quantity_kg, received_at, delivery_ref, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      userId,
      data.category_id,
      data.quantity_kg,
      data.received_at ? new Date(data.received_at) : new Date(),
      data.delivery_ref ?? null,
      data.notes ?? null,
    ]
  );

  // Update running intake total on the profile
  await pool.query(
    `UPDATE recycling_center_profiles
     SET current_intake_kg = current_intake_kg + $1, updated_at = now()
     WHERE user_id = $2`,
    [data.quantity_kg, userId]
  );

  return rows[0];
}

export async function updateIntakeStatus(
  userId: string,
  intakeId: string,
  status: 'RECEIVED' | 'SORTED' | 'PROCESSED'
) {
  // Validate transition order
  const VALID_NEXT: Record<string, string[]> = {
    RECEIVED: ['SORTED'],
    SORTED: ['PROCESSED'],
    PROCESSED: [],
  };

  const { rows: existing } = await pool.query(
    'SELECT status FROM intake_records WHERE id = $1 AND center_user_id = $2',
    [intakeId, userId]
  );
  if (!existing[0]) throw new AppError(404, 'Intake record not found', 'NOT_FOUND');

  const currentStatus = existing[0].status as string;
  if (!VALID_NEXT[currentStatus]?.includes(status)) {
    throw new AppError(
      400,
      `Cannot transition from ${currentStatus} to ${status}`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const { rows } = await pool.query(
    `UPDATE intake_records SET status = $1, updated_at = now()
     WHERE id = $2 AND center_user_id = $3
     RETURNING *`,
    [status, intakeId, userId]
  );
  return rows[0];
}

// ── Dashboard Summary ────────────────────────────────────────────────────────

export async function getDashboardSummary(userId: string) {
  await ensureProfileExists(userId);

  const [profileResult, categoryResult, intakeSummary, recentIntake] = await Promise.all([
    pool.query(
      `SELECT rcp.organization_name, rcp.total_capacity_kg, rcp.current_intake_kg,
              vr.status AS verification_status
       FROM recycling_center_profiles rcp
       LEFT JOIN verification_requests vr
         ON vr.user_id = rcp.user_id AND vr.requested_role = 'RECYCLING_CENTER'
       WHERE rcp.user_id = $1
       ORDER BY vr.created_at DESC LIMIT 1`,
      [userId]
    ),
    pool.query(
      `SELECT COUNT(*) AS accepted_category_count
       FROM recycling_center_categories WHERE center_user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'RECEIVED') AS received_count,
         COUNT(*) FILTER (WHERE status = 'SORTED')   AS sorted_count,
         COUNT(*) FILTER (WHERE status = 'PROCESSED') AS processed_count,
         COALESCE(SUM(quantity_kg), 0) AS total_kg_all_time,
         COALESCE(SUM(quantity_kg) FILTER (WHERE received_at >= now() - INTERVAL '30 days'), 0) AS kg_last_30_days
       FROM intake_records WHERE center_user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT ir.id, ir.quantity_kg, ir.status, ir.received_at, ir.delivery_ref,
              wc.name AS category_name, wc.icon AS category_icon
       FROM intake_records ir
       JOIN waste_categories wc ON wc.id = ir.category_id
       WHERE ir.center_user_id = $1
       ORDER BY ir.received_at DESC LIMIT 5`,
      [userId]
    ),
  ]);

  const profile = profileResult.rows[0] || {};
  return {
    profile,
    accepted_category_count: parseInt(categoryResult.rows[0]?.accepted_category_count ?? '0', 10),
    intake_summary: intakeSummary.rows[0],
    recent_intake: recentIntake.rows,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function ensureProfileExists(userId: string) {
  await pool.query(
    `INSERT INTO recycling_center_profiles (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  const count = await pool.query(
    'SELECT 1 FROM recycling_center_categories WHERE center_user_id = $1 LIMIT 1',
    [userId]
  );
  if (count.rowCount === 0) {
    await pool.query(
      `INSERT INTO recycling_center_categories (center_user_id, category_id)
       SELECT $1, id FROM waste_categories WHERE is_active = true
       ON CONFLICT DO NOTHING`,
      [userId]
    );
  }
}
