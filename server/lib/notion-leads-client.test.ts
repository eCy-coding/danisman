import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('../config/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import {
  createAdayInNotion,
  listAdaylarFromNotion,
  getAdayFromNotion,
  invalidateAdayCache,
  NotionLeadsError,
} from './notion-leads-client';

const VALID_INPUT = {
  name: 'Ahmet Yılmaz',
  email: 'ahmet@example.com',
  company: 'ACME Holding',
  revenueRange: '100M-300M USD' as const,
  serviceInterest: ['M&A advisory'],
  source: 'Direct' as const,
  kvkkConsent: true as const,
};

const NOTION_PAGE_RESPONSE = {
  id: 'notion-page-xyz',
  properties: {
    Name: { title: [{ plain_text: 'Ahmet Yılmaz' }] },
    Email: { email: 'ahmet@example.com' },
    Company: { rich_text: [{ plain_text: 'ACME Holding' }] },
    Status: { select: { name: 'New' } },
    'Revenue Range': { select: { name: '100M-300M USD' } },
  },
  created_time: '2026-01-01T00:00:00.000Z',
};

const NOTION_QUERY_RESPONSE = {
  results: [NOTION_PAGE_RESPONSE],
  has_more: false,
  next_cursor: null,
};

function okJsonResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
}

function errorResponse(status: number, body = '') {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(body),
  } as Response);
}

