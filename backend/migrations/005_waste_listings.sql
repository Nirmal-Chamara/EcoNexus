-- 005_waste_listings.sql: Waste Categories and Listings Schema

CREATE TABLE IF NOT EXISTS waste_categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(50),
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default categories if empty
INSERT INTO waste_categories (name, description, icon, sort_order) VALUES
  ('Plastic', 'Bottles, containers, bags, polymers', '🧴', 1),
  ('Paper', 'Newspapers, books, clean office paper', '📄', 2),
  ('Cardboard', 'Corrugated boxes, packaging cartons', '📦', 3),
  ('Metal', 'Aluminium cans, tins, scrap metals', '🥫', 4),
  ('Glass', 'Bottles, jars, glassware', '🍾', 5),
  ('E-Waste', 'Batteries, electronics, cables', '💻', 6),
  ('Textiles', 'Old clothes, fabrics, clean garments', '👕', 7)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS waste_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_code    VARCHAR(50),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     INT NOT NULL REFERENCES waste_categories(id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  quantity        DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit            VARCHAR(20) NOT NULL DEFAULT 'kg',
  condition       VARCHAR(50) NOT NULL DEFAULT 'clean',
  container_size  VARCHAR(50),
  is_cleaned      BOOLEAN NOT NULL DEFAULT FALSE,
  is_sorted       BOOLEAN NOT NULL DEFAULT FALSE,
  pathway         VARCHAR(50) NOT NULL DEFAULT 'recycle',
  status          VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waste_listings_user ON waste_listings (user_id);
CREATE INDEX IF NOT EXISTS idx_waste_listings_status ON waste_listings (status);

CREATE TABLE IF NOT EXISTS waste_images (
  id          SERIAL PRIMARY KEY,
  listing_id  UUID NOT NULL REFERENCES waste_listings(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  label       VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pickup_request_items (
  request_id  UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES waste_listings(id) ON DELETE CASCADE,
  PRIMARY KEY (request_id, listing_id)
);

CREATE TABLE IF NOT EXISTS pickup_request_events (
  id          SERIAL PRIMARY KEY,
  request_id  UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  status      VARCHAR(50) NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

