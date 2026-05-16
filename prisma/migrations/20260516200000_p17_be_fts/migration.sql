-- P17 BE Track 2 / Aşama 3 — Postgres Full-Text Search infrastructure.
-- ────────────────────────────────────────────────────────────────────
-- Additive, idempotent. Safe to re-run on a populated DB.
--
-- What this migration does:
--   1. Adds `searchVectorTr` and `searchVectorEn` tsvector columns to
--      the `services` table.
--   2. Creates a trigger that keeps the columns in sync with the source
--      titles/descriptions on INSERT and UPDATE.
--   3. Creates GIN indexes over both vectors so `@@` queries are
--      sub-millisecond even at million-row scale.
--   4. Backfills existing rows so the search endpoint works against
--      every row in the table the moment the migration completes.
--
-- Dictionary choice:
--   - 'english' for the EN copy — standard Porter stemmer.
--   - 'simple' for the TR copy. Postgres ships a Turkish dictionary on
--     most distros (`tsearch_data/turkish.stop`), but it's not guaranteed
--     to be present on Render/Supabase out of the box. The 'simple'
--     config indexes whole tokens lower-cased with no stemming and no
--     stop-word filtering — Turkish words are still findable, just with
--     less recall on suffix variants. The 'turkish' config can be swapped
--     in via ALTER FUNCTION later if/when the dictionary is provisioned.
--
-- DBA note: prefer CONCURRENTLY when applying to a hot production table.
-- Prisma's migration runner wraps statements in a transaction so
-- CONCURRENTLY isn't usable here — the SAFE-ONLINE companion at
-- ./online.sql carries the same statements without IF NOT EXISTS guards
-- but WITH CONCURRENTLY for manual application during a maintenance
-- window.

-- 1. tsvector columns ──────────────────────────────────────────────────
ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "searchVectorTr" tsvector,
  ADD COLUMN IF NOT EXISTS "searchVectorEn" tsvector;

-- 2. Update trigger ────────────────────────────────────────────────────
-- Keep the vector columns in sync with their source text on each write.
-- A trigger is chosen over a generated column because:
--   (a) Multiple source columns feed each vector (title + desc);
--   (b) PG generated columns do not support function calls like
--       `to_tsvector(...)` unless declared `STORED` AND the dictionary is
--       known at column-creation time — we still want operational
--       flexibility to swap configs.

CREATE OR REPLACE FUNCTION services_fts_trigger() RETURNS trigger AS $$
BEGIN
  NEW."searchVectorTr" :=
    setweight(to_tsvector('simple', coalesce(NEW."titleTr", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."descTr",  '')), 'B');
  NEW."searchVectorEn" :=
    setweight(to_tsvector('english', coalesce(NEW."titleEn", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."descEn",  '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_fts_update ON "services";
CREATE TRIGGER services_fts_update
  BEFORE INSERT OR UPDATE OF "titleTr", "titleEn", "descTr", "descEn"
  ON "services"
  FOR EACH ROW EXECUTE FUNCTION services_fts_trigger();

-- 3. GIN indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "services_searchVectorTr_idx"
  ON "services" USING GIN ("searchVectorTr");
CREATE INDEX IF NOT EXISTS "services_searchVectorEn_idx"
  ON "services" USING GIN ("searchVectorEn");

-- 4. Backfill ──────────────────────────────────────────────────────────
-- For pre-existing rows the trigger hasn't fired yet, so explicitly
-- recompute. Cheap on the small services catalogue; would need a
-- batched UPDATE WHERE for larger tables.
UPDATE "services" SET
  "searchVectorTr" =
    setweight(to_tsvector('simple', coalesce("titleTr", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("descTr",  '')), 'B'),
  "searchVectorEn" =
    setweight(to_tsvector('english', coalesce("titleEn", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("descEn",  '')), 'B')
WHERE "searchVectorTr" IS NULL OR "searchVectorEn" IS NULL;
