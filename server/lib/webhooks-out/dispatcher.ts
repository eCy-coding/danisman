/**
 * P23 BE Track 2 / Aşama 2 — Outbound webhook dispatcher.
 *
 * `dispatch()` performs a single HTTP POST with HMAC headers, records the
 * outcome on the `WebhookDelivery` row, and bumps the subscription's
 * failure counters. Retry orchestration (exponential backoff) lives one
 * layer up in the BullMQ delivery worker; this module is "send + record"
 * only so it's trivially mockable in tests.
 *
 * Retry schedule (5 attempts, jitter applied at the worker level):
 *   attempt 1 → 30s
 *   attempt 2 → 2 min
 *   attempt 3 → 8 min
 *   attempt 4 → 30 min
 *   attempt 5 → 2 h
 *
 * After 10 consecutive subscription-level failures the subscription is
 * deactivated and the owner notified.
 */

import { prisma } from '../../config/db';
import { logger } from '../../config/logger';
import { sign } from './signer';

/** Per-attempt timeout. Tight to keep the worker from being starved on a
 * partner with a slow endpoint. Five attempts × 5s = 25s worst case. */
const REQUEST_TIMEOUT_MS = Number(process.env.WEBHOOK_OUT_TIMEOUT_MS) || 5_000;

/** Delete subscriptions after this many consecutive failures. */
export const DEACTIVATE_AT_FAILURE_COUNT = 10;

export interface DispatchOptions {
  deliveryId: string;
  subscriptionId: string;
  eventType: string;
  payload: unknown;
}

export interface DispatchResult {
  ok: boolean;
  responseStatus?: number;
  responseBodySnip?: string;
  errorMessage?: string;
}

export async function dispatch(opts: DispatchOptions): Promise<DispatchResult> {
  const subscription = await prisma.webhookSubscription
    .findUnique({ where: { id: opts.subscriptionId } })
    .catch(() => null);

  if (!subscription) {
    return { ok: false, errorMessage: 'subscription_not_found' };
  }
  if (!subscription.active) {
    return { ok: false, errorMessage: 'subscription_inactive' };
  }

  // The body is signed verbatim — no canonical JSON ordering needed because
  // `JSON.stringify` over a typed payload is deterministic for our event
  // shapes. Recipients receive the byte-exact body that was signed.
  const body = JSON.stringify({
    event: opts.eventType,
    deliveryId: opts.deliveryId,
    payload: opts.payload,
    timestamp: new Date().toISOString(),
  });
  const headers = sign({
    secret: subscription.secret,
    body,
    deliveryId: opts.deliveryId,
    eventType: opts.eventType,
  });

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let result: DispatchResult;
  try {
    const r = await fetch(subscription.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
    const snip = await snipBody(r);
    if (r.ok) {
      result = { ok: true, responseStatus: r.status, responseBodySnip: snip };
    } else {
      result = {
        ok: false,
        responseStatus: r.status,
        responseBodySnip: snip,
        errorMessage: `http_${r.status}`,
      };
    }
  } catch (err) {
    const message = (err as Error).message || 'unknown';
    result = { ok: false, errorMessage: message.includes('abort') ? 'timeout' : message };
  } finally {
    clearTimeout(t);
  }

  await recordOutcome(opts, subscription.id, result).catch((e) =>
    logger.warn('[webhooks-out] persist outcome failed', { message: (e as Error).message }),
  );
  return result;
}

async function snipBody(r: Response): Promise<string | undefined> {
  try {
    const text = await r.text();
    if (!text) return undefined;
    // 4 KB is enough to triage; full body is too noisy at scale.
    return text.length > 4096 ? `${text.slice(0, 4096)}…` : text;
  } catch {
    return undefined;
  }
}

async function recordOutcome(
  opts: DispatchOptions,
  subscriptionId: string,
  result: DispatchResult,
): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.webhookDelivery.update({
      where: { id: opts.deliveryId },
      data: {
        status: result.ok ? 'success' : 'failed',
        attemptCount: { increment: 1 },
        lastAttemptAt: now,
        responseStatus: result.responseStatus,
        responseBodySnip: result.responseBodySnip,
        errorMessage: result.errorMessage,
      },
    }),
    prisma.webhookSubscription.update({
      where: { id: subscriptionId },
      data: result.ok
        ? { failureCount: 0, lastSuccess: now }
        : {
            failureCount: { increment: 1 },
            lastFailure: now,
          },
    }),
  ]);

  if (!result.ok) {
    // Re-read the row to check the new counter without racing the increment.
    const sub = await prisma.webhookSubscription.findUnique({
      where: { id: subscriptionId },
      select: { failureCount: true, active: true, userId: true, url: true },
    });
    if (sub && sub.active && sub.failureCount >= DEACTIVATE_AT_FAILURE_COUNT) {
      await prisma.webhookSubscription.update({
        where: { id: subscriptionId },
        data: { active: false },
      });
      logger.warn('[webhooks-out] subscription auto-deactivated', {
        subscriptionId,
        userId: sub.userId,
        url: sub.url,
        failureCount: sub.failureCount,
      });
    }
  }
}
