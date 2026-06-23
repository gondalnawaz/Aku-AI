
-- ----------------------------
-- Table structure for payments
-- ----------------------------
DROP TABLE IF EXISTS "public"."payments";
CREATE TABLE "public"."payments" (
  "id" int4 NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
  "user_email" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "plan_key" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "currency" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "expected_amount_minor" int8 NOT NULL,
  "paid_amount_minor" int8,
  "points_to_credit" int4 NOT NULL,
  "status" varchar COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'pending'::character varying,
  "stripe_session_id" varchar COLLATE "pg_catalog"."default",
  "stripe_payment_intent" varchar COLLATE "pg_catalog"."default",
  "failure_reason" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  "stripe_invoice_id" varchar COLLATE "pg_catalog"."default",
  "stripe_customer_id" varchar COLLATE "pg_catalog"."default",
  "stripe_subscription_id" varchar COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Indexes structure for table payments
-- ----------------------------
CREATE INDEX "idx_payments_plan_key" ON "public"."payments" USING btree (
  "plan_key" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payments_status" ON "public"."payments" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payments_stripe_customer_id" ON "public"."payments" USING btree (
  "stripe_customer_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "idx_payments_stripe_invoice_id" ON "public"."payments" USING btree (
  "stripe_invoice_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payments_stripe_payment_intent" ON "public"."payments" USING btree (
  "stripe_payment_intent" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payments_stripe_session_id" ON "public"."payments" USING btree (
  "stripe_session_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payments_stripe_subscription_id" ON "public"."payments" USING btree (
  "stripe_subscription_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_payments_user_email" ON "public"."payments" USING btree (
  "user_email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table payments
-- ----------------------------
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_stripe_session_id_key" UNIQUE ("stripe_session_id");

-- ----------------------------
-- Primary Key structure for table payments
-- ----------------------------
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");
