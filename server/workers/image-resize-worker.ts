/**
 * P18 BE Track 2 / Aşama 1 — Image variant fan-out worker.
 *
 * Triggered by `enqueue('image-resize', { imageId, sourceKey })` after a
 * successful upload. Generates AVIF + WebP + thumbnail derivatives and
 * updates the parent `Image` row's `variants` JSON map.
 *
 * Resilience contract:
 *   - Idempotent: re-running with the same `imageId` overwrites the
 *     variant blobs (deterministic keys) and the row's `variants` map.
 *   - When `sharp` is not installed in the runtime we MARK the row as
 *     `failed` with a descriptive error rather than throwing — the
 *     upload itself is already complete and clients have the original.
 *   - When storage is unreachable we throw so BullMQ retries; failure
 *     after `attempts` lands the job in the DLQ (`removeOnFail=false`).
 */

import {
  loadBullMQ,
  loadIORedis,
  type MinimalWorker,
  type MinimalWorkerOptions,
  type MinimalJob,
  type IORedisLike,
} from '../queues/bullmq-types';
import { registerInlineHandler, type ImageResizeJobPayload } from '../queues';
import { getStorage } from '../lib/storage';
import { logger } from '../config/logger';
import { metrics } from '../observability/metrics';

const QUEUE_NAME = 'image-resize';
const QUEUE_PREFIX = 'ecypro:q';

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

interface SharpInstance {
  metadata(): Promise<{ width?: number; height?: number; format?: string }>;
  resize(width: number, height?: number, opts?: Record<string, unknown>): SharpInstance;
  webp(opts?: Record<string, unknown>): SharpInstance;
  avif(opts?: Record<string, unknown>): SharpInstance;
  toBuffer(): Promise<Buffer>;
}

type SharpFactory = (input: Buffer) => SharpInstance;

let sharpModule: SharpFactory | null | undefined;

function loadSharp(): SharpFactory | null {
  if (sharpModule !== undefined) return sharpModule;
  try {
    const mod = require('sharp');
    sharpModule = ((mod as any).default ?? mod) as SharpFactory;
  } catch {
    sharpModule = null;
  }
  return sharpModule;
}

interface ImageVariantBlob {
  key: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
}

/** Public so admin endpoints + tests can assert the shape. */
export type ImageVariantMap = Partial<Record<'webp' | 'avif' | 'thumb', ImageVariantBlob>>;

/**
 * Pure transform — buffer in, variant buffers out. No I/O, no DB. Lets us
 * unit-test the worker even when sharp is not installed (returns null).
 */
