/**
 * P17 BE Track 2 / Aşama 1 — Standalone worker process entry point.
 *
 * Used by the Render worker dyno (or `npm run workers`) to run the
 * BullMQ workers OUTSIDE the API process. Same handler registry as
 * `server/index.ts`, no HTTP listener.
 *
 * Why a separate process in prod?
 *   - Workers benefit from a dedicated CPU/memory budget so a long
 *     GDPR export can't squeeze the API event loop.
 *   - Restart cadence is independent of the API — patching the email
 *     worker shouldn't require an API rolling deploy.
 *
 * Local dev: `tsx server/workers/standalone.ts`.
 */

import '../env';
import { startAllWorkers, stopAllWorkers } from './index';
import { closeQueues } from '../queues';
import { logger } from '../config/logger';

startAllWorkers();
logger.info('[workers/standalone] standalone worker process up');

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`[workers/standalone] ${signal} — draining workers`);
  await stopAllWorkers();
  await closeQueues();
  logger.info('[workers/standalone] drained — exiting 0');
  process.exit(0);
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
