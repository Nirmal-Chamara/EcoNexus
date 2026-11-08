BEGIN;

-- 1. Categories: the seven from the proposal, in design order
ALTER TABLE waste_categories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

INSERT INTO waste_categories (name, description, sort_order) VALUES
  ('Plastic',   'PET, HDPE, bottles',                  1),
  ('Paper',     'Newspaper, magazines, office paper',  2),
  ('Cardboard', 'Boxes, cartons',                      3),
  ('Metal',     'Aluminium, steel, cans',              4),
  ('Glass',     'Bottles, jars',                       5),
  ('E-Waste',   'Cables, gadgets',                     6),
  ('Textiles',  'Clothes, fabric',                     7)
ON CONFLICT (name) DO UPDATE
  SET description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order,
      is_active   = TRUE;

-- Not in the proposal: hide it (kept, so old listings still work)
UPDATE waste_categories SET is_active = FALSE WHERE name = 'Reusable Items';

-- 2. Listings: fields the design adds
CREATE SEQUENCE IF NOT EXISTS waste_listing_code_seq START 4001;

ALTER TABLE waste_listings
  ADD COLUMN IF NOT EXISTS listing_code TEXT UNIQUE
    DEFAULT ('WL-' || nextval('waste_listing_code_seq')),
  ADD COLUMN IF NOT EXISTS container_size VARCHAR(10)
    CHECK (container_size IN ('small','medium','bulk')),
  ADD COLUMN IF NOT EXISTS is_cleaned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_sorted  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pathway VARCHAR(10) NOT NULL DEFAULT 'recycle'
    CHECK (pathway IN ('recycle','sell','donate','reuse'));

ALTER TABLE waste_images ADD COLUMN IF NOT EXISTS label VARCHAR(30);

ALTER TABLE waste_listings DROP CONSTRAINT IF EXISTS waste_listings_status_check;
ALTER TABLE waste_listings ADD CONSTRAINT waste_listings_status_check
  CHECK (status IN ('draft','active','requested','scheduled','collected','cancelled'));

-- 3. Requests can cover several listings
CREATE TABLE IF NOT EXISTS pickup_request_items (
  request_id UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES waste_listings(id) ON DELETE CASCADE,
  PRIMARY KEY (request_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_pickup_request_items_listing
  ON pickup_request_items(listing_id);

DROP INDEX IF EXISTS uq_pickup_requests_open_listing;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'pickup_requests' AND column_name = 'listing_id') THEN
    INSERT INTO pickup_request_items (request_id, listing_id)
      SELECT id, listing_id FROM pickup_requests
      ON CONFLICT DO NOTHING;
    ALTER TABLE pickup_requests DROP COLUMN listing_id;
  END IF;
END $$;

-- 4. Requests: schedule, map point, collector choice
ALTER TABLE pickup_requests
  ADD COLUMN IF NOT EXISTS pickup_location geography(Point,4326),
  ADD COLUMN IF NOT EXISTS pickup_date DATE,
  ADD COLUMN IF NOT EXISTS time_slot VARCHAR(10)
    CHECK (time_slot IN ('morning','afternoon','evening')),
  ADD COLUMN IF NOT EXISTS dispatch_mode VARCHAR(10) NOT NULL DEFAULT 'smart'
    CHECK (dispatch_mode IN ('smart','specific')),
  ADD COLUMN IF NOT EXISTS preferred_collector_id UUID;

ALTER TABLE pickup_requests DROP CONSTRAINT IF EXISTS pickup_requests_status_check;
ALTER TABLE pickup_requests ADD CONSTRAINT pickup_requests_status_check
  CHECK (status IN ('pending','accepted','en_route','weighing','in_progress','completed','cancelled'));

-- 5. Progress timeline for the Live Pickup Track screen
CREATE TABLE IF NOT EXISTS pickup_request_events (
  id SERIAL PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pickup_request_events_request
  ON pickup_request_events(request_id, created_at);

INSERT INTO pickup_request_events (request_id, status, created_at)
SELECT r.id, 'pending', r.created_at FROM pickup_requests r
WHERE NOT EXISTS (SELECT 1 FROM pickup_request_events e WHERE e.request_id = r.id);

COMMIT;