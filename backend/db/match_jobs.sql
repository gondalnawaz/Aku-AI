
-- ----------------------------
-- Table structure for match_jobs
-- ----------------------------
DROP TABLE IF EXISTS "public"."match_jobs";
CREATE TABLE "public"."match_jobs" (
  "id" uuid NOT NULL,
  "user_email" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "file_url" varchar COLLATE "pg_catalog"."default",
  "file_name" varchar COLLATE "pg_catalog"."default",
  "file_type" varchar COLLATE "pg_catalog"."default",
  "service_speed" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar COLLATE "pg_catalog"."default",
  "stripe_session_id" varchar COLLATE "pg_catalog"."default",
  "price_paid" float8,
  "result_url" varchar COLLATE "pg_catalog"."default",
  "notes" text COLLATE "pg_catalog"."default",
  "currency" varchar COLLATE "pg_catalog"."default",
  "language" varchar COLLATE "pg_catalog"."default",
  "created_date" timestamptz(6),
  "updated_date" timestamptz(6),
  "completed_at" timestamptz(6),
  "failure_reason" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Indexes structure for table match_jobs
-- ----------------------------
CREATE INDEX "ix_match_jobs_user_email" ON "public"."match_jobs" USING btree (
  "user_email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table match_jobs
-- ----------------------------
ALTER TABLE "public"."match_jobs" ADD CONSTRAINT "match_jobs_pkey" PRIMARY KEY ("id");
