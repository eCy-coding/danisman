import cron from 'node-cron';
import { flushViewsToDB } from '../services/viewCounter';
import { logger } from '../config/logger';

// Nightly at 03:00 — batch flush Redis view counts to Postgres
const SCHEDULE = '0 3 * * *';

export function startFlushViewCountJob(): void {
  cron.schedule(
    SCHEDULE,
    async () => {
      logger.info('[flushViewCountJob] Starting nightly view count flush');
      const { updated } = await flushViewsToDB();
      logger.info('[flushViewCountJob] Flush complete', { updated });
    },
    { timezone: 'Europe/Istanbul' },
  );

  logger.info('[flushViewCountJob] Scheduled', { schedule: SCHEDULE });
}
