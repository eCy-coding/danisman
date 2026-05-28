import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../config/db', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// Mock Redis — simulate cache miss by default
const mockRedis = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  keys: vi.fn().mockResolvedValue([]),
  del: vi.fn().mockResolvedValue(0),
};

vi.mock('../config/redis', () => ({ redis: mockRedis }));

import { searchInsights, invalidateSearchCache, flushViewCountToDb } from './insightsSearch';
import { prisma } from '../config/db';
import { publicInsightsSearchRouter } from '../routes/public-insights-search';

// ─── Test App ─────────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/insights/search', publicInsightsSearchRouter);
  return app;
}

const mockSearchResults = [
  {
    postId: 'post-1',
    rank: 0.89,
    title: 'M&A Due Diligence',
    excerpt: 'DD özeti',
    domain: 'M_A',
    publishedAt: new Date('2026-05-01'),
  },
  {
    postId: 'post-2',
    rank: 0.72,
    title: 'KVKK ve M&A',
    excerpt: 'KVKK özeti',
    domain: 'M_A',
    publishedAt: new Date('2026-04-28'),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockRedis.get.mockResolvedValue(null);
  mockRedis.set.mockResolvedValue('OK');
});

// ─── Unit Tests: searchInsights Service ──────────────────────────────────────

describe('searchInsights service', () => {
  it('returns empty results for query shorter than 2 chars', async () => {
    const result = await searchInsights('a');
    expect(result.results).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('executes FTS query and returns results', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce(mockSearchResults) // main query
      .mockResolvedValueOnce([{ count: BigInt(2) }]); // count query

    const result = await searchInsights('due diligence', {}, 1, 20);

    expect(result.results).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.cached).toBe(false);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('returns cached result on cache hit', async () => {
    const cachedData = { results: mockSearchResults, total: 2, query: 'kvkk', cached: false };
    mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedData));

    const result = await searchInsights('kvkk', {}, 1, 20);

    expect(result.cached).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('writes result to Redis cache on miss', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce(mockSearchResults)
      .mockResolvedValueOnce([{ count: BigInt(2) }]);

    await searchInsights('m&a strateji', {}, 1, 20);

    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringContaining('insights:search:'),
      expect.stringContaining('"cached":false'),
      'EX',
      900, // 15 min
    );
  });

  it('filters by domain', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([mockSearchResults[0]])
      .mockResolvedValueOnce([{ count: BigInt(1) }]);

    await searchInsights('due diligence', { domain: ['M_A'] }, 1, 20);

    expect(prisma.$queryRaw).toHaveBeenCalledWith(
      expect.anything(), // strings
      expect.anything(), // q
      expect.anything(), // lang
      ['M_A'], // domain
      null, // tag
      null, // from
      null, // to
      20, // limit
      0, // offset
    );
  });

  it('filters by tag slug', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([mockSearchResults[1]])
      .mockResolvedValueOnce([{ count: BigInt(1) }]);

    await searchInsights('veri', { tag: ['reg-kvkk'] }, 1, 20);

    expect(prisma.$queryRaw).toHaveBeenCalledWith(
      expect.anything(), // strings
      expect.anything(), // q
      expect.anything(), // lang
      null, // domain
      ['reg-kvkk'], // tag
      null, // from
      null, // to
      expect.anything(), // limit
      expect.anything(), // offset
    );
  });

  it('pagination: page 2 uses correct offset', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: BigInt(25) }]);

    await searchInsights('esg', {}, 2, 10);

    expect(prisma.$queryRaw).toHaveBeenNthCalledWith(
      1,
      expect.anything(), // strings
      expect.anything(), // q
      expect.anything(), // lang
      null, // domain
      null, // tag
      null, // from
      null, // to
      10, // limit
      10, // offset = (2-1)*10
    );
  });

  it('continues when Redis is unavailable (graceful degradation)', async () => {
    mockRedis.get.mockRejectedValueOnce(new Error('Redis down'));
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce(mockSearchResults)
      .mockResolvedValueOnce([{ count: BigInt(2) }]);

    const result = await searchInsights('test', {}, 1, 20);
    expect(result.results).toHaveLength(2);
  });
});

// ─── Unit Tests: Cache Invalidation ──────────────────────────────────────────

describe('invalidateSearchCache', () => {
  it('deletes matching cache keys', async () => {
    mockRedis.keys.mockResolvedValueOnce(['insights:search:kvkk:...', 'insights:search:m&a:...']);

    await invalidateSearchCache('insights:search:*');

    expect(mockRedis.keys).toHaveBeenCalledWith('insights:search:*');
    expect(mockRedis.del).toHaveBeenCalledWith(
      'insights:search:kvkk:...',
      'insights:search:m&a:...',
    );
  });

  it('no-op when no keys match', async () => {
    mockRedis.keys.mockResolvedValueOnce([]);
    await invalidateSearchCache();
    expect(mockRedis.del).not.toHaveBeenCalled();
  });
});

// ─── Unit Tests: View Count Flush ─────────────────────────────────────────────

describe('flushViewCountToDb', () => {
  it('executes raw increment for positive delta', async () => {
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    await flushViewCountToDb('post-1', 42);
    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
  });

  it('skips DB call for zero or negative delta', async () => {
    await flushViewCountToDb('post-1', 0);
    expect(prisma.$executeRaw).not.toHaveBeenCalled();

    await flushViewCountToDb('post-1', -5);
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });
});

// ─── Integration Tests: Public Search Endpoint ───────────────────────────────

describe('GET /api/v1/insights/search', () => {
  it('returns 400 for missing q parameter', async () => {
    const res = await request(makeApp()).get('/api/v1/insights/search').expect(400);

    expect(res.body.error).toBe('Invalid search query');
  });

  it('returns 400 for q shorter than 2 chars', async () => {
    const res = await request(makeApp()).get('/api/v1/insights/search?q=a').expect(400);

    expect(res.body.error).toBe('Invalid search query');
  });

  it('returns search results with meta', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce(mockSearchResults)
      .mockResolvedValueOnce([{ count: BigInt(2) }]);

    const res = await request(makeApp()).get('/api/v1/insights/search?q=due+diligence').expect(200);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.meta.query).toBe('due diligence');
  });

  it('accepts domain filter via comma-separated string', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([mockSearchResults[0]])
      .mockResolvedValueOnce([{ count: BigInt(1) }]);

    const res = await request(makeApp())
      .get('/api/v1/insights/search?q=strateji&domain=M_A,ESG')
      .expect(200);

    expect(res.body.data).toHaveLength(1);
  });

  it('returns 400 for invalid lang param', async () => {
    await request(makeApp()).get('/api/v1/insights/search?q=test&lang=invalid').expect(400);
  });

  it('pagination meta is correct', async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce(mockSearchResults)
      .mockResolvedValueOnce([{ count: BigInt(40) }]);

    const res = await request(makeApp())
      .get('/api/v1/insights/search?q=compliance&page=2&limit=20')
      .expect(200);

    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.pages).toBe(2);
  });
});
