/**
 * Integration Outbox / Write-Ahead Log (WAL).
 *
 * Closes the cross-service partial-failure gap on the lead-capture funnel
 * (Form → Notion → Resend). Before a third-party side effect runs we persist a
 * PENDING row in `integration_outbox`; on success it flips to COMPLETED, on
 * error to FAILED (attempts++ , lastError). The error is RE-THROWN so the
 * caller's contract is unchanged — the WAL row is the durable record a Notion /
 * Resend blip can no longer erase.
 *
 * The `process-outbox` node-cron job (server/jobs/process-outbox.ts) sweeps
 * FAILED / PENDING rows, retries them via a (service, operation) registry, and
 * dead-letters (status='DLQ') after MAX_ATTEMPTS with a Telegram alert.
 *
 * payload MUST be sanitized — only what's needed to replay the operation.
 * Never API tokens, never full email bodies.
 */

import { prisma } from '../config/db';
import { logger } from '../config/logger';

export type OutboxService = 'NOTION' | 'RESEND' | 'CALENDLY';

export interface OutboxContext {
  service: OutboxService;
  operation: string;
  payload: Record<string, unknown>;
  traceId?: string;
}

const MAX_ERROR_LEN = 1000;

/**
 * Wrap a third-party integration call with a WAL entry.
 *
 * 1. Insert a PENDING row BEFORE the call.
 * 2. Run the operation.
 * 3. On success → COMPLETED, return the result.
 * 4. On failure → FAILED, attempts++, store lastError, then re-throw.
 */
export async function withOutboxRecord<T>(
  ctx: OutboxContext,
  operation: () => Promise<T>,
): Promise<T> {
  const record = await prisma.integrationOutbox.create({
    data: {
      service: ctx.service,
      operation: ctx.operation,
      payload: ctx.payload as object,
      traceId: ctx.traceId ?? null,
      status: 'PENDING',
    },
  });

  try {
    const result = await operation();
    await prisma.integrationOutbox.update({
      where: { id: record.id },
      data: { status: 'COMPLETED' },
    });
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.integrationOutbox.update({
      where: { id: record.id },
      data: {
        status: 'FAILED',
        lastError: msg.slice(0, MAX_ERROR_LEN),
        attempts: { increment: 1 },
      },
    });
    logger.warn('[outbox] operation failed — WAL row marked FAILED', {
      service: ctx.service,
      operation: ctx.operation,
      outboxId: record.id,
    });
    throw error;
  }
}
