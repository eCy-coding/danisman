import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { logger } from '../config/logger';

export interface SearchFilters {
  domain?: string[];
  tag?: string[];
  from?: string;
  to?: string;
  lang?: 'simple' | 'english';
}

export interface SearchResult {
  postId: string;
  rank: number;
  title: string;
  excerpt: string;
  domain: string;
  publishedAt: Date | null;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  cached: boolean;
}

// Redis client — lazy import to avoid breaking non-Redis envs
async function getRedis() {
  try {
    const { redis } = await import('../config/redis');
    return redis;
  } catch {
    return null;
  }
}

const CACHE_TTL = 15 * 60; // 15 dakika

function buildCacheKey(q: string, filters: SearchFilters, page: number, limit: number): string {
  return `insights:search:${q}:${filters.domain?.join(',') ?? ''}:${filters.tag?.join(',') ?? ''}:${filters.from ?? ''}:${filters.to ?? ''}:${filters.lang ?? 'simple'}:${page}:${limit}`;
}

export async function searchInsights(
  q: string,
  filters: SearchFilters = {},
  page = 1,
  limit = 20,
): Promise<SearchResponse> {
  if (!q || q.trim().length < 2) {
    return { results: [], total: 0, query: q, cached: false };
  }

  const cacheKey = buildCacheKey(q, filters, page, limit);
  const redis = await getRedis();

  // Cache hit
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as SearchResponse;
        return { ...parsed, cached: true };
      }
    } catch (err) {
      logger.warn('Redis cache GET failed, falling through to DB', { err });
    }
  }

  const lang = filters.lang ?? 'simple';
  const offset = (page - 1) * limit;

  const rawResults = await prisma.$queryRaw<SearchResult[]>`
    SELECT * FROM search_insights(
      ${q},
      ${lang},
      ${filters.domain ? filters.domain : null}::text[],
      ${filters.tag ? filters.tag : null}::text[],
      ${filters.from ? filters.from : null}::date,
      ${filters.to ? filters.to : null}::date,
      ${limit}::int,
      ${offset}::int
    )
  `;

  // Total count (without limit/offset)
  const domainFilter = filters.domain?.length
    ? Prisma.sql`AND bp."primaryDomain"::TEXT = ANY(${filters.domain}::text[])`
    : Prisma.sql``;

  const totalResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) AS count
    FROM "blog_posts" bp
    WHERE
      bp.status = 'PUBLISHED'
      AND to_tsvector(
        ${lang}::regconfig,
        bp."titleTr" || ' ' || bp."excerptTr" || ' ' || bp."bodyTrMdx"
      ) @@ plainto_tsquery(${lang}::regconfig, ${q})
      ${domainFilter}
  `;

  const total = Number((totalResult[0] as unknown as { count: bigint }).count ?? 0);

  const response: SearchResponse = {
    results: rawResults,
    total,
    query: q,
    cached: false,
  };

  // Cache set
  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
    } catch (err) {
      logger.warn('Redis cache SET failed', { err });
    }
  }

  return response;
}

export async function invalidateSearchCache(pattern = 'insights:search:*'): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info('Search cache invalidated', { count: keys.length });
    }
  } catch (err) {
    logger.warn('Redis cache invalidation failed', { err });
  }
}

// View count batch flush — Redis INCRBY → DB
export async function flushViewCountToDb(postId: string, delta: number): Promise<void> {
  if (delta <= 0) return;
  try {
    await prisma.$executeRaw`SELECT increment_view_count(${postId}, ${delta}::int)`;
  } catch (err) {
    logger.error('View count flush failed', { err, postId, delta });
  }
}
