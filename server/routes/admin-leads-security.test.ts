import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';

vi.mock('../lib/notion-leads-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/notion-leads-client')>();
  return {
    ...actual,
    createAdayInNotion: vi.fn().mockResolvedValue({ id: 'p1', status: 'New' }),
    listAdaylarFromNotion: vi
      .fn()
      .mockResolvedValue({ results: [], hasMore: false, nextCursor: null }),
    getAdayFromNotion: vi
      .fn()
      .mockResolvedValue({ id: 'p1', name: 'A', email: 'a@b.com', company: 'C', status: 'New' }),
    invalidateAdayCache: vi.fn(),
  };
});

vi.mock('../config/db', () => ({
  prisma: {
    consentRecord: {
      create: vi.fn().mockResolvedValue({ id: 'c1', givenAt: new Date() }),
    },
  },
}));

// Auth mock: authenticate sets req.user from x-test-role header (default ADMIN)
// requireRole checks actual role for RBAC verification
vi.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction) => {
    const role = (req.headers['x-test-role'] as string) || 'ADMIN';
    (req as Record<string, unknown>)['user'] = { role, id: 'u1' };
    next();
  },
  requireRole: (role: string) => (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Record<string, unknown>)['user'] as { role: string } | undefined;
    if (!user || user.role !== role) {
      res.status(403).json({ status: 'error', message: 'Yetkisiz erişim' });
      return;
    }
    next();
  },
}));

import adminLeadsRouter from './admin-leads';
import * as notionClient from '../lib/notion-leads-client';
import { NotionLeadsError } from '../lib/notion-leads-client';

const app = express();
app.use(express.json());
app.use('/api/admin/leads', adminLeadsRouter);
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ status: 'error', message: String(err) });
  },
);

const VALID_ADAY = {
  name: 'Ahmet Yılmaz',
  email: 'ahmet@example.com',
  company: 'ACME Holding',
  revenueRange: '100M-300M USD',
  serviceInterest: ['M&A advisory'],
  source: 'Direct',
  kvkkConsent: true,
};

describe('Notion proxy security red-team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notionClient.createAdayInNotion).mockResolvedValue({ id: 'p1', status: 'New' });
  });

  it('Notion token never appears in error responses', async () => {
    vi.mocked(notionClient.createAdayInNotion).mockRejectedValue(
      new NotionLeadsError('API error', 'NOTION_API_ERROR'),
    );
    const fakeToken = 'secret_xxxxxxxxxxx';
    process.env['NOTION_API_KEY'] = fakeToken;

    const res = await request(app).post('/api/admin/leads').send(VALID_ADAY);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain(fakeToken);
    expect(body).not.toContain('NOTION_API_KEY');
    delete process.env['NOTION_API_KEY'];
  });

  it('VIEWER role cannot create lead — returns 403', async () => {
    const res = await request(app)
      .post('/api/admin/leads')
      .set('x-test-role', 'VIEWER')
      .send(VALID_ADAY);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/yetkisiz/i);
  });

  it('Missing KVKK consent returns 400 with empathy TR message', async () => {
    const res = await request(app)
      .post('/api/admin/leads')
      .send({ ...VALID_ADAY, kvkkConsent: false });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/kvkk/i);
  });

  it('Invalid email returns 400 with TR message', async () => {
    const res = await request(app)
      .post('/api/admin/leads')
      .send({ ...VALID_ADAY, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/e-posta/i);
  });

  it('Notion rate limit 429 returns TR empathy message', async () => {
    vi.mocked(notionClient.createAdayInNotion).mockRejectedValue(
      new NotionLeadsError('Rate limited', 'NOTION_RATE_LIMITED'),
    );

    const res = await request(app).post('/api/admin/leads').send(VALID_ADAY);

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/bekleyin/i);
  });

  it('Notion API error (401-like) returns admin-friendly TR 502', async () => {
    vi.mocked(notionClient.createAdayInNotion).mockRejectedValue(
      new NotionLeadsError('Notion API error 401', 'NOTION_API_ERROR'),
    );

    const res = await request(app).post('/api/admin/leads').send(VALID_ADAY);

    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/info@ecypro.com/i);
  });
});

describe('GET /api/admin/leads/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns single Aday detail', async () => {
    vi.mocked(notionClient.getAdayFromNotion).mockResolvedValue({
      id: 'p1',
      name: 'Ahmet',
      email: 'ahmet@example.com',
      company: 'ACME',
      status: 'New',
      revenueRange: '100M-300M USD',
    });

    const res = await request(app).get('/api/admin/leads/p1');

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('ahmet@example.com');
  });

  it('returns 503 if Notion not configured for GET /:id', async () => {
    vi.mocked(notionClient.getAdayFromNotion).mockRejectedValue(
      new NotionLeadsError('not configured', 'NOTION_NOT_CONFIGURED'),
    );

    const res = await request(app).get('/api/admin/leads/p1');

    expect(res.status).toBe(503);
  });
});
