import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { hashIp } from '../lib/crypto/hashIp';

const MAX_COMMENTS_PER_HOUR = 5;
const WINDOW_SEC = 3600;

export async function rateLimitComments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const rawIp = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  // KVKK m.4 + m.12 — canonical 32-char SHA-256 hex pseudonymization. The
  // raw IP NEVER reaches Redis; bucket key is the hash digest. Birthday
  // paradox over 2^128 makes collision negligible at our traffic scale, so
  // the shorter key (32 vs prior 64) is safe AND reduces store memory.
  const ipHash = hashIp(rawIp) ?? 'unknown';
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
