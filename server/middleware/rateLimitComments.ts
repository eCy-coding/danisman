import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

const MAX_COMMENTS_PER_HOUR = 5;
const WINDOW_SEC = 3600;

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export async function rateLimitComments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const rawIp = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const ipHash = hashIp(rawIp);
  const key = `comment:ratelimit:${ipHash}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SEC);
    }

    if (count > MAX_COMMENTS_PER_HOUR) {
      const ttl = await redis.ttl(key);
      res.status(429).json({
        status: 'error',
        message: 'Çok fazla yorum gönderdiniz. Lütfen bir süre bekleyiniz.',
        retryAfter: ttl > 0 ? ttl : WINDOW_SEC,
      });
      return;
    }

    next();
  } catch (err) {
    logger.warn('[rateLimitComments] Redis error — bypassing rate limit', { error: err });
    next();
  }
}
