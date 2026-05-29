import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'node:crypto';

// ── Module mocks ──────────────────────────────────────────────────────────────
// The route fires Notion / PostHog / Telegram side-effects. Mock them so the
// HMAC + dispatch logic is what's under test, not the integrations.

const upsertProspect = vi.fn().mockResolvedValue('prospect-id-123');
const createInteraction = vi.fn().mockResolvedValue('interaction-id-456');
const notify = vi.fn().mockResolvedValue(undefined);
const posthogCapture = vi.fn();

vi.mock('../services/notion', () => ({ upsertProspect, createInteraction }));
vi.mock('../lib/telegram', () => ({ notify }));
vi.mock('../lib/posthog-server', () => ({ captureWithConsent: posthogCapture }));
vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const TEST_KEY = 'calendly-test-signing-key-32chars-min';

// Calendly signs `${t}.${rawBody}` with HMAC-SHA256 and ships it as
// `Calendly-Webhook-Signature: t=<unix-seconds>,v1=<hex>`.
function buildSignature(
  rawBody: string,
  key = TEST_KEY,
  t = Math.floor(Date.now() / 1000),
): string {
  const mac = crypto.createHmac('sha256', key).update(`${t}.${rawBody}`).digest('hex');
  return `t=${t},v1=${mac}`;
}

const INVITEE_CREATED = {
  event: 'invitee.created',
  payload: {
    invitee: { name: 'Ada Lovelace', email: 'ada@example.com', timezone: 'Europe/Istanbul' },
    scheduled_event: { start_time: '2026-06-01T10:00:00.000Z' },
    tracking: { utm_source: 'linkedin' },
  },
};

const INVITEE_CANCELED = {
  event: 'invitee.canceled',
  payload: {
    invitee: { name: 'Ada Lovelace', email: 'ada@example.com' },
    scheduled_event: { start_time: '2026-06-01T10:00:00.000Z' },
  },
};

// Route reads CALENDLY_WEBHOOK_SIGNING_KEY into a module-load const, so the env
// must be set BEFORE the (dynamic) import. Static ESM imports hoist above any
// assignment, hence the dynamic import in beforeAll.
let calendlyRouter: express.Router;

function makeApp(router: express.Router) {
  const app = express();
  // No body parser here — the route mounts its own `express.raw` so it can
  // recompute the HMAC over the exact bytes Calendly signed.
  app.use('/calendly', router);
  return app;
}

function postRaw(app: express.Express, rawBody: string, sigHeader?: string) {
  const req = request(app).post('/calendly').set('Content-Type', 'application/json');
  if (sigHeader !== undefined) req.set('Calendly-Webhook-Signature', sigHeader);
  return req.send(rawBody);
}

describe('POST /calendly — HMAC verification', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.CALENDLY_WEBHOOK_SIGNING_KEY = TEST_KEY;
    vi.resetModules();
    calendlyRouter = (await import('./calendly')).default;
  });

  let app: express.Express;
  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp(calendlyRouter);
  });

  it('valid signature + invitee.created → 200 and Notion upsert at "Discovery Booked"', async () => {
    const raw = JSON.stringify(INVITEE_CREATED);
    const res = await postRaw(app, raw, buildSignature(raw));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, received: true });

    // Notion sync is fire-and-forget; let the microtask queue drain.
    await new Promise((r) => setImmediate(r));
    expect(upsertProspect).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ada@example.com', stage: 'Discovery Booked' }),
    );
    expect(createInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Discovery Call', outcome: 'Booked' }),
    );
    expect(posthogCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'calendly_booked',
        email: 'ada@example.com',
        consent: { kvkk: true, analytics: false },
      }),
    );
  });

  it('missing signature header → 401 INVALID_SIGNATURE', async () => {
    const raw = JSON.stringify(INVITEE_CREATED);
    const res = await postRaw(app, raw);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_SIGNATURE');
    expect(upsertProspect).not.toHaveBeenCalled();
  });

  it('wrong signature (tampered body) → 401', async () => {
    const raw = JSON.stringify(INVITEE_CREATED);
    const sig = buildSignature(raw);
    // Same valid signature, but altered body → HMAC mismatch.
    const tampered = JSON.stringify({ ...INVITEE_CREATED, injected: true });
    const res = await postRaw(app, tampered, sig);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_SIGNATURE');
  });

  it('signature signed with wrong key → 401', async () => {
    const raw = JSON.stringify(INVITEE_CREATED);
    const res = await postRaw(app, raw, buildSignature(raw, 'attacker-controlled-key'));

    expect(res.status).toBe(401);
  });

  it('replay / stale timestamp beyond 5-min skew → 401', async () => {
    const raw = JSON.stringify(INVITEE_CREATED);
    const stale = Math.floor(Date.now() / 1000) - 6 * 60; // 6 min old
    const res = await postRaw(app, raw, buildSignature(raw, TEST_KEY, stale));

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_SIGNATURE');
  });

  it('valid HMAC over non-JSON bytes → 400 INVALID_JSON', async () => {
    const raw = 'this-is-not-json';
    const res = await postRaw(app, raw, buildSignature(raw));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_JSON');
  });
});

describe('POST /calendly — event dispatch', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.CALENDLY_WEBHOOK_SIGNING_KEY = TEST_KEY;
    vi.resetModules();
    calendlyRouter = (await import('./calendly')).default;
  });

  let app: express.Express;
  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp(calendlyRouter);
  });

  it('invitee.canceled → 200 and Notion stage rollback to "Lead"', async () => {
    const raw = JSON.stringify(INVITEE_CANCELED);
    const res = await postRaw(app, raw, buildSignature(raw));

    expect(res.status).toBe(200);
    await new Promise((r) => setImmediate(r));
    expect(upsertProspect).toHaveBeenCalledWith(expect.objectContaining({ stage: 'Lead' }));
    expect(createInteraction).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'Canceled' }),
    );
    expect(posthogCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'discovery_canceled',
        email: 'ada@example.com',
        consent: { kvkk: true, analytics: false },
      }),
    );
  });

  it('unhandled event type → 204 and no side-effects', async () => {
    const raw = JSON.stringify({ event: 'routing_form_submission.created', payload: {} });
    const res = await postRaw(app, raw, buildSignature(raw));

    expect(res.status).toBe(204);
    expect(upsertProspect).not.toHaveBeenCalled();
    expect(posthogCapture).not.toHaveBeenCalled();
  });
});

describe('POST /calendly — production hardening', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('SIGNING_KEY unset in production → 503 SIGNING_KEY_MISSING', async () => {
    delete process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const router = (await import('./calendly')).default;
    const app = makeApp(router);

    const raw = JSON.stringify(INVITEE_CREATED);
    const res = await postRaw(app, raw, buildSignature(raw));

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('SIGNING_KEY_MISSING');
  });
});
