/**
 * P17 BE Track 2 / Aşama 1 — GDPR export queue worker.
 *
 * Long-running data-rights export. Pulls every owned row across User /
 * Booking / Analytics / Interaction / ContactSubmission / Session
 * (matching the existing soft-delete model in P14-BE) and writes a JSON
 * artifact the user can download for 7 days via the `gdpr-export-ready`
 * email.
 *
 * Why offline?
 *   - Sync inline export blocks the HTTP request for seconds when a
 *     user has thousands of analytics rows. Even with cursor pagination
 *     the byte size is large enough that we want it backgrounded.
 *   - On Postgres + Prisma a multi-table export is bounded but not
 *     bounded enough to fit comfortably inside the per-request 30s
 *     timeout. Queue it, email the link.
 *
 * For sandbox compatibility we DO NOT actually persist the artifact in
 * this skeleton (no S3/MinIO yet). The handler builds the dataset in
 * memory and logs a structured summary; the storage step is a TODO
 * marker pending the object-storage decision in P18.
 */

import {
  loadBullMQ,
  loadIORedis,
  type MinimalWorker,
  type MinimalWorkerOptions,
  type MinimalJob,
  type IORedisLike,
} from '../queues/bullmq-types';
import { registerInlineHandler, enqueue, type GdprExportJobPayload } from '../queues';
import { logger } from '../config/logger';

const QUEUE_NAME = 'gdpr-export';
const QUEUE_PREFIX = 'ecypro:q';

async function processGdprExportJob(payload: GdprExportJobPayload): Promise<void> {
  // Lazy-import prisma so unit tests that never touch DB don't pay for it.
  const { prisma } = await import('../config/db');

  const start = Date.now();
  const userId = payload.userId;

  const [user, bookings, analytics, interactions, contactSubs, sessions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.booking.findMany({ where: { userId } }),
    prisma.analytics.findMany({ where: { userId } }),
    prisma.interaction.findMany({ where: { userId } }),
    contactSubmissionsForEmail(payload.email),
    prisma.session.findMany({ where: { userId } }),
  ]);

  // We intentionally redact passwordHash + tokens. The export is for the
  // user themselves and would otherwise leak internal credential material.
  const redactedUser = user
    ? { ...user, passwordHash: undefined, totpSecret: undefined, backupCodes: undefined }
    : null;

  const artifact = {
    schemaVersion: 1,
    requestedAt: payload.requestedAt,
    completedAt: new Date().toISOString(),
    user: redactedUser,
    bookings,
    analytics,
    interactions,
    contactSubmissions: contactSubs,
    sessions,
    rowCounts: {
      bookings: bookings.length,
      analytics: analytics.length,
      interactions: interactions.length,
      contactSubmissions: contactSubs.length,
      sessions: sessions.length,
    },
  };

  // TODO(P18): persist to object storage + sign a 7-day URL.
  // For now we emit a structured marker the operator can correlate
  // against the audit log + queue stats.
  logger.info('[workers/gdpr-export] artifact built', {
    userId,
    bytes: JSON.stringify(artifact).length,
    durationMs: Date.now() - start,
  });

  // Email the (placeholder) link. In P18 swap with the signed S3 URL.
  await enqueue('email', {
    type: 'gdpr-export-ready',
    to: payload.email,
    downloadUrl: `https://ecypro.com/account/exports/${userId}.json`,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
    lang: 'tr',
  });
}

async function contactSubmissionsForEmail(email: string) {
  // ContactSubmission has no userId (anon form) — match on email.
  const { prisma } = await import('../config/db');
  if (!email) return [];
  return prisma.contactSubmission.findMany({ where: { email } });
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
      logger.warn('[workers/gdpr-export] connection error', { message: err.message });
    });
    return conn;
  } catch (err) {
    logger.warn('[workers/gdpr-export] connection init failed', {
      message: (err as Error).message,
    });
    return null;
  }
}

export function startGdprExportWorker(): MinimalWorker | null {
  registerInlineHandler('gdpr-export', processGdprExportJob);

  if (worker) return worker;
  const bullmq = loadBullMQ();
  if (!bullmq) {
    logger.info('[workers/gdpr-export] BullMQ not installed — inline-only mode');
    return null;
  }
  const conn = makeWorkerConnection();
  if (!conn) {
    logger.info('[workers/gdpr-export] Redis unreachable — running in inline-only mode');
    return null;
  }

  const opts: MinimalWorkerOptions = {
    connection: conn,
    prefix: QUEUE_PREFIX,
    concurrency: Number.parseInt(process.env.GDPR_WORKER_CONCURRENCY ?? '2', 10) || 2,
    // GDPR export reads multiple tables — give it a roomy lock.
    lockDuration: 120_000,
  };

  worker = new bullmq.Worker<GdprExportJobPayload>(
    QUEUE_NAME,
    async (job: MinimalJob<GdprExportJobPayload>) => {
      const start = Date.now();
      try {
        await processGdprExportJob(job.data);
        logger.info('[workers/gdpr-export] job processed', {
          jobId: job.id,
          userId: job.data.userId,
          durationMs: Date.now() - start,
        });
      } catch (err) {
        logger.warn('[workers/gdpr-export] job failed', {
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
      logger.error('[workers/gdpr-export] DEAD-LETTER — exceeded attempts', {
        jobId: job.id,
        userId: (job.data as { userId?: string } | undefined)?.userId,
        message: err.message,
      });
    }
  });

  logger.info('[workers/gdpr-export] started', { concurrency: opts.concurrency });
  return worker;
}

export async function stopGdprExportWorker(): Promise<void> {
  if (!worker) return;
  try {
    await worker.close();
  } catch (err) {
    logger.warn('[workers/gdpr-export] stop failed', { message: (err as Error).message });
  }
  worker = null;
}
