/**
 * P17 BE Track 2 / Aşama 1 — Background job queue registry (BullMQ + Redis).
 *
 * Why BullMQ?
 *   - Async work (email send, GDPR export, sitemap regen) must not block
 *     the HTTP request cycle. Before this module, /api/contact and
 *     /api/gdpr/* would synchronously call Resend + Telegram, holding
 *     the request open for hundreds of ms during a network round-trip
 *     to a third-party. BullMQ moves that work onto a Redis-backed
 *     job queue, lets the API respond immediately, and gives us retry,
 *     exponential backoff, and dead-letter semantics for free.
 *   - Redis is already in the project for rate-limiting + idempotency
 *     persistence (P16/5). No new infra cost.
 *
 * Design contract:
 *   - The registry owns Queue instances; workers (server/workers/*.ts)
 *     consume them. Producers import `enqueue` and pass a typed payload.
 *   - If Redis is unreachable OR the `bullmq` npm package isn't yet
 *     installed (sandbox/CI), `enqueue` falls back to synchronous
 *     execution via the registered handler so the feature still works
 *     in single-process dev. No silent drops.
 *   - All queues share the same Redis connection but namespace via
 *     BullMQ's `prefix` so we never collide with other Redis keys
 *     (rate-limit, idempotency, audit cursor, JWT blacklist).
 *
 * Layout: 3 queues, each with its own retry/backoff/concurrency profile.
 *   - "email"        → outbound transactional mail (Resend + Telegram).
 *                      attempts=5, exponential 1s..60s.
 *   - "gdpr-export"  → user data export pipeline.
 *                      attempts=3, exponential 2s..120s, large payload.
 *   - "cron"         → scheduled tasks (sitemap regen, audit cleanup).
 *                      attempts=2, no replay window — should be idempotent.
 *
 * Dead-letter: jobs that exceed `attempts` are NOT removed; BullMQ keeps
 * them in the `failed` set indefinitely (we override the default 0 with
 * `removeOnFail: false`). The admin dashboard reads `failed` to surface
 * a "needs manual review" inbox.
 */

import {
  loadBullMQ,
  loadIORedis,
  type MinimalJobsOptions,
  type MinimalQueue,
  type MinimalQueueOptions,
  type IORedisLike,
} from './bullmq-types';
import { logger } from '../config/logger';
// P18 BE Track 2 / Aşama 2 — Prometheus emit on enqueue + lifecycle.
// The worker modules emit `done` / `failed` from their respective
// `Worker` callbacks; here we only emit at the producer boundary.
import { metrics } from '../observability/metrics';

// ── Queue names (union type for compile-time safety) ─────────────────────────

export type QueueName = 'email' | 'gdpr-export' | 'cron' | 'image-resize' | 'webhook-out';

// ── Payload contracts (one discriminated union per queue) ────────────────────

export type EmailJobPayload =
  | { type: 'welcome'; to: string; name: string; lang: 'tr' | 'en' }
  | { type: 'password-reset'; to: string; resetUrl: string; lang: 'tr' | 'en' }
  | {
      type: 'gdpr-export-ready';
      to: string;
      downloadUrl: string;
      expiresAt: string;
      lang: 'tr' | 'en';
    }
  | {
      type: 'gdpr-delete-confirm';
      to: string;
      confirmUrl: string;
      lang: 'tr' | 'en';
    }
  | { type: 'founder-letter'; to: string; firstName: string; lang: 'tr' | 'en' }
  | {
      type: 'quickcheck-result';
      to: string;
      company: string;
      lang: 'tr' | 'en';
      pdfBase64?: string;
    }
  | { type: 'pricing-inquiry-ack'; to: string; firstName: string; lang: 'tr' | 'en' }
  | { type: 'discovery-confirmed'; to: string; date: string; lang: 'tr' | 'en' }
  | {
      type: 'generic-notif';
      to: string;
      heading: string;
      message: string;
      ctaUrl?: string;
      ctaLabel?: string;
      lang: 'tr' | 'en';
    }
  | { type: 'transactional'; to: string; subject: string; html: string };

export type GdprExportJobPayload = {
  userId: string;
  email: string;
  requestedAt: string;
};

export type CronJobPayload =
  | { task: 'sitemap-regen' }
  | { task: 'audit-log-cleanup'; retentionDays: number }
  | { task: 'idempotency-gc' }
  // P18 BE Track 2 / Aşama 4 — weekly archival of audit_logs older than
  // `retentionDays` to cold object storage. Idempotent: archiving the same
  // window twice is a no-op (`archived_audit_logs` UNIQUE on coldKey).
  | { task: 'audit-log-archive'; retentionDays: number };

