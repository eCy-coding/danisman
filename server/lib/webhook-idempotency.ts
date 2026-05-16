/**
 * P17 BE Track 2 / Aşama 5 — Webhook idempotency persistence helper.
 *
 * External webhook handlers (Cal.com, Stripe, Telegram, etc.) call
 * `recordAndCheck()` with the deduplication tuple. The helper:
 *   1. Upserts a `WebhookEvent` row keyed on (source, externalId).
 *   2. Returns `{ alreadyProcessed: true }` if `processedAt` is set —
 *      handlers should short-circuit with 200 OK so the vendor stops
 *      retrying.
 *   3. Returns `{ alreadyProcessed: false, eventId }` otherwise —
 *      handlers do their work and call `markProcessed(eventId)` (or
 *      `markFailed(eventId, err)`).
 *
 * Why a table and not just Redis?
 *   - We want a forensic record. If Cal.com retries 3 days later because
 *     their queue got rescheduled, we still want to know "we saw this
 *     and skipped it". Redis would have evicted it.
 *   - JSON payload aids debugging "why didn't this webhook update the
 *     booking" — we can replay against the persisted body.
 *   - The unique constraint on (source, externalId) gives us atomic
 *     dedup at the DB level; no application-side race.
 */

import { prisma } from '../config/db';
import { logger } from '../config/logger';

export interface RecordAndCheckInput {
  source: string;
  externalId: string;
  signature?: string;
  payload: unknown;
}

export interface RecordAndCheckResult {
  alreadyProcessed: boolean;
  eventId: string;
}

export async function recordAndCheck(input: RecordAndCheckInput): Promise<RecordAndCheckResult> {
  // We use `upsert` so the call is atomic: if the row exists we read it,
  // otherwise we insert it in a single round-trip. Prisma compiles this
  // to an ON CONFLICT statement against the unique index.
  //
  // The cast to `any` is required because Prisma client types are
  // generated AFTER migration apply — in the sandbox we haven't run
  // `prisma generate` against the new schema yet. The cast scopes to a
  // single statement and the runtime contract is enforced by the
  // migration's UNIQUE index regardless.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = prisma as any;
  const row = await client.webhookEvent.upsert({
    where: {
      WebhookEvent_source_externalId_unique: {
        source: input.source,
        externalId: input.externalId,
      },
    },
    create: {
      source: input.source,
      externalId: input.externalId,
      signature: input.signature ?? null,
      payload: input.payload as object,
    },
    update: {
      // No-op write — keeps the existing row, only refreshes signature if
      // we have a newer signed delivery (vendor key rotation).
      signature: input.signature ?? undefined,
    },
  });

  return {
    alreadyProcessed: row.processedAt !== null,
    eventId: row.id,
  };
}

export async function markProcessed(eventId: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = prisma as any;
    await client.webhookEvent.update({
      where: { id: eventId },
      data: { processedAt: new Date(), error: null },
    });
  } catch (err) {
    logger.warn('[webhook-idempotency] markProcessed failed', {
      eventId,
      message: (err as Error).message,
    });
  }
}

export async function markFailed(eventId: string, err: Error | string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = prisma as any;
    await client.webhookEvent.update({
      where: { id: eventId },
      data: {
        error: String(err instanceof Error ? err.message : err).slice(0, 1024),
      },
    });
  } catch (e) {
    logger.warn('[webhook-idempotency] markFailed failed', {
      eventId,
      message: (e as Error).message,
    });
  }
}
