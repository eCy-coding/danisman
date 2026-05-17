/**
 * P23 BE Track 2 / Aşama 2 — Producer-side helper for emitting events to
 * every active subscription that listens for `eventType`.
 *
 *   await emitEvent('user.created', { userId, email });
 *
 * Flow:
 *   1. Look up active subscriptions that include `eventType` in `events`.
 *   2. Insert a `WebhookDelivery` row per subscription (status='pending').
 *   3. Enqueue a BullMQ job carrying the delivery id.
 *
 * The two-step (DB row + queue job) is intentional: even if BullMQ is
 * unavailable we still have a row to retry against later, and the admin
 * UI can show "queued" deliveries independently.
 */

import { prisma } from '../../config/db';
import { enqueue } from '../../queues';
import { logger } from '../../config/logger';

export interface EmitOptions {
  /** Skip subscriptions belonging to this user (e.g. don't echo your own event). */
  excludeUserId?: string;
  /** Override per-job priority (lower = sooner). */
  priority?: number;
}

export async function emitEvent(
  eventType: string,
  payload: unknown,
  opts: EmitOptions = {},
): Promise<{ enqueued: number }> {
  // Find subscribers — Postgres `String[]` `has` filter does the contains
  // check inside the DB; no app-side fan-out.
  const subscribers = await prisma.webhookSubscription
    .findMany({
      where: {
        active: true,
        events: { has: eventType },
        ...(opts.excludeUserId ? { NOT: { userId: opts.excludeUserId } } : {}),
      },
      select: { id: true },
    })
    .catch((err: unknown) => {
      logger.warn('[webhooks-out] subscriber lookup failed', { message: (err as Error).message });
      return [] as Array<{ id: string }>;
    });

  if (subscribers.length === 0) return { enqueued: 0 };

  let enqueued = 0;
  for (const sub of subscribers) {
    try {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          subscriptionId: sub.id,
          eventType,
          payload: payload as object,
          status: 'pending',
        },
        select: { id: true },
      });
      await enqueue(
        'webhook-out',
        {
          deliveryId: delivery.id,
          subscriptionId: sub.id,
          eventType,
          payload,
        },
        opts.priority !== undefined ? { priority: opts.priority } : {},
      );
      enqueued++;
    } catch (err) {
      logger.warn('[webhooks-out] enqueue failed', {
        subscriptionId: sub.id,
        eventType,
        message: (err as Error).message,
      });
    }
  }
  return { enqueued };
}
