-- P14-BE: ONLINE / NON-BLOCKING variant of the schema hardening migration.
--
-- Use this script ONLY if the production tables are large enough that the
-- regular migration's CREATE INDEX would lock writes for too long. Postgres
-- supports CREATE INDEX CONCURRENTLY which scans the table twice but never
-- holds a write lock; however it cannot run inside a transaction, so the
-- Prisma migrator (which wraps each migration in BEGIN/COMMIT) cannot use
-- it directly. Apply this from psql in the maintenance window:
--
--   psql "$DATABASE_URL" -f online.sql
--
-- Each statement is independent; if one is interrupted, the index is left
-- in an INVALID state and you simply re-issue the same line — `IF NOT
-- EXISTS` skips successful ones.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "contact_submissions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Drop redundant indexes first (cheap, takes only an ACCESS EXCLUSIVE
-- lock for a few ms each).
DROP INDEX CONCURRENTLY IF EXISTS "users_email_idx";
DROP INDEX CONCURRENTLY IF EXISTS "services_slug_idx";
DROP INDEX CONCURRENTLY IF EXISTS "newsletter_subscribers_email_idx";

CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_lastLoginAt_idx" ON "users" ("lastLoginAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_deletedAt_idx"   ON "users" ("deletedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "services_isActive_sortOrder_idx"
  ON "services" ("isActive", "sortOrder");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_status_scheduledAt_reminder24h_idx"
  ON "bookings" ("status", "scheduledAt", "reminder24hSent");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_status_scheduledAt_reminder1h_idx"
  ON "bookings" ("status", "scheduledAt", "reminder1hSent");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_status_scheduledAt_feedback_idx"
  ON "bookings" ("status", "scheduledAt", "feedbackEmailSent");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "bookings_userId_status_scheduledAt_idx"
  ON "bookings" ("userId", "status", "scheduledAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "analytics_userId_createdAt_idx"
  ON "analytics" ("userId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "interactions_userId_type_createdAt_idx"
  ON "interactions" ("userId", "type", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "contact_submissions_isRead_createdAt_idx"
  ON "contact_submissions" ("isRead", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "contact_submissions_createdAt_idx"
  ON "contact_submissions" ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "contact_submissions_deletedAt_idx"
  ON "contact_submissions" ("deletedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "newsletter_subscribers_unsubscribedAt_idx"
  ON "newsletter_subscribers" ("unsubscribedAt");
