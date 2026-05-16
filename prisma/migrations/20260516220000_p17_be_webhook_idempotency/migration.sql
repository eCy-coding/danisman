-- P17 BE Track 2 / Aşama 5 — WebhookEvent persistence.
-- ────────────────────────────────────────────────────────────────────
-- One row per inbound webhook keyed on (source, externalId). Handlers
-- upsert + skip when the row already has `processedAt`, so duplicate
-- deliveries from vendor retries are zero-effect.

CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id"          TEXT PRIMARY KEY,
  "source"      TEXT NOT NULL,
  "externalId"  TEXT NOT NULL,
  "signature"   TEXT,
  "payload"     JSONB NOT NULL,
  "processedAt" TIMESTAMPTZ,
  "error"       TEXT,
  "receivedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_source_externalId_key"
  ON "webhook_events" ("source", "externalId");

CREATE INDEX IF NOT EXISTS "webhook_events_source_receivedAt_idx"
  ON "webhook_events" ("source", "receivedAt");

CREATE INDEX IF NOT EXISTS "webhook_events_processedAt_idx"
  ON "webhook_events" ("processedAt");
