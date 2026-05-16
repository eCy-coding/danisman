/**
 * P17 BE Track 2 / Aşama 1 — Cron / scheduled-task queue worker.
 *
 * Replaces the few inline `setInterval` cron-style loops we still had
 * (e.g. idempotency GC, future sitemap regen). Each task is dispatched
 * via the `cron` queue so:
 *   - retries / backoff are uniform,
 *   - tasks survive a deploy (Redis persistence + delayed jobs),
 *   - the admin DLQ shows a single "things that aren't running" pane.
 *
 * Important: handlers MUST be idempotent. Cron tasks have a fixed retry
 * budget of 2 with NO replay window protection — if a worker crashes
 * mid-run, the re-attempt must not duplicate side effects (e.g. don't
 * INSERT, prefer UPSERT; don't increment, prefer SET).
 */

import {
  loadBullMQ,
  loadIORedis,
  type MinimalWorker,
  type MinimalWorkerOptions,
  type MinimalJob,
  type IORedisLike,
} from '../queues/bullmq-types';
import { registerInlineHandler, type CronJobPayload } from '../queues';
import { logger } from '../config/logger';
import { metrics } from '../observability/metrics';
// P23 BE Track 2 / Aşama 4 — distributed lock so multi-instance deploys
// only run each cron task once per scheduled tick.
import { withLock } from '../lib/lock/redis-lock';

const QUEUE_NAME = 'cron';
const QUEUE_PREFIX = 'ecypro:q';

async function processCronJob(payload: CronJobPayload): Promise<void> {
  switch (payload.task) {
    case 'sitemap-regen':
      // Skeleton — the actual regen lives in scripts/generate-sitemap.ts.
      // P18 will lift it into a callable function so we don't shell out.
      logger.info('[workers/cron] sitemap-regen requested (skeleton)');
      return;

    case 'audit-log-cleanup': {
      const { prisma } = await import('../config/db');
      const cutoff = new Date(Date.now() - payload.retentionDays * 24 * 3600_000);
      const result = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      logger.info('[workers/cron] audit-log-cleanup done', {
        deleted: result.count,
        olderThan: cutoff.toISOString(),
      });
      return;
    }

    case 'idempotency-gc':
      // Redis-backed idempotency uses PEX so eviction is automatic.
      // In-memory tier has its own setInterval GC. This task is a
      // marker for future tiered-store maintenance.
      logger.info('[workers/cron] idempotency-gc no-op (PEX-managed)');
      return;

    // P18 BE Track 2 / Aşama 4 — delegated to the audit-archive worker
    // module so the heavy archival flow (storage write + idempotent
    // pointer row + hot-table delete) lives in one place.
    //
    // P23 BE Track 2 / Aşama 4 — wrap in distributed lock so multi-instance
    // deploys (API + workers + standalone dyno) don't all run archival in
    // parallel. TTL 5 min covers worst-case archival run; renew at 100s.
    case 'audit-log-archive': {
      const outcome = await withLock('lock:cron:audit-archive', 5 * 60 * 1000, async () => {
        const { archiveAuditLogs } = await import('./audit-archive-worker');
        return archiveAuditLogs({ retentionDays: payload.retentionDays });
      });
      if (!outcome.acquired) {
        logger.info('[workers/cron] audit-log-archive skipped — another instance owns the lock');
        return;
      }
      logger.info('[workers/cron] audit-log-archive done', outcome.value);
      return;
    }

    default: {
      // Exhaustiveness — TS will error if a new variant is added.
      const _exhaustive: never = payload;
      throw new Error(`unknown cron task: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

// ── Worker factory ──────────────────────────────────────────────────────────

let worker: MinimalWorker | null = null;

function makeWorkerConnection(): IORedisLike | null {
  const IORedis = loadIORedis();
  if (!IORedis) return null;
  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const conn = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    conn.on('error', (err: Error) => {
      logger.warn('[workers/cron] connection error', { message: err.message });
    });
    return conn;
  } catch (err) {
    logger.warn('[workers/cron] connection init failed', { message: (err as Error).message });
    return null;
  }
}

export function startCronWorker(): MinimalWorker | null {
  registerInlineHandler('cron', processCronJob);

  if (worker) return worker;
  const bullmq = loadBullMQ();
  if (!bullmq) {
    logger.info('[workers/cron] BullMQ not installed — inline-only mode');
    return null;
  }
  const conn = makeWorkerConnection();
  if (!conn) {
    logger.info('[workers/cron] Redis unreachable — running in inline-only mode');
    return null;
  }

  const opts: MinimalWorkerOptions = {
    connection: conn,
    prefix: QUEUE_PREFIX,
    concurrency: Number.parseInt(process.env.CRON_WORKER_CONCURRENCY ?? '1', 10) || 1,
    lockDuration: 60_000,
  };

  worker = new bullmq.Worker<CronJobPayload>(
    QUEUE_NAME,
    async (job: MinimalJob<CronJobPayload>) => {
      const start = Date.now();
      try {
        await processCronJob(job.data);
        metrics.incBullmq('cron', 'done');
        logger.info('[workers/cron] job processed', {
          jobId: job.id,
          task: (job.data as { task?: string }).task,
          durationMs: Date.now() - start,
        });
      } catch (err) {
        metrics.incBullmq('cron', 'failed');
        logger.warn('[workers/cron] job failed', {
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          message: (err as Error).message,
        });
        throw err;
      }
    },
    opts,
  );

  worker.on('failed', (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      logger.error('[workers/cron] DEAD-LETTER — exceeded attempts', {
        jobId: job.id,
        task: (job.data as { task?: string } | undefined)?.task,
        message: err.message,
      });
    }
  });

  logger.info('[workers/cron] started', { concurrency: opts.concurrency });
  return worker;
}

export async function stopCronWorker(): Promise<void> {
  if (!worker) return;
  try {
    await worker.close();
  } catch (err) {
    logger.warn('[workers/cron] stop failed', { message: (err as Error).message });
  }
  worker = null;
}
