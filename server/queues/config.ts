/**
 * P21 BE Track 2 / Aşama 2 — Queue capacity config (Little's Law tuning).
 *
 * `L = λ × W` (Little, 1961). The average number of items in the queue equals
 * the arrival rate × the average service time. We use this to size:
 *
 *   - `concurrency`         — how many parallel workers to provision
 *   - `maxDepthWarn`        — soft threshold for /metrics + Telegram alert
 *   - `maxDepthAlert`       — hard threshold; producer SHOULD shed load above
 *
 * All values are env-overridable. Defaults below were derived analytically
 * (see outputs/P21_BE_QUEUE_MATH.md) — production tuning must replace the
 * static λ + W estimates with measured Prometheus values.
 *
 * Why a separate module (and not constants in queues/index.ts)?
 *   - The worker side (server/workers/*.ts) also reads these knobs.
 *   - Tests need a single import surface to override per-case.
 *   - Future runtime auto-scaler (P22+) will subscribe to changes here.
 */

import type { QueueName } from './index';

export interface QueueCapacity {
  /** How many jobs a single worker process can pull in parallel. */
  concurrency: number;
  /**
   * Soft depth threshold. When `waiting + active` exceeds this, /metrics
   * starts emitting `bullmq_queue_depth_warn{queue=...}=1` and the admin
   * dashboard surfaces a yellow banner. Below the alert threshold —
   * still accepting work.
   */
  maxDepthWarn: number;
  /**
   * Hard depth threshold. Producers in user-facing paths (e.g. /api/contact)
   * SHOULD honour `shouldShedLoad()` and reject with 503 + Retry-After
   * to protect the worker from being buried under a thundering herd.
   * DLQ-bound jobs (cron tasks, internal flows) are NOT shed — they
   * tolerate latency.
   */
  maxDepthAlert: number;
}

// ── Little's Law derivations ────────────────────────────────────────────────
//
// EMAIL queue — transactional mail (welcome, password reset, GDPR ready):
//   Steady-state λ:     ~10 form submits/min = 0.17/sec
//   Burst λ:            ~120/min during marketing blast = 2/sec
//   W (service time):   Resend p99 ~2s + Telegram fallback p99 ~1s = ~2s avg
//   L_burst = 2 × 2     = 4 → concurrency 5 fully absorbs the burst
//   Buffer at p99:      maxDepthWarn = 5 min × 60 × λ_burst / concurrency
//                                    = 300 × 2 / 5 = 120 → 100 (with 20% margin)
//
// GDPR-EXPORT — user data dump (~30s per job, rare):
//   Steady-state λ:     <1/day → effectively 0
//   Burst λ:            data-subject mass exercise → up to 1/sec for 60s
//   W:                  ~30s (DB dump + zip + S3 PUT)
//   L_burst = 1 × 30    = 30 → concurrency 2 keeps ETA under 2 min
//   maxDepthWarn = 50   (5× concurrency × W/baselineW for headroom)
//
// CRON — sitemap regen, audit cleanup, idempotency GC:
//   λ:                  scheduled (sec) — never user-driven
//   W:                  varies (10s for sitemap, 60s for audit cleanup)
//   concurrency = 1     (serial; jobs may share DB rows)
//   maxDepthWarn = 10   (anything higher means worker died)
//
// IMAGE-RESIZE — user-uploaded avatars/covers:
//   λ:                  ~5/min during onboarding peaks = 0.083/sec
//   W:                  sharp CPU-bound ~3s avg
//   L = 0.25            → concurrency 2 ≫ steady state
//   Buffer:             10× during marketing blast → maxDepthWarn = 30

const READ = (envKey: string, fallback: number): number => {
  const raw = process.env[envKey];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const QUEUE_CAPACITY: Record<QueueName, QueueCapacity> = {
  email: {
    concurrency: READ('EMAIL_WORKER_CONCURRENCY', 5),
    maxDepthWarn: READ('EMAIL_QUEUE_DEPTH_WARN', 100),
    maxDepthAlert: READ('EMAIL_QUEUE_DEPTH_ALERT', 300),
  },
  'gdpr-export': {
    concurrency: READ('GDPR_WORKER_CONCURRENCY', 2),
    maxDepthWarn: READ('GDPR_QUEUE_DEPTH_WARN', 50),
    maxDepthAlert: READ('GDPR_QUEUE_DEPTH_ALERT', 150),
  },
  cron: {
    concurrency: READ('CRON_WORKER_CONCURRENCY', 1),
    maxDepthWarn: READ('CRON_QUEUE_DEPTH_WARN', 10),
    maxDepthAlert: READ('CRON_QUEUE_DEPTH_ALERT', 30),
  },
  'image-resize': {
    concurrency: READ('IMAGE_RESIZE_WORKER_CONCURRENCY', 2),
    maxDepthWarn: READ('IMAGE_RESIZE_QUEUE_DEPTH_WARN', 30),
    maxDepthAlert: READ('IMAGE_RESIZE_QUEUE_DEPTH_ALERT', 100),
  },
  // P23 BE Track 2 / Aşama 2 — Outbound webhook delivery.
  // λ_burst    = 5/sec during a marketing event blast
  // W (timeout-bound) = 5s p99 (REQUEST_TIMEOUT_MS in dispatcher)
  // L_burst    = 5 × 5 = 25 → concurrency 5 keeps p99 latency tolerable
  // maxDepthWarn = 5min × 5 × λ / concurrency = 5 × 60 × 5 / 5 = 300
  // Alert threshold doubles to give producer time to shed before workers
  // start rejecting.
  'webhook-out': {
    concurrency: READ('WEBHOOK_OUT_WORKER_CONCURRENCY', 5),
    maxDepthWarn: READ('WEBHOOK_OUT_QUEUE_DEPTH_WARN', 300),
    maxDepthAlert: READ('WEBHOOK_OUT_QUEUE_DEPTH_ALERT', 1_000),
  },
};

/** Convenience accessor with a friendly fallback if a future queue is missing. */
export function getCapacity(name: QueueName): QueueCapacity {
  return (
    QUEUE_CAPACITY[name] ?? {
      concurrency: 1,
      maxDepthWarn: 10,
      maxDepthAlert: 30,
    }
  );
}

/**
 * Producer-side load-shedding helper. The caller passes the current
 * `waiting + active` count (from `getQueueStats(...)`) and the queue name.
 * Returns `true` if the producer SHOULD return 503 + Retry-After.
 *
 * Only user-facing producers (HTTP endpoints) should consult this — internal
 * jobs (cron, fan-out workers) tolerate latency and must NOT shed.
 */
export function shouldShedLoad(name: QueueName, currentDepth: number): boolean {
  const cap = getCapacity(name);
  return currentDepth >= cap.maxDepthAlert;
}

/** Same idea, soft level — useful to emit a 'queue_pressure' header without rejecting. */
export function shouldWarnPressure(name: QueueName, currentDepth: number): boolean {
  const cap = getCapacity(name);
  return currentDepth >= cap.maxDepthWarn;
}

// ── Test seam ────────────────────────────────────────────────────────────────

export const _testing = {
  /** Reset internal envelope overrides — currently nothing to clear, but keeps API. */
  reset(): void {
    /* no-op */
  },
};
