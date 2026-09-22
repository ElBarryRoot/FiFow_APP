-- Fi Fow stores all text as UTF-8. Recover old mojibake only when its usual
-- markers are present; the helper leaves normal text untouched on any error.
CREATE OR REPLACE FUNCTION fifow_repair_utf8(value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF value IS NULL OR value !~ '(Ã|Â|â€)' THEN
    RETURN value;
  END IF;
  RETURN convert_from(convert_to(value, 'LATIN1'), 'UTF8');
EXCEPTION WHEN character_not_in_repertoire OR untranslatable_character THEN
  RETURN value;
END;
$$;

UPDATE products
SET title = fifow_repair_utf8(title), description = fifow_repair_utf8(description),
    commune = fifow_repair_utf8(commune), quartier = fifow_repair_utf8(quartier)
WHERE title ~ '(Ã|Â|â€)' OR description ~ '(Ã|Â|â€)' OR commune ~ '(Ã|Â|â€)' OR quartier ~ '(Ã|Â|â€)';

UPDATE messages SET text = fifow_repair_utf8(text) WHERE text ~ '(Ã|Â|â€)';
UPDATE notifications SET title = fifow_repair_utf8(title), body = fifow_repair_utf8(body)
WHERE title ~ '(Ã|Â|â€)' OR body ~ '(Ã|Â|â€)';
UPDATE reports SET description = fifow_repair_utf8(description), admin_decision = fifow_repair_utf8(admin_decision), admin_note = fifow_repair_utf8(admin_note)
WHERE description ~ '(Ã|Â|â€)' OR admin_decision ~ '(Ã|Â|â€)' OR admin_note ~ '(Ã|Â|â€)';
UPDATE support_ticket_messages SET message = fifow_repair_utf8(message) WHERE message ~ '(Ã|Â|â€)';

DROP FUNCTION fifow_repair_utf8(text);

-- Complements the trigram/full-text indexes with the filters used by catalogue
-- pages. All searches remain cursor-bounded by the application (maximum 50).
CREATE INDEX IF NOT EXISTS products_visible_category_subcategory_idx
  ON products (category_id, subcategory_id, published_at DESC, id DESC)
  WHERE archived_at IS NULL AND status = 'AVAILABLE' AND moderation_status = 'APPROVED';

CREATE INDEX IF NOT EXISTS products_visible_commune_idx
  ON products (lower(commune), published_at DESC, id DESC)
  WHERE archived_at IS NULL AND status = 'AVAILABLE' AND moderation_status = 'APPROVED';
