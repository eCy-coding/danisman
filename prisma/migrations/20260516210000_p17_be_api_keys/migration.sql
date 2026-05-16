-- P17 BE Track 2 / Aşama 4 — ApiKey model.
-- ────────────────────────────────────────────────────────────────────
-- Programmatic clients authenticate via `Authorization: Bearer <key>`.
-- The raw key never lives on disk — only a SHA-256 hash. The plaintext
-- is returned exactly once at creation time.

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id"          TEXT PRIMARY KEY,
  "hashedKey"   TEXT NOT NULL UNIQUE,
  "name"        TEXT NOT NULL,
  "scopes"      TEXT[] NOT NULL DEFAULT '{}',
  "userId"      TEXT,
  "lastUsedAt"  TIMESTAMPTZ,
  "expiresAt"   TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "revokedAt"   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "api_keys_userId_idx"     ON "api_keys" ("userId");
CREATE INDEX IF NOT EXISTS "api_keys_revokedAt_idx"  ON "api_keys" ("revokedAt");
CREATE INDEX IF NOT EXISTS "api_keys_expiresAt_idx"  ON "api_keys" ("expiresAt");
