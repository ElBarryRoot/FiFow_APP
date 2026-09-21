-- Fast public catalogue search without changing the application contract.
-- pg_trgm accelerates the existing case-insensitive contains queries while the
-- tsvector index is ready for future ranking/autocomplete queries.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS products_title_trgm_idx
  ON products USING GIN (lower(title) gin_trgm_ops)
  WHERE archived_at IS NULL AND status = 'AVAILABLE' AND moderation_status = 'APPROVED';

CREATE INDEX IF NOT EXISTS products_description_trgm_idx
  ON products USING GIN (lower(description) gin_trgm_ops)
  WHERE archived_at IS NULL AND status = 'AVAILABLE' AND moderation_status = 'APPROVED';

CREATE INDEX IF NOT EXISTS products_search_fts_idx
  ON products USING GIN (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
  )
  WHERE archived_at IS NULL AND status = 'AVAILABLE' AND moderation_status = 'APPROVED';
