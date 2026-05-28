import crypto from 'crypto';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { logger } from '../config/logger';

const KEY_PREFIX = 'views:';
const UNIQUE_PREFIX = 'unique:';
const UNIQUE_TTL_SEC = 86400; // 24 hours dedup window

function viewKey(postId: string): string {
  return `${KEY_PREFIX}${postId}`;
}

function uniqueKey(postId: string, userHash: string): string {
  return `${UNIQUE_PREFIX}${postId}:${userHash}`;
}

export async function incrementView(postId: string, userHash?: string): Promise<void> {
  try {
    const pipeline = redis.pipeline();
    pipeline.incr(viewKey(postId));

    if (userHash) {
      const uKey = uniqueKey(postId, userHash);
      pipeline.set(uKey, '1', 'EX', UNIQUE_TTL_SEC, 'NX');
    }

    const results = await pipeline.exec();
    if (!results) return;

    // Only count unique if NX succeeded (result[1][1] === 1)
    if (userHash && results[1]?.[1] === 1) {
      await redis.incr(`unique_views:${postId}`);
    }
  } catch (err) {
    logger.error('[viewCounter] incrementView failed', { postId, error: err });
  }
}

export async function flushViewsToDB(): Promise<{ updated: number }> {
  let updated = 0;

  try {
    const keys = await redis.keys(`${KEY_PREFIX}*`);
    if (keys.length === 0) return { updated: 0 };

    const pipeline = redis.pipeline();
    for (const key of keys) {
      pipeline.getdel(key);
    }
    const results = await pipeline.exec();
    if (!results) return { updated: 0 };

    const updates: Array<{ postId: string; delta: number }> = [];
    for (let i = 0; i < keys.length; i++) {
      const raw = results[i]?.[1];
      const delta = typeof raw === 'string' ? parseInt(raw, 10) : 0;
      if (delta > 0) {
        const postId = (keys[i] as string).slice(KEY_PREFIX.length);
        updates.push({ postId, delta });
      }
    }

    for (const { postId, delta } of updates) {
      await prisma.blogPost.update({
        where: { id: postId },
        data: { viewCount: { increment: delta } },
      });
      updated++;
    }

    logger.info('[viewCounter] flushViewsToDB complete', { updated, total: keys.length });
  } catch (err) {
    logger.error('[viewCounter] flushViewsToDB failed', { error: err });
  }

  return { updated };
}

export function hashUserIdentifier(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
