/**
 * P17 BE Track 2 / Aşama 1 — Worker orchestration entry point.
 *
 * Provides a single function the server bootstrap can call to spin up
 * all queue workers. On graceful shutdown the same orchestration
 * drains them in parallel.
 *
 * The standalone deploy mode (a dedicated Render worker dyno) imports
 * `./standalone.ts` which calls `startAllWorkers()` and waits for
 * SIGTERM. In single-process dev / preview the API process also
 * invokes `startAllWorkers()` so jobs flow without an extra container.
 *
 * P18 BE Track 2 — added `image-resize` (Aşama 1) + `audit-archive`
 * cron registrar (Aşama 4).
 */

import { startEmailWorker, stopEmailWorker } from './email-worker';
import { startGdprExportWorker, stopGdprExportWorker } from './gdpr-export-worker';
import { startCronWorker, stopCronWorker } from './cron-worker';
import { startImageResizeWorker, stopImageResizeWorker } from './image-resize-worker';
import {
  startAuditArchiveWorker,
  stopAuditArchiveWorker,
} from './audit-archive-worker';
import { logger } from '../config/logger';

export function startAllWorkers(): void {
  // Each `start*` is idempotent and always registers an inline handler,
  // even when Redis is unreachable. That keeps producer-side `enqueue()`
  // honest in single-process tests.
  startEmailWorker();
  startGdprExportWorker();
  startCronWorker();
  // P18 BE Track 2 / Aşama 1 — image variant fan-out worker.
  startImageResizeWorker();
  // P18 BE Track 2 / Aşama 4 — weekly audit-log archival cron registrar.
  startAuditArchiveWorker();
  logger.info(
    '[workers] all queue workers started (email, gdpr-export, cron, image-resize, audit-archive)',
  );
}

export async function stopAllWorkers(): Promise<void> {
  await Promise.allSettled([
    stopEmailWorker(),
    stopGdprExportWorker(),
    stopCronWorker(),
    stopImageResizeWorker(),
    stopAuditArchiveWorker(),
  ]);
  logger.info('[workers] all queue workers stopped');
}
