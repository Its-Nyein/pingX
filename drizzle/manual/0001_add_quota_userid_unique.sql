-- 0001_add_quota_userid_unique
--
-- STATUS: NOT APPLIED. Review and run this yourself against Neon.
--
-- WHY
-- prisma/schema.prisma declares `Quota.userId @unique`, but no migration ever
-- created that index. 20250209165354_init omits it and 20250314102710_ only
-- touches "EventCategory". The live database is therefore missing the
-- constraint the application's quota upsert depends on: the upsert in
-- src/app/api/v1/events/route.ts uses ON CONFLICT ("userId"), and Postgres
-- raises 42P10 ("there is no unique or exclusion constraint matching the ON
-- CONFLICT specification") when no matching unique index exists.
--
-- This is additive. It creates an index and drops nothing.

-- ---------------------------------------------------------------------------
-- STEP 1 - PRE-CHECK. Run this first, on its own.
--
-- It must return ZERO rows. Any row here is a userId with more than one Quota
-- row, and STEP 2 will fail with a duplicate key error until it is resolved.
-- ---------------------------------------------------------------------------

-- SELECT "userId", COUNT(*) AS row_count
-- FROM "public"."Quota"
-- GROUP BY "userId"
-- HAVING COUNT(*) > 1
-- ORDER BY row_count DESC;

-- ---------------------------------------------------------------------------
-- STEP 2 - CREATE THE INDEX.
--
-- CONCURRENTLY avoids taking a write lock on "Quota", so this is safe to run
-- against production while the app is serving traffic.
--
-- IMPORTANT: CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- Run this statement by itself. If your SQL client wraps statements in an
-- implicit transaction (the Neon SQL Editor does this when you submit multiple
-- statements at once), submit this single statement alone, or drop the
-- CONCURRENTLY keyword and accept a brief exclusive lock - "Quota" is small.
--
-- If it fails, the index is left INVALID. Check with:
--   SELECT indexrelid::regclass, indisvalid FROM pg_index
--   WHERE indexrelid = '"Quota_userId_key"'::regclass;
-- and DROP INDEX "Quota_userId_key"; before retrying.
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "Quota_userId_key"
  ON "public"."Quota" ("userId");

-- ---------------------------------------------------------------------------
-- STEP 3 - VERIFY.
-- ---------------------------------------------------------------------------

-- SELECT indexrelid::regclass AS index_name, indisunique, indisvalid
-- FROM pg_index
-- WHERE indrelid = '"public"."Quota"'::regclass;

-- ---------------------------------------------------------------------------
-- STEP 4 - AFTER APPLYING
--
-- Add the constraint to the Drizzle schema so code and database stay in sync:
--
--   // src/db/schema/quotas.ts
--   userId: text("userId").notNull().unique("Quota_userId_key"),
--
-- Then run `npm run db:generate`. The resulting migration will be a no-op
-- against the database but keeps the snapshot honest.
-- ---------------------------------------------------------------------------
