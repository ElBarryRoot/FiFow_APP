CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'WAITING_FOR_USER', 'RESOLVED', 'REJECTED');
CREATE TYPE "DisputeResolution" AS ENUM ('REFUND_FULL', 'REFUND_PARTIAL', 'RELEASE_PAYOUT', 'NO_ACTION');

CREATE TABLE "dispute_cases" (
  "id" UUID NOT NULL,
  "reference" VARCHAR(40) NOT NULL,
  "order_id" UUID NOT NULL,
  "payment_id" UUID,
  "opened_by_id" UUID NOT NULL,
  "assigned_to_id" UUID,
  "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "reason" VARCHAR(1200) NOT NULL,
  "resolution" "DisputeResolution",
  "resolution_note" VARCHAR(1200),
  "refund_amount" BIGINT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "dispute_cases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "dispute_cases_reference_key" ON "dispute_cases"("reference");
CREATE UNIQUE INDEX "dispute_cases_order_id_key" ON "dispute_cases"("order_id");
CREATE INDEX "dispute_cases_status_created_at_idx" ON "dispute_cases"("status", "created_at");
CREATE INDEX "dispute_cases_payment_id_status_idx" ON "dispute_cases"("payment_id", "status");
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
