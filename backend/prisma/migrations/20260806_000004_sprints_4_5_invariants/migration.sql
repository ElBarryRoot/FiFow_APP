-- Immutable checkout and fulfillment snapshots.
ALTER TABLE "checkout_quotes" ADD COLUMN "handover_details" JSONB;
ALTER TABLE "orders" ADD COLUMN "handover_details" JSONB;
ALTER TABLE "orders" ADD COLUMN "idempotency_key" VARCHAR(120);
ALTER TABLE "orders" ADD COLUMN "seller_confirmation_expires_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "payment_expires_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");
CREATE INDEX "orders_seller_confirmation_expires_at_idx" ON "orders"("seller_confirmation_expires_at") WHERE "status" = 'AWAITING_SELLER_CONFIRMATION';
CREATE INDEX "orders_payment_expires_at_idx" ON "orders"("payment_expires_at") WHERE "status" = 'AWAITING_PAYMENT';

-- Support workflow.
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(40) NOT NULL,
    "requester_id" UUID NOT NULL,
    "assigned_to_id" UUID,
    "topic" VARCHAR(80) NOT NULL,
    "subject" VARCHAR(160) NOT NULL,
    "related_reference" VARCHAR(120),
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_ticket_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "message" VARCHAR(3000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_tickets_reference_key" ON "support_tickets"("reference");
CREATE INDEX "support_tickets_requester_id_updated_at_idx" ON "support_tickets"("requester_id", "updated_at" DESC);
CREATE INDEX "support_tickets_status_priority_updated_at_idx" ON "support_tickets"("status", "priority", "updated_at" DESC);
CREATE INDEX "support_tickets_assigned_to_id_status_updated_at_idx" ON "support_tickets"("assigned_to_id", "status", "updated_at" DESC);
CREATE INDEX "support_ticket_messages_ticket_id_created_at_id_idx" ON "support_ticket_messages"("ticket_id", "created_at", "id");

ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_requester_id_fkey"
  FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_fkey"
  FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey"
  FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Database-level marketplace invariants. Application checks provide friendly
-- errors; these indexes remain the final protection under concurrency.
CREATE UNIQUE INDEX "orders_one_active_per_product_idx"
  ON "orders" ("product_id")
  WHERE "status" IN (
    'AWAITING_SELLER_CONFIRMATION', 'AWAITING_PAYMENT', 'PAID', 'RESERVED',
    'PREPARING', 'READY_FOR_HANDOVER', 'IN_DELIVERY', 'RECEIVED', 'DISPUTED'
  );

CREATE UNIQUE INDEX "payments_one_active_per_order_idx"
  ON "payments" ("order_id")
  WHERE "order_id" IS NOT NULL AND "status" IN ('CREATED', 'PROCESSING');

CREATE UNIQUE INDEX "boosts_one_active_per_product_idx"
  ON "boosts" ("product_id")
  WHERE "archived_at" IS NULL AND "status" IN ('PENDING_PAYMENT', 'ACTIVE');

CREATE UNIQUE INDEX "refunds_one_active_per_payment_idx"
  ON "refunds" ("payment_id")
  WHERE "status" IN ('REQUESTED', 'PROCESSING');

ALTER TABLE "orders" ADD CONSTRAINT "orders_participants_differ_check" CHECK ("buyer_id" <> "seller_id");
ALTER TABLE "checkout_quotes" ADD CONSTRAINT "checkout_quotes_amounts_check" CHECK (
  "item_amount" >= 0 AND "buyer_protection_fee" >= 0 AND "delivery_fee" >= 0 AND
  "discount_amount" >= 0 AND "seller_net_amount" >= 0 AND
  "total_amount" = "item_amount" + "buyer_protection_fee" + "delivery_fee" - "discount_amount"
);
ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_check" CHECK (
  "item_amount" >= 0 AND "buyer_protection_fee" >= 0 AND "delivery_fee" >= 0 AND
  "discount_amount" >= 0 AND "seller_net_amount" >= 0 AND
  "total_amount" = "item_amount" + "buyer_protection_fee" + "delivery_fee" - "discount_amount"
);
ALTER TABLE "payments" ADD CONSTRAINT "payments_positive_amount_check" CHECK ("amount" > 0);
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_positive_amount_check" CHECK ("amount" > 0);
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_non_negative_amount_check" CHECK ("amount" >= 0);
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_non_negative_amount_check" CHECK ("amount" >= 0);
ALTER TABLE "boost_plans" ADD CONSTRAINT "boost_plans_values_check" CHECK ("duration_hours" > 0 AND "price" > 0);
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_ratings_check" CHECK (
  "rating" BETWEEN 1 AND 5 AND
  ("communication_rating" IS NULL OR "communication_rating" BETWEEN 1 AND 5) AND
  ("product_accuracy_rating" IS NULL OR "product_accuracy_rating" BETWEEN 1 AND 5) AND
  ("behavior_rating" IS NULL OR "behavior_rating" BETWEEN 1 AND 5)
);
