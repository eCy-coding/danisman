-- P18 BE Track 2 / Aşama 4 — Archived audit-log metadata.
-- ────────────────────────────────────────────────────────────────────
-- Pointer table. The weekly archival cron exports `audit_logs` rows
-- older than the retention window as JSON.gz to cold storage and
-- inserts a row here so an operator can locate + restore the bundle.
-- The corresponding rows in `audit_logs` are deleted AFTER the cold
-- write is confirmed (see server/workers/audit-archive-worker.ts).

CREATE TABLE IF NOT EXISTS "archived_audit_logs" (
  "id"              TEXT PRIMARY KEY,
  "coldKey"         TEXT NOT NULL,
  "windowStart"     TIMESTAMPTZ NOT NULL,
  "windowEnd"       TIMESTAMPTZ NOT NULL,
  "rowsArchived"    INTEGER NOT NULL,
  "bytesCompressed" INTEGER NOT NULL,
  "archivedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "archived_audit_logs_coldKey_key"
  ON "archived_audit_logs" ("coldKey");

CREATE INDEX IF NOT EXISTS "archived_audit_logs_windowStart_idx"
  ON "archived_audit_logs" ("windowStart");

CREATE INDEX IF NOT EXISTS "archived_audit_logs_windowEnd_idx"
  ON "archived_audit_logs" ("windowEnd");

CREATE INDEX IF NOT EXISTS "archived_audit_logs_archivedAt_idx"
  ON "archived_audit_logs" ("archivedAt");
