/**
 * Outbox retry processor — drains the integration WAL.
 *
 * Every 5 minutes it sweeps `integration_outbox` rows that are PENDING/FAILED,
 * under MAX_ATTEMPTS, and older than MIN_AGE (so we don't race the original
 * call). Each row is replayed via REGISTRY[`${service}:${operation}`]. On
 * success → COMPLETED; on failure → attempts++ (FAILED, or DLQ once the budget
 * is spent). A row that lands in DLQ fires a Telegram alert for the operator.
 *
 * Idempotency: re-executors call the RAW service operation (e.g.
 * `upsertProspectRaw`), which never writes a fresh outbox row, so a replay
 * cannot fan out into new WAL entries. Notion upsert is idempotent by email;
 * the contact autoresponder re-send is acceptable at-least-once.
 *
 * Disable with DISABLE_OUTBOX_CRON=1 (the rollback lever in the PR).
 */

import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { notify } from '../lib/telegram';

const MAX_ATTEMPTS = 5;
const MIN_AGE_MINUTES = 2;
const BATCH_LIMIT = 50;
const SCHEDULE = '*/5 * * * *'; // every 5 minutes

/**
 * (service:operation) → replay function. Each receives the persisted payload.
 * Re-executors MUST throw on failure so attempts/DLQ accounting is correct, and
 * MUST call the RAW (un-wrapped) service op to avoid creating new outbox rows.
 */
const REGISTRY: Record<string, (payload: Record<string, unknown>) => Promise<void>> = {
  'NOTION:upsertProspect': async (payload) => {
    const { upsertProspectRaw } = await import('../services/notion');
    const input = payload as unknown as Parameters<typeof upsertProspectRaw>[0];
    const id = await upsertProspectRaw(input);
    if (id === null) {
      throw new Error('Notion upsert returned null on retry (write failed)');
    }
  },
  'RESEND:sendAutoresponder': async (payload) => {
    const { sendContactAck } = await import('../services/contact-ack');
    const p = payload as { to: string; name: string; kind: 'contact' | 'booking' };
    await sendContactAck({ to: p.to, name: p.name, kind: p.kind });
  },
};

/** One sweep of the outbox. Exported for tests + manual invocation. */
export async function processOutbox(): Promise<void> {
  const cutoff = new Date(Date.now() - MIN_AGE_MINUTES * 60 * 1000);

  const rows = await prisma.integrationOutbox.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      attempts: { lt: MAX_ATTEMPTS },
      updatedAt: { lt: cutoff },
    },
    take: BATCH_LIMIT,
    orderBy: { createdAt: 'asc' },
  });

  if (rows.length === 0) return;
  logger.info('[outbox] retry sweep', { candidates: rows.length });

  for (const row of rows) {
    const key = `${row.service}:${row.operation}`;
    const executor = REGISTRY[key];
    if (!executor) {
      logger.warn('[outbox] no executor registered — row will be skipped', {
        key,
        outboxId: row.id,
      });
      continue;
    }

    try {
      await executor(row.payload as Record<string, unknown>);
      await prisma.integrationOutbox.update({
        where: { id: row.id },
        data: { status: 'COMPLETED' },
      });
      logger.info('[outbox] retry succeeded', { key, outboxId: row.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const nextAttempts = row.attempts + 1;
      const nextStatus = nextAttempts >= MAX_ATTEMPTS ? 'DLQ' : 'FAILED';

      await prisma.integrationOutbox.update({
        where: { id: row.id },
        data: {
          status: nextStatus,
          attempts: nextAttempts,
          lastError: msg.slice(0, 1000),
        },
      });

      if (nextStatus === 'DLQ') {
        logger.error('[outbox] DLQ — exhausted retries', {
          key,
          outboxId: row.id,
          attempts: nextAttempts,
        });
        // Operator alert. notify() never throws (circuit-broken internally).
        await notify('error', `Outbox DLQ: ${key}`, {
          id: row.id,
          attempts: nextAttempts,
          lastError: msg.slice(0, 200),
        });
      } else {
        logger.warn('[outbox] retry failed — will retry', {
          key,
          outboxId: row.id,
          attempts: nextAttempts,
        });
      }
    }
  }
}

let task: ScheduledTask | null = null;

/** Start the node-cron processor. Idempotent; gated by DISABLE_OUTBOX_CRON. */
export function startOutboxProcessor(): void {
  if (process.env.DISABLE_OUTBOX_CRON === '1') {
    logger.info('[outbox] processor disabled via DISABLE_OUTBOX_CRON=1');
    return;
  }
  if (task) {
    logger.warn('[outbox] processor already running');
    return;
  }
  logger.info('[outbox] processor starting — schedule every 5 minutes');
  task = cron.schedule(
    SCHEDULE,
    async () => {
      try {
        await processOutbox();
      } catch (err) {
        logger.error('[outbox] sweep error', { message: (err as Error).message });
      }
    },
    { timezone: 'UTC' },
  );
}

/** Graceful shutdown. */
export function stopOutboxProcessor(): void {
  if (!task) return;
  task.stop();
  task = null;
  logger.info('[outbox] processor stopped');
}
