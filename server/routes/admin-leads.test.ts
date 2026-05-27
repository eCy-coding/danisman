import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import adminLeadsRouter from './admin-leads';

// Mock notion-leads-client before importing router — keep real NotionLeadsError class
vi.mock('../lib/notion-leads-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/notion-leads-client')>();
  return {
    ...actual,
    createAdayInNotion: vi.fn(),
    listAdaylarFromNotion: vi.fn(),
    getAdayFromNotion: vi.fn(),
    invalidateAdayCache: vi.fn(),
  };
});

// Mock auth middleware
vi.mock('../middleware/auth', () => ({
  authenticate: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mock prisma for consent logging
vi.mock('../config/db', () => ({
  prisma: {
    consentRecord: {
      create: vi.fn().mockResolvedValue({ id: 'consent-1', givenAt: new Date() }),
    },
  },
}));

import * as notionClient from '../lib/notion-leads-client';
import { NotionLeadsError } from '../lib/notion-leads-client';
import { prisma } from '../config/db';

const app = express();
app.use(express.json());
app.use('/api/admin/leads', adminLeadsRouter);
// Error handler so supertest gets structured JSON instead of HTML 500
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = (err as { status?: number })?.status ?? 500;
    const message = (err as { message?: string })?.message ?? 'Internal error';
    res.status(status).json({ status: 'error', message });
  },
);

const VALID_ADAY = {
  name: 'Test Aday',
  email: 'test@example.com',
  company: 'TestCo',
  revenueRange: '100M-300M USD',
  serviceInterest: ['M&A advisory'],
  source: 'Direct',
  kvkkConsent: true,
};

describe('POST /api/admin/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notionClient.createAdayInNotion).mockResolvedValue({
      id: 'notion-page-abc123',
      status: 'New',
    });
    vi.mocked(prisma.consentRecord.create).mockResolvedValue({
      id: 'consent-1',
      leadId: 'notion-page-abc123',
      consentType: 'KVKK_LEAD_FORM',
      givenAt: new Date(),
      ipAddress: null,
      userAgent: null,
      formVersion: '1.0.0',
      withdrawnAt: null,
    });
  });

  it('creates Notion page from valid Aday payload', async () => {
    const res = await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer test-token')
      .send(VALID_ADAY);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ id: expect.any(String), status: 'New' });
  });

  it('returns 400 if KVKK consent missing', async () => {
    const res = await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer test-token')
      .send({ ...VALID_ADAY, kvkkConsent: false });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/kvkk/i);
  });

  it('returns 400 if email invalid', async () => {
    const res = await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer test-token')
      .send({ ...VALID_ADAY, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/e-posta/i);
  });

  it('returns 400 if required fields missing', async () => {
    const res = await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer test-token')
      .send({ email: 'a@b.com', kvkkConsent: true });
    expect(res.status).toBe(400);
  });

  it('returns 429 with TR retry message if Notion rate limited', async () => {
    vi.mocked(notionClient.createAdayInNotion).mockRejectedValue(
      new NotionLeadsError('Rate limited', 'NOTION_RATE_LIMITED'),
    );
    const res = await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer test-token')
      .send(VALID_ADAY);
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/bekleyin/i);
  });

  it('returns 503 if Notion token not configured', async () => {
    vi.mocked(notionClient.createAdayInNotion).mockRejectedValue(
      new NotionLeadsError('Notion not configured', 'NOTION_NOT_CONFIGURED'),
    );
    const res = await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer test-token')
      .send(VALID_ADAY);
    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/info@ecypro.com/i);
  });

  it('logs KVKK consent record on successful create', async () => {
    await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer test-token')
      .send(VALID_ADAY);
    expect(prisma.consentRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          consentType: 'KVKK_LEAD_FORM',
          formVersion: '1.0.0',
        }),
      }),
    );
  });

  it('includes purchaseAuthority for high-revenue leads', async () => {
    const res = await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer test-token')
      .send({ ...VALID_ADAY, revenueRange: '501M-1000M USD', purchaseAuthority: true });
    expect(res.status).toBe(201);
    expect(notionClient.createAdayInNotion).toHaveBeenCalledWith(
      expect.objectContaining({ purchaseAuthority: true }),
    );
  });
});

describe('GET /api/admin/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated list', async () => {
    vi.mocked(notionClient.listAdaylarFromNotion).mockResolvedValue({
      results: [{ id: 'p1', name: 'Aday A', company: 'Co A', status: 'New' }],
      hasMore: false,
      nextCursor: null,
    });
    const res = await request(app)
      .get('/api/admin/leads')
      .set('Authorization', 'Bearer test-token');
    expect(res.status).toBe(200);
    expect(res.body.data.results).toHaveLength(1);
  });

  it('passes start_cursor for pagination', async () => {
    vi.mocked(notionClient.listAdaylarFromNotion).mockResolvedValue({
      results: [],
      hasMore: false,
      nextCursor: null,
    });
    await request(app).get('/api/admin/leads?cursor=abc').set('Authorization', 'Bearer test-token');
    expect(notionClient.listAdaylarFromNotion).toHaveBeenCalledWith('abc');
  });
});
