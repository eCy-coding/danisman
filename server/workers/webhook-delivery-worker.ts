/**
 * P23 BE Track 2 / Aşama 2 — Outbound webhook delivery worker.
 *
 * Consumes the `webhook-out` queue and dispatches each job via the
 * dispatcher (HMAC sign + POST + persist outcome). BullMQ owns the
 * retry schedule (5 attempts, exponential backoff 30s..2h — see
 * server/queues/index.ts DEFAULTS).
 *
 * Failure semantics:
 *   - Per-delivery retry → BullMQ throws + reschedules.
 *   - Final failure (attempts exhausted) → BullMQ keeps job in `failed`
 *     set; admin UI surfaces "DLQ" listing for manual retry.
 *   - Subscription-level circuit break → dispatcher disables the
 *     subscription after 10 consecutive failures (see dispatcher.ts).
 *
 * Inline fallback (BullMQ/Redis unavailable):
 *   The dispatcher logic still runs synchronously when the producer falls
 *   back. No retry loop in that mode — the delivery row is left at
 *   `failed` so a later cron can replay.
 */

import {
  loadBullMQ,
  loadIORedis,
  type MinimalWorker,
  type MinimalWorkerOptions,
  type MinimalJob,
  type IORedisLike,
} from '../queues/bullmq-types';
import { registerInlineHandler, type WebhookOutJobPayload } from '../queues';
import { getCapacity } from '../queues/config';
import { dispatch } from '../lib/webhooks-out/dispatcher';
import { logger } from '../config/logger';

const QUEUE_NAME = 'webhook-out';
const QUEUE_PREFIX = 'ecypro:q';

async function processWebhookJob(payload: WebhookOutJobPayload): Promise<void> {
  const result = await dispatch({
    deliveryId: payload.deliveryId,
    subscriptionId: payload.subscriptionId,
    eventType: payload.eventType,
    payload: payload.payload,
  });
  if (!result.ok) {
    // Throw so BullMQ schedules the next retry via its exponential backoff.
    // The retry budget (attempts: 5) is configured at enqueue time.
    throw new Error(result.errorMessage ?? `delivery_failed_${result.responseStatus ?? 'unknown'}`);
  }
}

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
      logger.warn('[workers/webhook-out] connection error', { message: err.message });
    });
    return conn;
  } catch (err) {
    logger.warn('[workers/webhook-out] connection init failed', {
      message: (err as Error).message,
    });
    return null;
  }
}

export function startWebhookDeliveryWorker(): MinimalWorker | null {
  registerInlineHandler('webhook-out', processWebhookJob);

  if (worker) return worker;
  const bullmq = loadBullMQ();
  if (!bullmq) {
    logger.info('[workers/webhook-out] BullMQ not installed — inline-only mode');
    return null;
  }
  const conn = makeWorkerConnection();
  if (!conn) {
    logger.info('[workers/webhook-out] Redis unreachable — inline-only mode');
    return null;
  }

  const capacity = getCapacity('webhook-out');
  const opts: MinimalWorkerOptions = {
    connection: conn,
    prefix: QUEUE_PREFIX,
    concurrency: capacity.concurrency,
    // Allow up to REQUEST_TIMEOUT_MS × 2 + jitter for the partner response
    // before BullMQ considers the worker dead and re-queues the job.
    lockDuration: 30_000,
  };

  worker = new bullmq.Worker<WebhookOutJobPayload>(
    QUEUE_NAME,
    async (job: MinimalJob<WebhookOutJobPayload>) => {
      const start = Date.now();
      try {
        await processWebhookJob(job.data);
        logger.info('[workers/webhook-out] delivered', {
          jobId: job.id,
          deliveryId: job.data.deliveryId,
          eventType: job.data.eventType,
          durationMs: Date.now() - start,
        });
      } catch (err) {
        logger.warn('[workers/webhook-out] delivery failed', {
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          deliveryId: job.data.deliveryId,
          message: (err as Error).message,
        });
        throw err;
      }
    },
    opts,
  );

  worker.on('failed', (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      logger.error('[workers/webhook-out] DEAD-LETTER — attempts exhausted', {
        jobId: job.id,
        deliveryId: (job.data as WebhookOutJobPayload | undefined)?.deliveryId,
        message: err.message,
      });
    }
  });

  logger.info('[workers/webhook-out] started', { concurrency: opts.concurrency });
  return worker;
}

export async function stopWebhookDeliveryWorker(): Promise<void> {
  if (!worker) return;
  try {
    await worker.close();
  } catch (err) {
    logger.warn('[workers/webhook-out] stop failed', { message: (err as Error).message });
  }
  worker = null;
}