// P18 BE Track 2 / Aşama 1 — image variant fan-out.
// `imageId` references the parent row in `images`; the worker fetches
// the original from storage, regenerates AVIF + WebP + thumbnail and
// updates the row's `variants` JSON.
export type ImageResizeJobPayload = {
  imageId: string;
  /** Original storage key — denormalised so the worker doesn't need to
   *  hit the DB before downloading. */
  sourceKey: string;
};

// P23 BE Track 2 / Aşama 2 — Outbound webhook delivery. One job per
// (subscription × event) pair. The job carries the delivery row id and
// the event type; the dispatcher reads the secret + URL fresh from the DB
// on every attempt so a subscription URL/secret rotation is honoured
// mid-flight without restarting the worker.
export type WebhookOutJobPayload = {
  deliveryId: string;
  subscriptionId: string;
  eventType: string;
  payload: unknown;
};

export type JobPayloadFor<N extends QueueName> = N extends 'email'
  ? EmailJobPayload
  : N extends 'gdpr-export'
    ? GdprExportJobPayload
    : N extends 'cron'
      ? CronJobPayload
      : N extends 'image-resize'
        ? ImageResizeJobPayload
        : N extends 'webhook-out'
          ? WebhookOutJobPayload
          : never;

// ── BullMQ connection adapter ────────────────────────────────────────────────
//
// BullMQ wants its OWN ioredis instance with `maxRetriesPerRequest: null`
// (the BullMQ docs are emphatic about this — the default ioredis retry
// behaviour interferes with blocking commands BullMQ relies on internally).
// Rather than reuse the shared `redis` singleton, we lazily wrap it in a
// dedicated connection that BullMQ controls.
//
// For sandbox / unit-test environments where REDIS_URL is missing OR the
// `bullmq` npm package is not installed, we expose a `null` connection —
// `enqueue` then falls back to synchronous execution.

let bullConnection: IORedisLike | null = null;
let bullConnectionAttempted = false;

function getBullConnection(): IORedisLike | null {
  if (bullConnectionAttempted) return bullConnection;
  bullConnectionAttempted = true;

  const IORedis = loadIORedis();
  if (!IORedis) {
    logger.warn('[queues/bullmq] ioredis unavailable — falling back to inline mode');
    bullConnection = null;
    return null;
  }

  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    bullConnection = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    bullConnection.on('error', (err: Error) => {
      logger.warn('[queues/bullmq] Redis connection error', { message: err.message });
    });
  } catch (err) {
    logger.warn('[queues/bullmq] BullMQ connection unavailable — falling back to inline mode', {
      message: (err as Error).message,
    });
    bullConnection = null;
  }
  return bullConnection;
}

// ── Queue defaults ───────────────────────────────────────────────────────────

const QUEUE_PREFIX = 'ecypro:q';

const DEFAULTS: Record<QueueName, MinimalJobsOptions> = {
  email: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1_000 },
    removeOnComplete: { age: 24 * 3600, count: 1_000 },
    removeOnFail: false, // keep failures for manual review (DLQ)
  },
  'gdpr-export': {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: { age: 7 * 24 * 3600 },
    removeOnFail: false,
  },
  cron: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5_000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: false,
  },
  // P18 BE Track 2 / Aşama 1 — image variant fan-out.
  // 3 attempts because sharp can OOM under contention; exponential to give
  // memory pressure time to clear. Failures keep for review (DLQ).
  'image-resize': {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3_000 },
    removeOnComplete: { age: 24 * 3600, count: 500 },
    removeOnFail: false,
  },
  // P23 BE Track 2 / Aşama 2 — Outbound webhooks.
  // 5 attempts × exponential 30s base → 30s, 2m, 8m, 30m, 2h spread.
  // After all attempts the delivery stays in the failed set; the admin
  // panel exposes manual retry via POST /admin/webhooks/:id/retry/:dId.
  'webhook-out': {
    attempts: 5,
    backoff: { type: 'exponential', delay: 30_000 },
    removeOnComplete: { age: 7 * 24 * 3600, count: 5_000 },
    removeOnFail: false,
  },
};

// ── Queue registry (lazy initialisation) ─────────────────────────────────────

const registry = new Map<QueueName, MinimalQueue>();

function makeQueueOptions(): MinimalQueueOptions | null {
  const conn = getBullConnection();
  if (!conn) return null;
  return {
    connection: conn,
    prefix: QUEUE_PREFIX,
  };
}

export function getQueue(name: QueueName): MinimalQueue | null {
  const cached = registry.get(name);
  if (cached) return cached;
  const bullmq = loadBullMQ();
  if (!bullmq) return null;
  const opts = makeQueueOptions();
  if (!opts) return null;
  const q = new bullmq.Queue(name, opts);
  registry.set(name, q);
  return q;
}

