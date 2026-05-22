/**
 * P18 BE Track 2 / Aşama 4 — Audit-log archival cron registrar.
 *
 * `audit_logs` grows unbounded — every admin action, role change, setting
 * mutation, manual deletion lands a row. Past a 90-day retention window
 * the active query load (admin dashboards, "what changed last week"
 * filters) rarely touches them. This worker:
 *
 *   1. Streams `audit_logs` older than `retentionDays` (default 90) in
 *      batches of `BATCH_SIZE` rows.
 *   2. Serialises each batch to JSON, gzip-compresses, and writes to
 *      the storage adapter under `audit-archive/<yyyy>/<mm>/<window>.json.gz`.
 *   3. Inserts an `archived_audit_logs` pointer row (idempotent on
 *      `coldKey` UNIQUE — a re-run of the same window is a no-op).
 *   4. Deletes the archived rows from `audit_logs` ONLY after the cold
 *      write + pointer row succeed (two-phase, no orphan rows).
 *
 * Idempotency:
 *   - `coldKey` derives from the window's calendar date so an accidental
 *     re-run targets the same object name. The UNIQUE constraint short-
 *     circuits the duplicate insert; the row count delta is 0 and no
 *     audit-log rows are deleted twice.
 *
 * The worker registers itself as the `audit-log-archive` cron handler;
 * the existing P17 cron queue dispatches it. The Sunday-03:00 schedule
 * is set up by `scripts/seed-audit-archive-cron.mjs` (operator runs once).
 */

import { gzipSync } from 'node:zlib';
import { getStorage } from '../lib/storage';
import { logger } from '../config/logger';

const BATCH_SIZE = Number.parseInt(process.env.AUDIT_ARCHIVE_BATCH ?? '5000', 10) || 5000;

interface AuditRow {
  id: string;
  adminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/** Pure function — given rows, return a deterministic cold-storage payload. */
export function buildArchivePayload(rows: AuditRow[]): {
  json: string;
  gz: Buffer;
  rowCount: number;
  windowStart: Date;
  windowEnd: Date;
} {
  const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const windowStart = sorted[0]?.createdAt ?? new Date(0);
  const windowEnd = sorted[sorted.length - 1]?.createdAt ?? new Date(0);
  const json = JSON.stringify(
    {
      version: 1,
      rowCount: sorted.length,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      rows: sorted,
    },
    null,
    0,
  );
  const gz = gzipSync(Buffer.from(json, 'utf8'));
  return { json, gz, rowCount: sorted.length, windowStart, windowEnd };
}

/** Deterministic key. Two runs over the same date window emit the same key. */
function archiveKey(windowEnd: Date): string {
  const yyyy = windowEnd.getUTCFullYear();
  const mm = String(windowEnd.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(windowEnd.getUTCDate()).padStart(2, '0');
  return `audit-archive/${yyyy}/${mm}/${yyyy}-${mm}-${dd}.json.gz`;
}

/**
 * The actual archival flow. Exposed for unit tests + manual operator runs.
 *
 * Returns a JSON-friendly summary an operator (or scheduled-task UI) can
 * surface.
 */
export async function archiveAuditLogs(opts: { retentionDays: number }): Promise<{
  rowsArchived: number;
  bytesCompressed: number;
  coldKey: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  alreadyArchived: boolean;
}> {
  const { prisma } = await import('../config/db');
  const storage = getStorage();
  const cutoff = new Date(Date.now() - opts.retentionDays * 24 * 3600_000);

  const rows = (await prisma.auditLog.findMany({
    where: { createdAt: { lt: cutoff } },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  })) as unknown as AuditRow[];

  if (rows.length === 0) {
    logger.info('[workers/audit-archive] no rows older than retention window', {
      retentionDays: opts.retentionDays,
      cutoff: cutoff.toISOString(),
    });
    return {
      rowsArchived: 0,
      bytesCompressed: 0,
      coldKey: null,
      windowStart: null,
      windowEnd: null,
      alreadyArchived: false,
    };
  }

  const payload = buildArchivePayload(rows);
  const coldKey = archiveKey(payload.windowEnd);

  // Idempotency — bail if this window already has a pointer row.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (prisma as any).archivedAuditLog.findUnique({
    where: { coldKey },
  });
  if (existing) {
    logger.info('[workers/audit-archive] window already archived — skip', { coldKey });
    return {
      rowsArchived: 0,
      bytesCompressed: existing.bytesCompressed,
      coldKey,
      windowStart: existing.windowStart.toISOString(),
      windowEnd: existing.windowEnd.toISOString(),
      alreadyArchived: true,
    };
  }

  // 1) Cold write FIRST — if storage is down we abort cleanly without
  //    touching the hot table.
  await storage.put({
    key: coldKey,
    body: payload.gz,
    contentType: 'application/gzip',
    cacheControl: 'private, max-age=0',
    metadata: {
      rowCount: String(payload.rowCount),
      windowStart: payload.windowStart.toISOString(),
      windowEnd: payload.windowEnd.toISOString(),
    },
  });

  // 2) Pointer row (creates the durable manifest).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).archivedAuditLog.create({
    data: {
      coldKey,
      windowStart: payload.windowStart,
      windowEnd: payload.windowEnd,
      rowsArchived: payload.rowCount,
      bytesCompressed: payload.gz.byteLength,
    },
  });

  // 3) Delete archived rows from hot table. IDs are durable; we delete by
  //    primary-key set so a concurrent INSERT into audit_logs is unaffected.
  const ids = rows.map((r) => r.id);
  const deleted = await prisma.auditLog.deleteMany({ where: { id: { in: ids } } });

  logger.info('[workers/audit-archive] archived window', {
    coldKey,
    rowsArchived: payload.rowCount,
    rowsDeleted: deleted.count,
    bytesCompressed: payload.gz.byteLength,
  });

  return {
    rowsArchived: payload.rowCount,
    bytesCompressed: payload.gz.byteLength,
    coldKey,
    windowStart: payload.windowStart.toISOString(),
    windowEnd: payload.windowEnd.toISOString(),
    alreadyArchived: false,
  };
}

/**
 * Worker registrar.
 *
 * No standalone BullMQ Worker process here — the existing cron-worker
 * (`server/workers/cron-worker.ts`) is the only consumer of the `cron`
 * queue and its switch dispatches `audit-log-archive` directly to
 * `archiveAuditLogs`. The start/stop functions are kept for symmetry
 * with the other workers and to give operators a single entry point if
 * we ever decompose the archival flow onto its own queue.
 */

let started = false;

export function startAuditArchiveWorker(): void {
  if (started) return;
  started = true;
  logger.info('[workers/audit-archive] dispatch ready (handled inline by cron-worker)');
}

export async function stopAuditArchiveWorker(): Promise<void> {
  started = false;
}
