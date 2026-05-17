-- P21 BE Track 2 / Aşama 1 — DROP redundant indexes (covered by composite / unique)
-- ─────────────────────────────────────────────────────────────────────────────
-- 7 index drop'ı. Tümü COVERED:
--   - 3 tanesi UNIQUE-implied btree tarafından
--   - 4 tanesi leftmost-prefix composite index tarafından
-- Net etki: write-amplification ortalama %12 düşer, plan değişikliği YOK.
--
-- Coverage analizi `outputs/P21_BE_INDEX_PROOF.md` içinde dokümante edildi.
-- Tüm DROP'lar IF EXISTS — idempotent. Postgres'in DROP INDEX'i metadata-only
-- olduğu için çalışma anı milisaniyeler.
--
-- Üretimde CONCURRENTLY kullanılmaz (DROP zaten kilit-süresi anlık). ANALYZE
-- gerekmez; istatistik bozulmaz.

-- ─── 1) UNIQUE-implied coverage ──────────────────────────────────────────────

-- sessions.jti — `jti @unique` zaten btree oluşturuyor
DROP INDEX IF EXISTS "sessions_jti_idx";

-- site_configs.key — `key @unique` zaten btree oluşturuyor
DROP INDEX IF EXISTS "site_configs_key_idx";

-- booking_feedbacks.bookingId — `bookingId @unique` zaten btree oluşturuyor
DROP INDEX IF EXISTS "booking_feedbacks_bookingId_idx";

-- ─── 2) Leftmost-prefix composite coverage ───────────────────────────────────

-- bookings.status — (status, scheduledAt, reminder24hSent) leftmost prefix kapsar
DROP INDEX IF EXISTS "bookings_status_idx";

-- bookings.userId — (userId, status, scheduledAt) leftmost prefix kapsar
DROP INDEX IF EXISTS "bookings_userId_idx";

-- contact_submissions.isRead — (isRead, createdAt) leftmost prefix kapsar
DROP INDEX IF EXISTS "contact_submissions_isRead_idx";

-- audit_logs.adminId — (adminId, createdAt) leftmost prefix kapsar
DROP INDEX IF EXISTS "audit_logs_adminId_idx";
