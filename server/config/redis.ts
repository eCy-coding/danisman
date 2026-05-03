import Redis from 'ioredis';
import { logger } from './logger';

// Optional: Extract to env vars in production
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisConfig = {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    // Retry up to 3 times, then give up. Wait times: 50ms, 100ms, 150ms
    if (times > 3) {
      logger.warn('[Redis] Connection failed, falling back to memory store.');
      return null;
    }
    return Math.min(times * 50, 2000);
  },
};

export const redis = new Redis(REDIS_URL, redisConfig);

redis.on('error', (err) => {
  logger.error('[Redis] Error:', { message: err.message });
});

redis.on('connect', () => {
  logger.info('[Redis] Connected to cache server.');
});