// ── Inline-fallback handler registry ─────────────────────────────────────────
//
// When BullMQ is unavailable (no Redis in sandbox / unit tests), `enqueue`
// invokes the registered handler synchronously. Workers register here at
// startup so the same code path serves dev + prod.

type InlineHandler<N extends QueueName> = (payload: JobPayloadFor<N>) => Promise<void>;

const inlineHandlers = new Map<QueueName, InlineHandler<QueueName>>();

export function registerInlineHandler<N extends QueueName>(
  name: N,
  handler: InlineHandler<N>,
): void {
  inlineHandlers.set(name, handler as InlineHandler<QueueName>);
}

// ── Public producer API ──────────────────────────────────────────────────────

export interface EnqueueOptions {
  /** Override per-call attempts; default uses queue tier. */
  attempts?: number;
  /** Delay in ms before the job becomes eligible. */
  delay?: number;
  /** Idempotency: jobs sharing a jobId are deduped within retention. */
  jobId?: string;
  /** Priority: lower = sooner. Default unprioritised. */
  priority?: number;
}

export interface EnqueueResult {
  mode: 'queue' | 'inline' | 'dropped';
  jobId?: string;
  error?: string;
}

export async function enqueue<N extends QueueName>(
  name: N,
  payload: JobPayloadFor<N>,
  options: EnqueueOptions = {},
): Promise<EnqueueResult> {
  const q = getQueue(name);
  if (q) {
    try {
      const jobsOpts: MinimalJobsOptions = {
        ...DEFAULTS[name],
        ...(options.attempts !== undefined && { attempts: options.attempts }),
        ...(options.delay !== undefined && { delay: options.delay }),
        ...(options.jobId !== undefined && { jobId: options.jobId }),
        ...(options.priority !== undefined && { priority: options.priority }),
      };
      const job = await q.add(name, payload as object, jobsOpts);
      metrics.incBullmq(name, 'enqueued');
      return { mode: 'queue', jobId: job.id };
    } catch (err) {
      logger.warn(`[queues/${name}] enqueue failed — falling back inline`, {
        message: (err as Error).message,
      });
      // fall through to inline path
    }
  }

  const handler = inlineHandlers.get(name);
  if (!handler) {
    logger.error(`[queues/${name}] no inline handler registered and Redis unavailable`, {
      payloadType: (payload as Record<string, unknown>).type ?? 'unknown',
    });
    metrics.incBullmq(name, 'dropped');
    return { mode: 'dropped', error: 'no_handler_no_queue' };
  }
  try {
    await handler(payload);
    metrics.incBullmq(name, 'inline');
    return { mode: 'inline' };
  } catch (err) {
    logger.error(`[queues/${name}] inline execution failed`, {
      message: (err as Error).message,
    });
    metrics.incBullmq(name, 'failed');
    return { mode: 'inline', error: (err as Error).message };
  }
}

// ── Admin / DLQ inspection ───────────────────────────────────────────────────

export interface QueueStats {
  queue: QueueName;
  available: boolean;
  waiting?: number;
  active?: number;
  delayed?: number;
  failed?: number;
  completed?: number;
}

export async function getQueueStats(name: QueueName): Promise<QueueStats> {
  const q = getQueue(name);
  if (!q) return { queue: name, available: false };
  try {
    const [waiting, active, delayed, failed, completed] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getDelayedCount(),
      q.getFailedCount(),
      q.getCompletedCount(),
    ]);
    return { queue: name, available: true, waiting, active, delayed, failed, completed };
  } catch (err) {
    logger.warn(`[queues/${name}] stats unavailable`, { message: (err as Error).message });
    return { queue: name, available: false };
  }
}

export const ALL_QUEUE_NAMES: readonly QueueName[] = [
  'email',
  'gdpr-export',
  'cron',
  'image-resize',
];

export async function getAllQueueStats(): Promise<QueueStats[]> {
  return Promise.all(ALL_QUEUE_NAMES.map((n) => getQueueStats(n)));
}

// ── Graceful shutdown ────────────────────────────────────────────────────────

export async function closeQueues(): Promise<void> {
  for (const [, q] of registry) {
    try {
      await q.close();
    } catch (err) {
      logger.warn('[queues] close failed', { message: (err as Error).message });
    }
  }
  registry.clear();
  if (bullConnection) {
    try {
      await bullConnection.quit();
    } catch {
      /* connection may already be down */
    }
    bullConnection = null;
    bullConnectionAttempted = false;
  }
}

// ── Test seam ────────────────────────────────────────────────────────────────

export const _testing = {
  /** Reset registry + connection between tests. */
  reset(): void {
    registry.clear();
    bullConnection = null;
    bullConnectionAttempted = false;
    inlineHandlers.clear();
  },
  inlineHandlers,
};
