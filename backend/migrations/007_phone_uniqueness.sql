-- Keep existing values; refuse ambiguous legacy collisions instead of choosing an owner.
-- Run the read-only phone audit and resolve collisions before applying this index.
CREATE UNIQUE INDEX idx_users_phone_international
  ON users ((regexp_replace(phone, '[[:space:]()-]', '', 'g')))
  WHERE phone IS NOT NULL
    AND regexp_replace(phone, '[[:space:]()-]', '', 'g') ~ '^\+[1-9][0-9]{1,14}$';
