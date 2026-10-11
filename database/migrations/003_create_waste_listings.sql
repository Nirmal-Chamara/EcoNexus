CREATE TABLE IF NOT EXISTS waste_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id INT NOT NULL REFERENCES waste_categories(id),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(10) NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg','items')),
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('clean','dirty','damaged','reusable')),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','requested','collected','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waste_listings_user ON waste_listings(user_id, status);

CREATE TABLE IF NOT EXISTS waste_images (
  id SERIAL PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES waste_listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL
);
