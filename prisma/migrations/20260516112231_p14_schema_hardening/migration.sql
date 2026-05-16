-- P14-BE: Schema hardening — additive indexes + soft-delete columns
-- ────────────────────────────────────────────────────────────────────
-- This migration is purely additive and idempotent. It must run safely on
-- a populated production database without locking writes for more than a
-- few milliseconds per index (CONCURRENTLY).
--
-- Goals:
--   1. Drop redundant indexes that duplicate UNIQUE-implied btrees.
--   2. Add composite indexes the application is already filtering on
--      (status + scheduledAt + reminder flags in the cron job, etc.).
--   3. Introduce nullable `deletedAt` columns for GDPR-aware soft-delete
--      on User and ContactSubmission.
--
-- NOTE: every CREATE INDEX uses IF NOT EXISTS so the migration is safe
-- to re-run. Production DBAs should consider executing each CREATE INDEX
-- with CONCURRENTLY to avoid blocking writes; Prisma's runner cannot do
-- that inside a transaction, so the SAFE-ONLINE companion script lives at
--   prisma/migrations/20260516112231_p14_schema_hardening/online.sql
-- and can be applied manually outside a transaction during a maintenance
-- window if the table sizes warrant it.

-- ─── 1) USERS ────────────────────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Redundant: email is already UNIQUE (so a btree already exists)
DROP INDEX IF EXISTS "users_email_idx";

CREATE INDEX IF NOT EXISTS "users_lastLoginAt_idx" ON "users" ("lastLoginAt");
CREATE INDEX IF NOT EXISTS "users_deletedAt_idx"   ON "users" ("deletedAt");

-- ─── 2) SERVICES ────────────────────────────────────────────────────
-- Redundant: slug is UNIQUE
DROP INDEX IF EXISTS "services_slug_idx";

CREATE INDEX IF NOT EXISTS "services_isActive_sortOrder_idx"
  ON "services" ("isActive", "sortOrder");

-- ─── 3) BOOKINGS ────────────────────────────────────────────────────
-- Composite indexes that match the cron-driven reminder queries in
-- server/jobs/booking-reminders.ts. Without them every poll degrades to
-- a status=CONFIRMED full scan.
CREATE INDEX IF NOT EXISTS "bookings_status_scheduledAt_reminder24h_idx"
  ON "bookings" ("status", "scheduledAt", "reminder24hSent");

CREATE INDEX IF NOT EXISTS "bookings_status_scheduledAt_reminder1h_idx"
  ON "bookings" ("status", "scheduledAt", "reminder1hSent");

CREATE INDEX IF NOT EXISTS "bookings_status_scheduledAt_feedback_idx"
  ON "bookings" ("status", "scheduledAt", "feedbackEmailSent");

CREATE INDEX IF NOT EXISTS "bookings_userId_status_scheduledAt_idx"
  ON "bookings" ("userId", "status", "scheduledAt");

-- ─── 4) ANALYTICS ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "analytics_userId_createdAt_idx"
  ON "analytics" ("userId", "createdAt");

-- ─── 5) INTERACTIONS ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "interactions_userId_type_createdAt_idx"
  ON "interactions" ("userId", "type", "createdAt");

-- ─── 6) CONTACT SUBMISSIONS ─────────────────────────────────────────
ALTER TABLE "contact_submissions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "contact_submissions_isRead_createdAt_idx"
  ON "contact_submissions" ("isRead", "createdAt");

CREATE INDEX IF NOT EXISTS "contact_submissions_createdAt_idx"
  ON "contact_submissions" ("createdAt");

CREATE INDEX IF NOT EXISTS "contact_submissions_deletedAt_idx"
  ON "contact_submissions" ("deletedAt");

-- ─── 7) NEWSLETTER ──────────────────────────────────────────────────
-- Redundant: email is UNIQUE
DROP INDEX IF EXISTS "newsletter_subscribers_email_idx";

CREATE INDEX IF NOT EXISTS "newsletter_subscribers_unsubscribedAt_idx"
  ON "newsletter_subscribers" ("unsubscribedAt");
