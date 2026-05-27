import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../lib/notion-leads-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/notion-leads-client')>();
  return {
    ...actual,
    createAdayInNotion: vi.fn().mockResolvedValue({ id: 'notion-abc', status: 'New' }),
    invalidateAdayCache: vi.fn(),
  };
});
vi.mock('../middleware/auth', () => ({
  authenticate: (_: unknown, __: unknown, next: () => void) => next(),
  requireRole: () => (_: unknown, __: unknown, next: () => void) => next(),
}));

const { mockConsentCreate } = vi.hoisted(() => ({
  mockConsentCreate: vi.fn().mockResolvedValue({
    id: 'consent-1',
    leadId: 'notion-abc',
    consentType: 'KVKK_LEAD_FORM',
    givenAt: new Date('2026-01-01'),
    ipAddress: null,
    userAgent: null,
    formVersion: '1.0.0',
    withdrawnAt: null,
  }),
}));

vi.mock('../config/db', () => ({
  prisma: { consentRecord: { create: mockConsentCreate } },
}));

import adminLeadsRouter from './admin-leads';

const app = express();
app.use(express.json());
app.use('/api/admin/leads', adminLeadsRouter);
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ message: String(err) });
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

describe('KVKK ConsentRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsentCreate.mockResolvedValue({
      id: 'consent-1',
      leadId: 'notion-abc',
      consentType: 'KVKK_LEAD_FORM',
      givenAt: new Date('2026-01-01'),
      ipAddress: null,
      userAgent: null,
      formVersion: '1.0.0',
      withdrawnAt: null,
    });
  });

  it('saves KVKK consent record on lead create', async () => {
    await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer token')
      .send(VALID_ADAY);

    expect(mockConsentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          leadId: 'notion-abc',
          consentType: 'KVKK_LEAD_FORM',
          formVersion: '1.0.0',
        }),
      }),
    );
  });

  it('consent record contains formVersion 1.0.0', async () => {
    await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer token')
      .send(VALID_ADAY);

    const call = mockConsentCreate.mock.calls[0]?.[0];
    expect(call?.data?.formVersion).toBe('1.0.0');
  });

  it('does NOT save consent record when validation fails', async () => {
    await request(app)
      .post('/api/admin/leads')
      .set('Authorization', 'Bearer token')
      .send({ ...VALID_ADAY, kvkkConsent: false });

    // consent create should NOT be called (validation rejected before reaching Notion)
    await new Promise<void>((r) => setTimeout(r, 10)); // let fire-and-forget settle
    expect(mockConsentCreate).not.toHaveBeenCalled();
  });
});
