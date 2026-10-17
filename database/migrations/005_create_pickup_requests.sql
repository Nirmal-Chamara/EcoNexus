CREATE TABLE IF NOT EXISTS pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES waste_listings(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  collector_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','in_progress','completed','cancelled')),
  pickup_address TEXT NOT NULL,
  preferred_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_requests_requester ON pickup_requests(requester_id, status);

-- A listing can have only one open request at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_pickup_requests_open_listing
  ON pickup_requests(listing_id)
  WHERE status IN ('pending','accepted','in_progress');