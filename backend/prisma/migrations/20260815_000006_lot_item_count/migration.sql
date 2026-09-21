ALTER TABLE "products"
  ADD COLUMN "lot_item_count" INTEGER;

ALTER TABLE "products"
  ADD CONSTRAINT "products_lot_item_count_check"
  CHECK (
    (
      "listing_mode" = 'LOT'
      AND (
        "lot_item_count" IS NULL
        OR "lot_item_count" BETWEEN 2 AND 10000
      )
    )
    OR (
      "listing_mode" <> 'LOT'
      AND "lot_item_count" IS NULL
    )
  );

COMMENT ON COLUMN "products"."lot_item_count" IS
  'Nombre d articles contenus dans un lot vendu comme une seule unite. NULL hors mode LOT.';
