/**
 * H4 / Track 2 — Quick-Check end-to-end chain test.
 *
 * The existing quick-check.test.ts covers scoring + the KVKK/payload gates and
 * the happy-path response. This suite asserts the full submission ORCHESTRATION
 * fires correctly: KVKK consent → score → Notion upsert (right shape) → Resend
 * result email → PostHog event, plus the honeypot and consent short-circuits.
 *
 * Integrations are mocked (the live Notion path is a known broken contract —
 * see docs/db/notion-crm-contract-mismatch-2026-05-21.md — and a live Resend
 * send would hit a real inbox). This proves the wiring; live verification is
 * tracked separately.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

const h = vi.hoisted(() => ({
  upsertProspect: vi.fn(async () => 'mock-prospect-id'),
  posthogCapture: vi.fn(async () => undefined),
  resendSend: vi.fn(async () => ({ data: { id: 'email-id-1' }, error: null })),
}));

vi.mock('../services/notion', () => ({ upsertProspect: h.upsertProspect }));
vi.mock('../lib/posthog-server', () => ({ captureWithConsent: h.posthogCapture }));
vi.mock('resend', () => ({
  // Regular function (not arrow) so `new Resend()` can construct it.
  Resend: vi.fn(function () {
    return { emails: { send: h.resendSend } };
  }),
}));
vi.mock('../config/redis', () => ({
  redis: { status: 'wait', eval: async () => null, ping: async () => 'PONG' },
}));

let quickCheckRoutes: express.Router;
let errorHandler: express.ErrorRequestHandler;
let resetRateLimitStore: () => void;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/quick-check-submit', quickCheckRoutes);
  app.use(errorHandler);
  return app;
}

const base = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines A.Ş.',
  sector: 'Teknoloji',
  kvkkConsent: true,
};
const allA = Array.from({ length: 10 }, () => 'A');
// High-risk: all D, with Q8 D → red flag.
const allD = Array.from({ length: 10 }, () => 'D');

describe('Quick-Check submission chain', () => {
  beforeAll(async () => {
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.EMAIL_FROM = 'eCyPro <noreply@ecypro.com>';
    process.env.FOUNDER_EMAIL = 'founder@ecypro.com';
    vi.resetModules();
    quickCheckRoutes = (await import('./quick-check')).default;
    errorHandler = (await import('../middleware/error')).errorHandler;
    // Same post-resetModules instance the route uses, so the reset clears the
    // exact in-memory bucket quickCheckLimiter increments (3/hr — would 429
    // across tests otherwise).
    resetRateLimitStore = (await import('../middleware/rateLimiter')).__resetFallbackStoreForTests;
  });

  let app: express.Express;
  beforeEach(() => {
    // Clear only the leaf spies' call history — NOT the Resend constructor
    // mock (clearAllMocks wipes its implementation → "not a constructor").
    h.upsertProspect.mockClear();
    h.posthogCapture.mockClear();
    h.resendSend.mockClear();
    resetRateLimitStore();
    app = makeApp();
  });

  it('mature submission → 200 + Notion upsert + Resend email + PostHog event', async () => {
    const res = await request(app)
      .post('/api/v1/quick-check-submit')
      .send({ ...base, answers: allA });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, score: 30, tier: 'mature', redFlag: false });

    // Side-effects are fire-and-forget — drain the microtask queue.
    await new Promise((r) => setImmediate(r));

    expect(h.upsertProspect).toHaveBeenCalledTimes(1);
    expect(h.upsertProspect).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        source: 'Quick-Check inbound',
        stage: 'Lead',
        priority: 'Low', // mature → Low
        score: 30,
        tier: 'mature',
        kvkkConsentAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      }),
    );

    expect(h.resendSend).toHaveBeenCalledTimes(1);
    const mail = h.resendSend.mock.calls[0][0];
    expect(mail).toMatchObject({ to: 'ada@example.com', replyTo: 'founder@ecypro.com' });
    expect(mail.html).toContain('30 / 30');

    expect(h.posthogCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'quick_check_completed',
        email: 'ada@example.com',
        consent: expect.objectContaining({ kvkk: true, analytics: false }),
        properties: expect.objectContaining({ score: 30, tier: 'mature', redFlag: false }),
      }),
    );
  });

  it('high-risk + red flag → priority High and redFlag true', async () => {
    const res = await request(app)
      .post('/api/v1/quick-check-submit')
      .send({ ...base, email: 'risk@example.com', answers: allD });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ score: 0, tier: 'high-risk', redFlag: true });

    await new Promise((r) => setImmediate(r));
    expect(h.upsertProspect).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'High', tier: 'high-risk' }),
    );
  });

  it('honeypot filled → 400 (zod hp_field max(0)) and NO downstream side-effects', async () => {
    const res = await request(app)
      .post('/api/v1/quick-check-submit')
      .send({ ...base, answers: allA, hp_field: 'bot-was-here' });

    // The honeypot is enforced at the schema layer (`hp_field: z.string().max(0)`)
    // so a filled field is rejected as INVALID_PAYLOAD before any side-effect.
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');

    await new Promise((r) => setImmediate(r));
    expect(h.upsertProspect).not.toHaveBeenCalled();
    expect(h.resendSend).not.toHaveBeenCalled();
    expect(h.posthogCapture).not.toHaveBeenCalled();
  });

  it('missing KVKK consent → 400 and NO side-effects', async () => {
    const res = await request(app)
      .post('/api/v1/quick-check-submit')
      .send({ ...base, kvkkConsent: false, answers: allA });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('KVKK_REQUIRED');

    await new Promise((r) => setImmediate(r));
    expect(h.upsertProspect).not.toHaveBeenCalled();
    expect(h.resendSend).not.toHaveBeenCalled();
    expect(h.posthogCapture).not.toHaveBeenCalled();
  });

  it('a downstream integration throwing does NOT fail the request (best-effort)', async () => {
    h.upsertProspect.mockRejectedValueOnce(new Error('notion 400 contract mismatch'));
    h.resendSend.mockRejectedValueOnce(new Error('resend down'));

    const res = await request(app)
      .post('/api/v1/quick-check-submit')
      .send({ ...base, email: 'resilient@example.com', answers: allA });

    // The user still gets their score even when CRM/email are degraded.
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
