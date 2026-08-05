-- Expired offers cannot remain pending before the uniqueness invariant is installed.
UPDATE "offers"
SET
  "status" = 'EXPIRED',
  "responded_at" = COALESCE("responded_at", NOW()),
  "updated_at" = NOW()
WHERE "status" = 'PENDING'
  AND "expires_at" <= NOW();

-- Older duplicates may exist from requests that raced before conversation locking
-- was introduced. Keep the most recent pending offer and close the others.
WITH "ranked_pending_offers" AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "conversation_id"
      ORDER BY "created_at" DESC, "id" DESC
    ) AS "position"
  FROM "offers"
  WHERE "status" = 'PENDING'
)
UPDATE "offers"
SET
  "status" = 'WITHDRAWN',
  "responded_at" = COALESCE("responded_at", NOW()),
  "updated_at" = NOW()
WHERE "id" IN (
  SELECT "id"
  FROM "ranked_pending_offers"
  WHERE "position" > 1
);

CREATE UNIQUE INDEX "offers_one_pending_per_conversation_idx"
ON "offers"("conversation_id")
WHERE "status" = 'PENDING';
