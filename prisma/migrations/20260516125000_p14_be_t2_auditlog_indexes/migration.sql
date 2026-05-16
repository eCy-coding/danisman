-- P14-BE Track 2: AuditLog composite indexes
-- ────────────────────────────────────────────────────────────────────
-- Additive, idempotent. Safe to re-run on a populated DB.
--
-- Rationale:
--   1. `(targetType, targetId)` — the admin dashboard's "show every action
--      ever taken on booking X / user Y" drill-down. Without this composite,
--      the query falls back to a full table scan of audit_logs filtered in
--      application code.
--   2. `(adminId, createdAt)` — the admin-activity report ("what did admin
--      Y do in the last 7 days"). The single-column `adminId` index gets
--      us to the admin's rows, but Postgres still has to sort by createdAt
--      in memory; a composite avoids both the second-index lookup and the
--      sort.
--
-- DBA note: prefer CONCURRENTLY when applying to a hot production table.
-- Prisma's runner wraps statements in a transaction so CONCURRENTLY is not
-- usable here — the SAFE-ONLINE companion at `./online.sql` carries the
-- same CREATE INDEX statements without IF NOT EXISTS guards but WITH
-- CONCURRENTLY for manual application during a maintenance window.

CREATE INDEX IF NOT EXISTS "audit_logs_targetType_targetId_idx"
  ON "audit_logs" ("targetType", "targetId");

CREATE INDEX IF NOT EXISTS "audit_logs_adminId_createdAt_idx"
  ON "audit_logs" ("adminId", "createdAt");