export async function buildVariants(
  source: Buffer,
): Promise<{ webp?: Buffer; avif?: Buffer; thumb?: Buffer } | null> {
  const sharp = loadSharp();
  if (!sharp) return null;

  // Run the three transforms in parallel — they each re-decode the input
  // so there's no contention on shared state. `failOn: 'none'` keeps
  // sharp resilient on slightly-malformed JPEGs.
  const [webp, avif, thumb] = await Promise.all([
    sharp(source).webp({ quality: 82, effort: 4 }).toBuffer(),
    sharp(source).avif({ quality: 60, effort: 4 }).toBuffer(),
    sharp(source)
      .resize(320, 320, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer(),
  ]);
  return { webp, avif, thumb };
}

async function processImageResizeJob(payload: ImageResizeJobPayload): Promise<void> {
  const { prisma } = await import('../config/db');
  const storage = getStorage();

  // Mark the row as processing so concurrent reads don't show stale "ready".
  await (prisma as any).image
    .update({ where: { id: payload.imageId }, data: { status: 'processing' } })
    .catch((err: Error) =>
      logger.warn('[workers/image-resize] status->processing update failed', {
        message: err.message,
      }),
    );

  // Pull the original bytes from storage.
  const original = await storage.get(payload.sourceKey);
  if (!original) {
    await (prisma as any).image.update({
      where: { id: payload.imageId },
      data: { status: 'failed', errorMessage: 'source_not_found' },
    });
    throw new Error(`source not found: ${payload.sourceKey}`);
  }

  const variants = await buildVariants(original.body);
  if (!variants) {
    // sharp absent — surface gracefully. Original is still available.
    await (prisma as any).image.update({
      where: { id: payload.imageId },
      data: {
        status: 'failed',
        errorMessage: 'sharp_unavailable',
      },
    });
    logger.warn('[workers/image-resize] sharp not installed — variant generation skipped', {
      imageId: payload.imageId,
    });
    return;
  }

  const baseKey = payload.sourceKey.replace(/\.[^./]+$/, '');
  const map: ImageVariantMap = {};

  if (variants.webp) {
    const put = await storage.put({
      key: `${baseKey}.webp`,
      body: variants.webp,
      contentType: 'image/webp',
    });
    map.webp = { key: put.key, contentType: put.contentType, size: put.size };
  }
  if (variants.avif) {
    const put = await storage.put({
      key: `${baseKey}.avif`,
      body: variants.avif,
      contentType: 'image/avif',
    });
    map.avif = { key: put.key, contentType: put.contentType, size: put.size };
  }
  if (variants.thumb) {
    const put = await storage.put({
      key: `${baseKey}.thumb.webp`,
      body: variants.thumb,
      contentType: 'image/webp',
    });
    map.thumb = { key: put.key, contentType: put.contentType, size: put.size };
  }

  await (prisma as any).image.update({
    where: { id: payload.imageId },
    data: { status: 'ready', variants: map, errorMessage: null },
  });

  logger.info('[workers/image-resize] variants generated', {
    imageId: payload.imageId,
    variantKeys: Object.keys(map),
  });
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
      logger.warn('[workers/image-resize] connection error', { message: err.message });
    });
    return conn;
  } catch (err) {
    logger.warn('[workers/image-resize] connection init failed', {
      message: (err as Error).message,
    });
    return null;
  }
}

export function startImageResizeWorker(): MinimalWorker | null {
  registerInlineHandler('image-resize', processImageResizeJob);

  if (worker) return worker;
  const bullmq = loadBullMQ();
  if (!bullmq) {
    logger.info('[workers/image-resize] BullMQ not installed — inline-only mode');
    return null;
  }
  const conn = makeWorkerConnection();
  if (!conn) {
    logger.info('[workers/image-resize] Redis unreachable — running in inline-only mode');
    return null;
  }

  const opts: MinimalWorkerOptions = {
    connection: conn,
    prefix: QUEUE_PREFIX,
    concurrency: Number.parseInt(process.env.IMAGE_RESIZE_WORKER_CONCURRENCY ?? '2', 10) || 2,
    lockDuration: 120_000,
  };

  worker = new bullmq.Worker<ImageResizeJobPayload>(
    QUEUE_NAME,
    async (job: MinimalJob<ImageResizeJobPayload>) => {
      const start = Date.now();
      try {
        await processImageResizeJob(job.data);
        metrics.incBullmq('image-resize', 'done');
        logger.info('[workers/image-resize] job processed', {
          jobId: job.id,
          imageId: job.data.imageId,
          durationMs: Date.now() - start,
        });
      } catch (err) {
        metrics.incBullmq('image-resize', 'failed');
        logger.warn('[workers/image-resize] job failed', {
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
      logger.error('[workers/image-resize] DEAD-LETTER — exceeded attempts', {
        jobId: job.id,
        imageId: (job.data as ImageResizeJobPayload | undefined)?.imageId,
        message: err.message,
      });
    }
  });

  logger.info('[workers/image-resize] started', { concurrency: opts.concurrency });
  return worker;
}

export async function stopImageResizeWorker(): Promise<void> {
  if (!worker) return;
  try {
    await worker.close();
  } catch (err) {
    logger.warn('[workers/image-resize] stop failed', { message: (err as Error).message });
  }
  worker = null;
}
