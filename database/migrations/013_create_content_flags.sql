-- ============================================================================
-- 013_create_content_flags.sql
-- FR28 administrators moderate flagged listings (waste + reuse listings)
-- ============================================================================

CREATE TABLE content_flags (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type      TEXT NOT NULL CHECK (target_type IN ('waste_listing', 'reuse_listing')),
    target_id        UUID NOT NULL,           -- polymorphic; validated in the service layer
    reason           TEXT NOT NULL CHECK (reason IN ('spam', 'prohibited_item', 'misleading', 'inappropriate', 'other')),
    details          TEXT,
    status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'actioned')),
    reviewed_by      UUID REFERENCES users(id),
    reviewed_at      TIMESTAMPTZ,
    resolution_note  TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX idx_flags_queue  ON content_flags (status, created_at) WHERE status = 'open';
CREATE INDEX idx_flags_target ON content_flags (target_type, target_id);
