-- P17 BE Track 2 / Aşama 3 — SAFE-ONLINE companion to migration.sql.
-- ────────────────────────────────────────────────────────────────────
-- Apply this manually inside a maintenance window for a hot production
-- DB. CONCURRENTLY cannot run inside a transaction, so Prisma's runner
-- (which wraps every migration in BEGIN/COMMIT) cannot use it — hence
-- this side-car file. Recommended sequence:
--
--   psql -h ... -U ... -d ecypro -v ON_ERROR_STOP=1 -f online.sql
--
-- The companion `migration.sql` MUST already have been applied (so the
-- columns and trigger exist). This file only re-creates the GIN indexes
-- using CONCURRENTLY semantics.

-- The columns + trigger are created in migration.sql. Re-running them
-- here is harmless because everything is IF NOT EXISTS / OR REPLACE.

-- Drop the BEGIN/COMMIT-wrapped indexes first if they exist, then
-- rebuild concurrently. The reindex window is open just long enough for
-- the GIN swap.
DROP INDEX IF EXISTS "services_searchVectorTr_idx";
DROP INDEX IF EXISTS "services_searchVectorEn_idx";

CREATE INDEX CONCURRENTLY IF NOT EXISTS "services_searchVectorTr_idx"
  ON "services" USING GIN ("searchVectorTr");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "services_searchVectorEn_idx"
  ON "services" USING GIN ("searchVectorEn");
