/**
 * P23 BE Track 2 / Aşama 1 — Topic publish facade + BullMQ → SSE bridge.
 *
 * `publish(topic, event)` is the only import producers should reach for.
 * It keeps the `getSseManager()` lookup, fallback (when SSE is disabled in
 * a test process), and metrics emission in one place.
 *
 * `attachJobBridge()` is called once at server bootstrap. It registers
 * BullMQ lifecycle listeners on the existing queues so a completed
 * `email`/`gdpr-export`/`image-resize` job pushes a `job:done` event to
 * the user who owns the job (payload typically carries `userId`).
 */

import type { SseEvent } from './sse-manager';
import { getSseManager } from './sse-manager';
import { getQueue } from '../../queues';
import { logger } from '../../config/logger';

/**
 * Canonical topic names. Anything not in this enum is still accepted —
 * adding it here is just a contract reminder for code-review.
 */
export const TOPICS = {
  /** System-wide notification banner (admin push). */
  systemNotice: 'system:notice',
  /** New blog comment broadcast. */
  blogComments: 'blog:comments',
  /** Admin presence indicator. */
  adminPresence: 'admin:presence',
  /** Per-user job completion. Subscriber filters by their own userId. */
  jobDone: 'job:done',
  /** Live analytics KPI tick. */
  analyticsTick: 'analytics:tick',
} as const;

export type CanonicalTopic = (typeof TOPICS)[keyof typeof TOPICS];

export function publish(topic: string, event: SseEvent): number {
  try {
    const n = getSseManager().publish(topic, event);
    if (n > 0) {
      logger.debug?.('[sse] published', { topic, fanout: n });
    }
    return n;
  } catch (err) {
    logger.warn('[sse] publish failed', { topic, message: (err as Error).message });
    return 0;
  }
}

export function publishToUser(userId: string, event: SseEvent): number {
  try {
    return getSseManager().publishToUser(userId, event);
  } catch (err) {
    logger.warn('[sse] publishToUser failed', { userId, message: (err as Error).message });
    return 0;
  }
}

// ── BullMQ → SSE bridge ─────────────────────────────────────────────────────

let bridgeAttached = false;

/**
 * Wire each of our BullMQ queues' QueueEvents stream into the SSE manager.
 * Idempotent — calling twice is a no-op.
 *
 * The bridge listens to job lifecycle events (`completed`, `failed`) and
 * pushes a typed envelope to the owning user. Topic-level subscribers see
 * the anonymised aggregate event under `job:done` (no payload PII).
 */
export function attachJobBridge(): void {
  if (bridgeAttached) return;
  bridgeAttached = true;

  const queueNames = ['email', 'gdpr-export', 'cron', 'image-resize'] as const;
  for (const name of queueNames) {
    const q = getQueue(name);
    if (!q) {
      logger.info(`[sse-bridge] queue ${name} unavailable — bridge skipped`);
      continue;
    }
    // BullMQ Queue extends QueueEvents-like emitter via QueueEvents class.
    // The minimal type exposed in queues/bullmq-types.ts may not include
    // .on. We defer to `unknown` and use a guard so the bridge stays
    // optional in inline/sandbox runs.
    const emitter = q as unknown as {
      on?: (event: string, cb: (...args: unknown[]) => void) => unknown;
    };
    if (typeof emitter.on !== 'function') {
      logger.debug?.(`[sse-bridge] queue ${name} has no on(); skipping`);
      continue;
    }

    try {
      emitter.on('completed', (job: unknown) => {
        const userId = extractUserId(job);
        if (!userId) return;
        publishToUser(userId, {
          type: 'job:done',
          data: { queue: name, status: 'completed', jobId: extractJobId(job) },
        });
      });
      emitter.on('failed', (job: unknown) => {
        const userId = extractUserId(job);
        if (!userId) return;
        publishToUser(userId, {
          type: 'job:done',
          data: { queue: name, status: 'failed', jobId: extractJobId(job) },
        });
      });
    } catch (err) {
      logger.warn(`[sse-bridge] failed to attach to queue ${name}`, {
        message: (err as Error).message,
      });
    }
  }
}

function extractUserId(job: unknown): string | null {
  if (!job || typeof job !== 'object') return null;
  const data = (job as { data?: { userId?: unknown } }).data;
  if (data && typeof data === 'object' && typeof data.userId === 'string') return data.userId;
  return null;
}

function extractJobId(job: unknown): string | undefined {
  if (!job || typeof job !== 'object') return undefined;
  const id = (job as { id?: unknown }).id;
  return typeof id === 'string' ? id : undefined;
}
