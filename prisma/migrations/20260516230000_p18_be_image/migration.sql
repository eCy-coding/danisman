-- P18 BE Track 2 / Aşama 1 — Uploaded image metadata.
-- ────────────────────────────────────────────────────────────────────
-- One row per uploaded artifact. `storageKey` is the adapter-opaque
-- path; `variants` records AVIF/WebP/thumbnail derivatives produced
-- by the BullMQ image-resize worker. `hash` is SHA-256 hex of the
-- original bytes (content-addressed dedupe).

CREATE TABLE IF NOT EXISTS "images" (
  "id"           TEXT PRIMARY KEY,
  "ownerId"      TEXT,
  "storageKey"   TEXT NOT NULL,
  "contentType"  TEXT NOT NULL,
  "sizeBytes"    INTEGER NOT NULL,
  "width"        INTEGER,
  "height"       INTEGER,
  "hash"         TEXT NOT NULL,
  "variants"     JSONB,
  "status"       TEXT NOT NULL DEFAULT 'ready',
  "errorMessage" TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "images_storageKey_key"
  ON "images" ("storageKey");

CREATE UNIQUE INDEX IF NOT EXISTS "images_hash_key"
  ON "images" ("hash");

CREATE INDEX IF NOT EXISTS "images_ownerId_idx"
  ON "images" ("ownerId");

CREATE INDEX IF NOT EXISTS "images_status_idx"
  ON "images" ("status");

CREATE INDEX IF NOT EXISTS "images_createdAt_idx"
  ON "images" ("createdAt");
