-- S13-R2-P3 — Extend InteractionType with WEB_VITALS.
-- monitor.ts ships Core Web Vitals batches via sendBeacon to
-- /analytics/interaction; backend zod enum + DB enum both need the value.
-- Idempotent: ADD VALUE IF NOT EXISTS is safe to re-run.
ALTER TYPE "InteractionType" ADD VALUE IF NOT EXISTS 'WEB_VITALS';
