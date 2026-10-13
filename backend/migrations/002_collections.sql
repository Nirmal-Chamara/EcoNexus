-- 002_collections.sql: Collector Profiles and Pickup Management Schema

-- 1. Collector Profiles Table
CREATE TABLE IF NOT EXISTS collector_profiles (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type      VARCHAR(50),                   -- e.g., 'TRUCK', 'VAN', 'BICYCLE'
  vehicle_capacity  DECIMAL(10,2),                 -- Capacity in kg or liters
  current_location  GEOMETRY(Point, 4326),         -- PostGIS location (Longitude, Latitude)
  service_area      GEOMETRY(Polygon, 4326),       -- Defined working area
  is_available      BOOLEAN DEFAULT false,         -- Is the collector currently accepting pickups?
  rating            DECIMAL(3,2) DEFAULT 0.00,
  completed_pickups INT DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collector_location ON collector_profiles USING GIST (current_location);

-- ENUM for pickup request status
DO $$ BEGIN
  CREATE TYPE pickup_status AS ENUM ('PENDING', 'ACCEPTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Pickup Requests Table
CREATE TABLE IF NOT EXISTS pickup_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_location   GEOMETRY(Point, 4326) NOT NULL, -- Where the waste is located
  address_text      TEXT NOT NULL,                  -- Human-readable address
  waste_type        VARCHAR(100) NOT NULL,          -- e.g., 'PLASTIC', 'ELECTRONIC', 'ORGANIC'
  estimated_weight  DECIMAL(10,2),                  -- Estimated weight in kg
  images            TEXT[],                         -- Array of image URLs
  status            pickup_status NOT NULL DEFAULT 'PENDING',
  notes             TEXT,                           -- Additional instructions from user
  scheduled_time    TIMESTAMPTZ,                    -- If the user scheduled it for the future
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pickup_location ON pickup_requests USING GIST (pickup_location);
CREATE INDEX IF NOT EXISTS idx_pickup_status ON pickup_requests (status);

-- 3. Pickup Allocations Table
-- Connects a collector to a pickup request
CREATE TABLE IF NOT EXISTS pickup_allocations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_request_id UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  collector_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  status            pickup_status NOT NULL DEFAULT 'ACCEPTED',
  completed_at      TIMESTAMPTZ,
  UNIQUE(pickup_request_id, collector_id)
);
