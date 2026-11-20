-- 008_recycling_centers.sql: Recycling Center Profiles, Categories, Intake and Processing Schema

-- 1. Recycling Center Profiles
CREATE TABLE IF NOT EXISTS recycling_center_profiles (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(150),
  registration_no   VARCHAR(100),
  contact_phone     VARCHAR(20),
  address_text      TEXT,
  total_capacity_kg DECIMAL(12,2) DEFAULT 0,
  current_intake_kg DECIMAL(12,2) DEFAULT 0,
  document_url      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Many-to-many: center <-> waste_categories
CREATE TABLE IF NOT EXISTS recycling_center_categories (
  center_user_id UUID NOT NULL REFERENCES recycling_center_profiles(user_id) ON DELETE CASCADE,
  category_id    INT  NOT NULL REFERENCES waste_categories(id) ON DELETE CASCADE,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (center_user_id, category_id)
);

-- 3. Intake Records (incoming material deliveries)
CREATE TABLE IF NOT EXISTS intake_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_user_id  UUID NOT NULL REFERENCES recycling_center_profiles(user_id) ON DELETE CASCADE,
  category_id     INT  NOT NULL REFERENCES waste_categories(id),
  quantity_kg     DECIMAL(10,2) NOT NULL CHECK (quantity_kg > 0),
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_ref    VARCHAR(100),
  notes           TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED','SORTED','PROCESSED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_center ON intake_records(center_user_id);
CREATE INDEX IF NOT EXISTS idx_intake_status ON intake_records(status);
CREATE INDEX IF NOT EXISTS idx_intake_received_at ON intake_records(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_rc_categories_center ON recycling_center_categories(center_user_id);
