-- Sprint 11 P44-T03: Additive audit_log fields for RBAC + KVKK m.4 compliance.
-- Backward compatible: all new columns are nullable or have defaults.

-- AuditResult enum
DO $$ BEGIN
  CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'DENIED', 'ERROR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Additive columns on audit_logs
ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "actorRole"   TEXT,
  ADD COLUMN IF NOT EXISTS "actorIpHash" TEXT,
  ADD COLUMN IF NOT EXISTS "result"      "AuditResult" NOT NULL DEFAULT 'SUCCESS';

-- New indexes
CREATE INDEX IF NOT EXISTS "audit_logs_actorRole_createdAt_idx"
  ON "audit_logs"("actorRole", "createdAt");

CREATE INDEX IF NOT EXISTS "audit_logs_action_result_idx"
  ON "audit_logs"("action", "result");

-- NOTE: The `ip` column is deprecated but retained for existing rows.
-- New writes use `actorIpHash` (SHA-256 hex, KVKK m.4).
-- Retention: 90-day rolling delete per cron-worker (KVKK m.7 imha).
