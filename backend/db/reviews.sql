
-- ----------------------------
-- Table structure for reviews
-- ----------------------------
DROP TABLE IF EXISTS "public"."reviews";
CREATE TABLE "public"."reviews" (
  "id" int4 NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  "rating" int4 NOT NULL,
  "comment" text COLLATE "pg_catalog"."default" NOT NULL,
  "job_id" varchar COLLATE "pg_catalog"."default",
  "page" varchar COLLATE "pg_catalog"."default",
  "language" varchar COLLATE "pg_catalog"."default",
  "ip" varchar COLLATE "pg_catalog"."default",
  "user_agent" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at_idx" timestamp(6),
  "job_id_idx" varchar COLLATE "pg_catalog"."default",
  "user_id" varchar COLLATE "pg_catalog"."default",
  "user_name" varchar COLLATE "pg_catalog"."default",
  "user_email" varchar COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Indexes structure for table reviews
-- ----------------------------
CREATE INDEX "idx_reviews_created_at" ON "public"."reviews" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_reviews_job_id" ON "public"."reviews" USING btree (
  "job_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_reviews_user_email" ON "public"."reviews" USING btree (
  "user_email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_reviews_user_id" ON "public"."reviews" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Checks structure for table reviews
-- ----------------------------
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_rating_check" CHECK (rating >= 1 AND rating <= 5);

-- ----------------------------
-- Primary Key structure for table reviews
-- ----------------------------
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");