describe('NotionLeadsError', () => {
  it('has correct name and code', () => {
    const err = new NotionLeadsError('test', 'NOTION_RATE_LIMITED');
    expect(err.name).toBe('NotionLeadsError');
    expect(err.code).toBe('NOTION_RATE_LIMITED');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('createAdayInNotion', () => {
  beforeEach(() => {
    invalidateAdayCache();
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_LEADS_DB_ID = 'test-db-id';
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_LEADS_DB_ID;
  });

  it('creates a page and returns id + status New', async () => {
    mockFetch.mockResolvedValue(okJsonResponse({ id: 'notion-page-xyz' }));

    const result = await createAdayInNotion(VALID_INPUT);
    expect(result.id).toBe('notion-page-xyz');
    expect(result.status).toBe('New');
  });

  it('includes purchaseAuthority in properties when provided', async () => {
    mockFetch.mockResolvedValue(okJsonResponse({ id: 'p1' }));

    await createAdayInNotion({ ...VALID_INPUT, purchaseAuthority: true });

    const body = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string) as {
      properties: Record<string, unknown>;
    };
    expect(body.properties['Purchase Authority']).toEqual({ checkbox: true });
  });

  it('omits purchaseAuthority when not provided', async () => {
    mockFetch.mockResolvedValue(okJsonResponse({ id: 'p1' }));

    await createAdayInNotion(VALID_INPUT);

    const body = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string) as {
      properties: Record<string, unknown>;
    };
    expect(body.properties['Purchase Authority']).toBeUndefined();
  });

  it('throws NOTION_NOT_CONFIGURED when NOTION_API_KEY missing', async () => {
    delete process.env.NOTION_API_KEY;

    await expect(createAdayInNotion(VALID_INPUT)).rejects.toMatchObject({
      code: 'NOTION_NOT_CONFIGURED',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('throws NOTION_NOT_CONFIGURED when NOTION_LEADS_DB_ID missing', async () => {
    delete process.env.NOTION_LEADS_DB_ID;

    await expect(createAdayInNotion(VALID_INPUT)).rejects.toMatchObject({
      code: 'NOTION_NOT_CONFIGURED',
    });
  });

  it('throws NOTION_RATE_LIMITED on 429', async () => {
    mockFetch.mockResolvedValue(errorResponse(429));

    await expect(createAdayInNotion(VALID_INPUT)).rejects.toMatchObject({
      code: 'NOTION_RATE_LIMITED',
    });
  });

  it('throws NOTION_API_ERROR on non-ok status', async () => {
    mockFetch.mockResolvedValue(errorResponse(500, 'Internal error'));

    await expect(createAdayInNotion(VALID_INPUT)).rejects.toMatchObject({
      code: 'NOTION_API_ERROR',
    });
  });

  it('sends correct Authorization header', async () => {
    mockFetch.mockResolvedValue(okJsonResponse({ id: 'p1' }));

    await createAdayInNotion(VALID_INPUT);

    const headers = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-api-key');
    expect(headers['Notion-Version']).toBe('2022-06-28');
  });
});

describe('listAdaylarFromNotion', () => {
  beforeEach(() => {
    invalidateAdayCache();
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_LEADS_DB_ID = 'test-db-id';
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_LEADS_DB_ID;
  });

  it('returns list result from Notion', async () => {
    mockFetch.mockResolvedValue(okJsonResponse(NOTION_QUERY_RESPONSE));

    const result = await listAdaylarFromNotion();
    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.name).toBe('Ahmet Yılmaz');
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('returns cached result on second call', async () => {
    mockFetch.mockResolvedValue(okJsonResponse(NOTION_QUERY_RESPONSE));

    await listAdaylarFromNotion();
    await listAdaylarFromNotion();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('passes start_cursor when provided', async () => {
    mockFetch.mockResolvedValue(okJsonResponse({ ...NOTION_QUERY_RESPONSE, results: [] }));

    await listAdaylarFromNotion('cursor-abc');

    const body = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string) as {
      start_cursor?: string;
    };
    expect(body.start_cursor).toBe('cursor-abc');
  });

  it('invalidateAdayCache clears cached results', async () => {
    mockFetch.mockResolvedValue(okJsonResponse(NOTION_QUERY_RESPONSE));

    await listAdaylarFromNotion();
    invalidateAdayCache();
    await listAdaylarFromNotion();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws NOTION_NOT_CONFIGURED when db id missing', async () => {
    delete process.env.NOTION_LEADS_DB_ID;

    await expect(listAdaylarFromNotion()).rejects.toMatchObject({
      code: 'NOTION_NOT_CONFIGURED',
    });
  });
});

describe('getAdayFromNotion', () => {
  beforeEach(() => {
    invalidateAdayCache();
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_LEADS_DB_ID = 'test-db-id';
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_LEADS_DB_ID;
  });

  it('returns aday detail with email', async () => {
    mockFetch.mockResolvedValue(okJsonResponse(NOTION_PAGE_RESPONSE));

    const aday = await getAdayFromNotion('notion-page-xyz');
    expect(aday.id).toBe('notion-page-xyz');
    expect(aday.email).toBe('ahmet@example.com');
    expect(aday.name).toBe('Ahmet Yılmaz');
    expect(aday.status).toBe('New');
  });

  it('calls GET /pages/:id', async () => {
    mockFetch.mockResolvedValue(okJsonResponse(NOTION_PAGE_RESPONSE));

    await getAdayFromNotion('page-abc');
    expect(mockFetch.mock.calls[0]?.[0]).toContain('/pages/page-abc');
    expect(mockFetch.mock.calls[0]?.[1]?.method).toBe('GET');
  });

  it('throws NOTION_API_ERROR on 404', async () => {
    mockFetch.mockResolvedValue(errorResponse(404, 'not found'));

    await expect(getAdayFromNotion('bad-id')).rejects.toMatchObject({
      code: 'NOTION_API_ERROR',
    });
  });
});

describe('cache edge cases', () => {
  beforeEach(() => {
    invalidateAdayCache();
    process.env.NOTION_API_KEY = 'key';
    process.env.NOTION_LEADS_DB_ID = 'db';
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_LEADS_DB_ID;
  });

  it('fetches fresh data after cache is invalidated by createAdayInNotion', async () => {
    mockFetch.mockResolvedValue(okJsonResponse(NOTION_QUERY_RESPONSE));
    await listAdaylarFromNotion(); // populates cache

    mockFetch.mockResolvedValue(okJsonResponse({ id: 'new-page' }));
    await createAdayInNotion(VALID_INPUT); // invalidates cache

    mockFetch.mockResolvedValue(okJsonResponse(NOTION_QUERY_RESPONSE));
    await listAdaylarFromNotion(); // fetches fresh

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
