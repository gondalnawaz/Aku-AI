
-- ----------------------------
-- Table structure for point_ledger
-- ----------------------------
DROP TABLE IF EXISTS "public"."point_ledger";
CREATE TABLE "public"."point_ledger" (
  "id" int4 NOT NULL DEFAULT nextval('point_ledger_id_seq'::regclass),
  "user_email" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "delta" int4 NOT NULL,
  "reason" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "job_id" varchar COLLATE "pg_catalog"."default",
  "payment_id" int4,
  "balance_after" int4 NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Indexes structure for table point_ledger
-- ----------------------------
CREATE INDEX "idx_ledger_job_id" ON "public"."point_ledger" USING btree (
  "job_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_ledger_payment_id" ON "public"."point_ledger" USING btree (
  "payment_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_ledger_user_email" ON "public"."point_ledger" USING btree (
  "user_email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table point_ledger
-- ----------------------------
ALTER TABLE "public"."point_ledger" ADD CONSTRAINT "point_ledger_pkey" PRIMARY KEY ("id");
