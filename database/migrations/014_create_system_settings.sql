-- ============================================================================
-- 014_create_system_settings.sql
-- Admin-tunable configuration (admin SettingsScreen). The proposal leaves the
-- matching weights "to be determined during implementation", so they live here
-- instead of being hard-coded in backend/src/algorithms/matching/scoring.ts.
-- ============================================================================

CREATE TABLE system_settings (
    key          TEXT PRIMARY KEY,
    value        JSONB NOT NULL,
    description  TEXT,
    updated_by   UUID REFERENCES users(id),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
