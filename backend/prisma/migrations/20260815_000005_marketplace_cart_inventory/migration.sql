-- Sprint 1/2 marketplace foundations: persistent carts, multi-line seller
-- orders and explicit inventory. The legacy single-product columns remain in
-- place during the compatibility window and are mirrored into line tables.

CREATE TYPE "ListingMode" AS ENUM ('SINGLE', 'STOCK', 'LOT');
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONSUMED');

ALTER TABLE "users"
  ADD COLUMN "can_manage_stock" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "products"
  ADD COLUMN "listing_mode" "ListingMode" NOT NULL DEFAULT 'SINGLE',
  ADD COLUMN "stock_quantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "reserved_quantity" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "carts" (
  "id" UUID NOT NULL,
  "buyer_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cart_items" (
  "id" UUID NOT NULL,
  "cart_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit_price_at_addition" BIGINT NOT NULL,
  "currency" "Currency" NOT NULL DEFAULT 'GNF',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "checkout_quote_items" (
  "id" UUID NOT NULL,
  "quote_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "offer_id" UUID,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit_price" BIGINT NOT NULL,
  "line_total" BIGINT NOT NULL,
  "product_snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "checkout_quote_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit_price" BIGINT NOT NULL,
  "line_total" BIGINT NOT NULL,
  "product_snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_reservations" (
  "id" UUID NOT NULL,
  "order_item_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "released_at" TIMESTAMP(3),
  "consumed_at" TIMESTAMP(3),
  "release_reason" VARCHAR(160),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "carts_buyer_id_key" ON "carts"("buyer_id");
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id");
CREATE INDEX "cart_items_cart_id_created_at_idx" ON "cart_items"("cart_id", "created_at");
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");
CREATE UNIQUE INDEX "checkout_quote_items_quote_id_product_id_key"
  ON "checkout_quote_items"("quote_id", "product_id");
CREATE INDEX "checkout_quote_items_product_id_quote_id_idx"
  ON "checkout_quote_items"("product_id", "quote_id");
CREATE UNIQUE INDEX "order_items_order_id_product_id_key" ON "order_items"("order_id", "product_id");
CREATE INDEX "order_items_product_id_order_id_idx" ON "order_items"("product_id", "order_id");
CREATE UNIQUE INDEX "inventory_reservations_order_item_id_key"
  ON "inventory_reservations"("order_item_id");
CREATE INDEX "inventory_reservations_status_expires_at_idx"
  ON "inventory_reservations"("status", "expires_at");
CREATE INDEX "inventory_reservations_product_id_status_idx"
  ON "inventory_reservations"("product_id", "status");

ALTER TABLE "carts" ADD CONSTRAINT "carts_buyer_id_fkey"
  FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey"
  FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checkout_quote_items" ADD CONSTRAINT "checkout_quote_items_quote_id_fkey"
  FOREIGN KEY ("quote_id") REFERENCES "checkout_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checkout_quote_items" ADD CONSTRAINT "checkout_quote_items_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checkout_quote_items" ADD CONSTRAINT "checkout_quote_items_offer_id_fkey"
  FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_item_id_fkey"
  FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_inventory_values_check" CHECK (
  "stock_quantity" >= 0 AND "reserved_quantity" >= 0 AND "reserved_quantity" <= "stock_quantity"
);
ALTER TABLE "products" ADD CONSTRAINT "products_listing_mode_inventory_check" CHECK (
  "listing_mode" = 'STOCK' OR ("stock_quantity" <= 1 AND "reserved_quantity" <= 1)
);
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_quantity_check" CHECK (
  "quantity" BETWEEN 1 AND 99 AND "unit_price_at_addition" >= 0
);
ALTER TABLE "checkout_quote_items" ADD CONSTRAINT "checkout_quote_items_amounts_check" CHECK (
  "quantity" BETWEEN 1 AND 99 AND "unit_price" >= 0 AND "line_total" = "unit_price" * "quantity"
);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_amounts_check" CHECK (
  "quantity" BETWEEN 1 AND 99 AND "unit_price" >= 0 AND "line_total" = "unit_price" * "quantity"
);
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_quantity_check"
  CHECK ("quantity" BETWEEN 1 AND 99);

-- Existing immutable quotes and orders become one-line records. md5 produces a
-- stable UUID-shaped identifier, making this data migration safely repeatable
-- when inspected or replayed in a disposable environment.
INSERT INTO "checkout_quote_items" (
  "id", "quote_id", "product_id", "offer_id", "quantity", "unit_price",
  "line_total", "product_snapshot", "created_at"
)
SELECT
  md5(q."id"::text || ':quote-item')::uuid,
  q."id",
  q."product_id",
  q."offer_id",
  1,
  q."item_amount",
  q."item_amount",
  jsonb_build_object(
    'id', p."id",
    'title', p."title",
    'slug', p."slug",
    'price', q."item_amount"::text,
    'currency', q."currency"::text,
    'listingMode', p."listing_mode"::text
  ),
  q."created_at"
FROM "checkout_quotes" q
JOIN "products" p ON p."id" = q."product_id";

INSERT INTO "order_items" (
  "id", "order_id", "product_id", "quantity", "unit_price", "line_total",
  "product_snapshot", "created_at"
)
SELECT
  md5(o."id"::text || ':order-item')::uuid,
  o."id",
  o."product_id",
  1,
  o."item_amount",
  o."item_amount",
  o."product_snapshot",
  o."created_at"
FROM "orders" o;

INSERT INTO "inventory_reservations" (
  "id", "order_item_id", "product_id", "quantity", "status", "expires_at",
  "released_at", "consumed_at", "release_reason", "created_at", "updated_at"
)
SELECT
  md5(oi."id"::text || ':reservation')::uuid,
  oi."id",
  oi."product_id",
  oi."quantity",
  CASE
    WHEN o."status" IN ('AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT')
      THEN 'ACTIVE'::"InventoryReservationStatus"
    WHEN o."status" IN ('CANCELLED', 'REFUNDED')
      THEN 'RELEASED'::"InventoryReservationStatus"
    ELSE 'CONSUMED'::"InventoryReservationStatus"
  END,
  COALESCE(o."payment_expires_at", o."seller_confirmation_expires_at", o."updated_at"),
  CASE WHEN o."status" IN ('CANCELLED', 'REFUNDED') THEN COALESCE(o."cancelled_at", o."updated_at") END,
  CASE WHEN o."status" NOT IN ('AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT', 'CANCELLED', 'REFUNDED')
    THEN COALESCE(o."paid_at", o."updated_at") END,
  CASE WHEN o."status" IN ('CANCELLED', 'REFUNDED') THEN 'LEGACY_ORDER_CLOSED' END,
  o."created_at",
  o."updated_at"
FROM "order_items" oi
JOIN "orders" o ON o."id" = oi."order_id";

UPDATE "products" p
SET "reserved_quantity" = 1
WHERE EXISTS (
  SELECT 1
  FROM "inventory_reservations" r
  WHERE r."product_id" = p."id" AND r."status" = 'ACTIVE'
);

UPDATE "products" p
SET "stock_quantity" = 0,
    "reserved_quantity" = 0
WHERE EXISTS (
  SELECT 1
  FROM "inventory_reservations" r
  WHERE r."product_id" = p."id" AND r."status" = 'CONSUMED'
);

-- A product can now appear in concurrent orders when it is explicitly a stock
-- listing. Row locks and inventory reservations replace the old one-order-only
-- partial index without weakening single-item protection.
DROP INDEX IF EXISTS "orders_one_active_per_product_idx";
