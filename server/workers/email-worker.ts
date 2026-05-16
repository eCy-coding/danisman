/**
 * P17 BE Track 2 / Aşama 1 — Email queue worker.
 *
 * Consumes the `email` queue and dispatches each job to the right
 * transactional-mail template via `server/lib/mailer.ts`. Falls back to
 * Telegram operator notification when the primary delivery (Resend SMTP)
 * fails — see `server/lib/mailer.ts` for the abstraction.
 *
 * Lifecycle:
 *   - In dev / single-process boot, `startEmailWorker()` is called from
 *     `server/index.ts` so the worker shares the API process.
 *   - In prod, a separate dyno can invoke `server/workers/standalone.ts`
 *     which calls the same `startEmailWorker()` factory.
 *
 * Inline fallback:
 *   - When Redis OR the `bullmq` npm package is unavailable, the producer
 *     side of `server/queues/index.ts` runs `inlineHandler` synchronously.
 *     We register the same handler here so behaviour is identical.
 */

import {
  loadBullMQ,
  loadIORedis,
  type MinimalWorker,
  type MinimalWorkerOptions,
  type MinimalJob,
  type IORedisLike,
} from '../queues/bullmq-types';
import { registerInlineHandler, type EmailJobPayload } from '../queues';
import { sendTransactionalMail } from '../lib/mailer';
import { logger } from '../config/logger';

const QUEUE_NAME = 'email';
const QUEUE_PREFIX = 'ecypro:q';

async function processEmailJob(payload: EmailJobPayload): Promise<void> {
  await sendTransactionalMail(payload);
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
      logger.warn('[workers/email] connection error', { message: err.message });
    });
    return conn;
  } catch (err) {
    logger.warn('[workers/email] connection init failed', { message: (err as Error).message });
    return null;
  }
}

export function startEmailWorker(): MinimalWorker | null {
  // Always register the inline handler so producer-side fallback works
  // even before the queue worker is spun up.
  registerInlineHandler('email', processEmailJob);

  if (worker) return worker;
  const bullmq = loadBullMQ();
  if (!bullmq) {
    logger.info('[workers/email] BullMQ not installed — inline-only mode');
    return null;
  }
  const conn = makeWorkerConnection();
  if (!conn) {
    logger.info('[workers/email] Redis unreachable — running in inline-only mode');
    return null;
  }

  const opts: MinimalWorkerOptions = {
    connection: conn,
    prefix: QUEUE_PREFIX,
    concurrency: Number.parseInt(process.env.EMAIL_WORKER_CONCURRENCY ?? '5', 10) || 5,
    // Lock duration > slowest expected handler — Resend has been seen to
    // take 15s+ during their incidents. 60s gives ample headroom.
    lockDuration: 60_000,
  };

  worker = new bullmq.Worker<EmailJobPayload>(
    QUEUE_NAME,
    async (job: MinimalJob<EmailJobPayload>) => {
      const start = Date.now();
      try {
        await processEmailJob(job.data);
        logger.info('[workers/email] job processed', {
          jobId: job.id,
          type: (job.data as { type?: string }).type,
          durationMs: Date.now() - start,
        });
      } catch (err) {
        logger.warn('[workers/email] job failed', {
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          message: (err as Error).message,
        });
        throw err; // let BullMQ schedule the retry
      }
    },
    opts,
  );

  worker.on('failed', (job, err) => {
    // Final failure (exceeded attempts) → land in dead-letter set.
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      logger.error('[workers/email] DEAD-LETTER — exceeded attempts', {
        jobId: job.id,
        type: (job.data as { type?: string } | undefined)?.type,
        message: err.message,
      });
    }
  });

  logger.info('[workers/email] started', {
    concurrency: opts.concurrency,
  });

  return worker;
}

export async function stopEmailWorker(): Promise<void> {
  if (!worker) return;
  try {
    await worker.close();
  } catch (err) {
    logger.warn('[workers/email] stop failed', { message: (err as Error).message });
  }
  worker = null;
}
