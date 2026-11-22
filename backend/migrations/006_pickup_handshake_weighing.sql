-- 006_pickup_handshake_weighing.sql: Handshake PIN & Verified Weighing Schema

ALTER TABLE pickup_requests
  ADD COLUMN IF NOT EXISTS verification_pin VARCHAR(4) DEFAULT LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0'),
  ADD COLUMN IF NOT EXISTS actual_weight DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS weighed_materials JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scale_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS payout_amount DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS points_awarded INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Backfill any existing requests that have null PIN
UPDATE pickup_requests
SET verification_pin = LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0')
WHERE verification_pin IS NULL;

-- Index for fast lookup by verification PIN
CREATE INDEX IF NOT EXISTS idx_pickup_requests_pin ON pickup_requests (id, verification_pin);
