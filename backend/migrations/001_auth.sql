-- 001_auth.sql: User Management, Authentication & RBAC Schema

CREATE EXTENSION IF NOT EXISTS citext;      -- Case-insensitive email support
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- UUID generation helpers

-- ENUM Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('USER', 'COLLECTOR', 'RECYCLING_CENTER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'REJECTED', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  email          CITEXT UNIQUE NOT NULL,
  phone          VARCHAR(20) UNIQUE,
  password_hash  TEXT NOT NULL,
  role           user_role NOT NULL DEFAULT 'USER',
  status         account_status NOT NULL DEFAULT 'ACTIVE',
  address_text   TEXT,
  avatar_url     TEXT,
  token_version  INT NOT NULL DEFAULT 0,       -- Incremented to invalidate active access tokens
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Refresh Tokens Table (Token Family Rotation & Reuse Detection)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,            -- SHA-256 hash of the raw token string
  family_id   UUID NOT NULL,                   -- All token rotations within one login session share family_id
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  replaced_by UUID,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_family ON refresh_tokens(family_id);

-- 3. Verification Requests Table (Collector & Recycling Center Approval Queue)
CREATE TABLE IF NOT EXISTS verification_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_role    user_role NOT NULL CHECK (requested_role IN ('COLLECTOR','RECYCLING_CENTER')),
  organization_name VARCHAR(150),
  registration_no   VARCHAR(100),
  document_url      TEXT,                      -- Uploaded credential / business registration document
  status            verification_status NOT NULL DEFAULT 'PENDING',
  reviewed_by       UUID REFERENCES users(id),
  review_note       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_requests(status);

-- 4. Audit Logs Table (Admin Actions & Security Events)
CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  actor_id   UUID REFERENCES users(id),
  action     VARCHAR(60) NOT NULL,             -- e.g., 'USER_SUSPENDED', 'COLLECTOR_APPROVED'
  target_id  UUID,
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
