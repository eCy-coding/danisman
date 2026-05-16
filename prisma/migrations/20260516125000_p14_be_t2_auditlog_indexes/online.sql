-- P14-BE Track 2: SAFE-ONLINE companion to migration.sql
-- ────────────────────────────────────────────────────────────────────
-- Run OUTSIDE a transaction (Prisma's runner cannot use CONCURRENTLY)
-- against a populated production DB. Each statement is independent —
-- if you have to abort mid-way, the partial indexes are still valid
-- and a re-run is safe (CREATE INDEX CONCURRENTLY IF NOT EXISTS).
--
-- Usage (Render psql session):
--   \set ON_ERROR_STOP on
--   \i online.sql

CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_logs_targetType_targetId_idx"
  ON "audit_logs" ("targetType", "targetId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_logs_adminId_createdAt_idx"
  ON "audit_logs" ("adminId", "createdAt");
