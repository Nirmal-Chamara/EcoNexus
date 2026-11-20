-- Existing addresses remain unverified until ownership is proved. No false backfill.
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;

CREATE TABLE email_verification_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_email_verification_user ON email_verification_tokens(user_id);

CREATE TABLE email_outbox (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('VERIFY_EMAIL', 'RESET_PASSWORD')),
  challenge_hash CHAR(64) NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('resend', 'smtp')),
  payload JSONB NOT NULL, -- AES-256-GCM envelope; never a plaintext token
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SENT','FAILED','CANCELLED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  provider_id TEXT,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX idx_email_outbox_pending ON email_outbox(status, available_at);
CREATE INDEX idx_email_outbox_user ON email_outbox(user_id, purpose);

-- Invalidate pre-upgrade reset codes, including formerly exposed development codes.
UPDATE password_reset_tokens SET used_at = NOW() WHERE used_at IS NULL;
