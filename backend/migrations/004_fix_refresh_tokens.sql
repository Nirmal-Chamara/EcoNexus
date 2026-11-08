-- 004_fix_refresh_tokens.sql: Fix refresh_tokens schema compatibility

ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE refresh_tokens ALTER COLUMN family_id TYPE VARCHAR(100);

