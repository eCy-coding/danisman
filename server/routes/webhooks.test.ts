import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import { errorHandler } from '../middleware/error';
import webhookRoutes from './webhooks';
import { prisma } from '../config/db';

// ── Module mocks ──────────────────────────────────────────────────────────────

// P17 BE Track 2 / Aşama 5 added `webhook-idempotency` which calls
// `prisma.webhookEvent.upsert` before any handler logic runs. Without
// the mock the upsert throws "Cannot read properties of undefined" → 500.
// Re-stabilised in P25 BE Track 2 / Aşama 3.
vi.mock('../config/db', () => ({
  prisma: {
    booking: {
      update: vi.fn().mockResolvedValue({}),
    },
    webhookEvent: {
      upsert: vi.fn().mockResolvedValue({
        id: 'mock-event-id',
        processedAt: null,
      }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('../config/redis', () => ({
  redis: { status: 'end' },
}));

// ── Utilities ─────────────────────────────────────────────────────────────────

const TEST_SECRET = 'test-webhook-secret-32chars-minimum';

function sign(body: string, secret = TEST_SECRET): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function makeApp() {
  const app = express();
  // P27 BE Track 2: the production index.ts captures the raw request
  // bytes via `express.json({ verify })` so the HMAC middleware can
  // verify against the byte-for-byte payload. The previous test fixture
  // omitted this, so every request fell into the middleware's
  // RAW_BODY_UNAVAILABLE → 500 branch and only the "missing header"
  // case (which short-circuits earlier) survived.
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use('/webhooks', webhookRoutes);
  app.use(errorHandler);
  return app;
}

const BOOKING_CREATED_PAYLOAD = {
  triggerEvent: 'BOOKING_CREATED' as const,
  payload: {
    uid: 'cal-uid-123',
    title: 'Strategy Consultation',
    startTime: '2026-06-01T10:00:00.000Z',
    endTime: '2026-06-01T11:00:00.000Z',
    metadata: { ecyproBookingId: 'booking-uuid-abc' },
  },
};

const BOOKING_CANCELLED_PAYLOAD = {
  triggerEvent: 'BOOKING_CANCELLED' as const,
  payload: {
    uid: 'cal-uid-456',
    cancellationReason: 'Client request',
    metadata: { ecyproBookingId: 'booking-uuid-def' },
  },
};

const BOOKING_RESCHEDULED_PAYLOAD = {
  triggerEvent: 'BOOKING_RESCHEDULED' as const,
  payload: {
    uid: 'cal-uid-789',
    startTime: '2026-07-01T14:00:00.000Z',
    metadata: { ecyproBookingId: 'booking-uuid-ghi' },
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /webhooks/cal — HMAC verification', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set webhook secret BEFORE makeApp so the route module reads it
    process.env.CAL_COM_WEBHOOK_SECRET = TEST_SECRET;
    app = makeApp();
  });

  it('returns 401 when signature header is missing', async () => {
    const res = await request(app).post('/webhooks/cal').send(BOOKING_CREATED_PAYLOAD);

    expect(res.status).toBe(401);
    // The middleware emits `{ code: 'INVALID_SIGNATURE', message: '…' }`
    // — assert against the actual envelope rather than a legacy `error`
    // field that never existed in this code path.
    expect(res.body.code).toBe('INVALID_SIGNATURE');
    expect(res.body.message.toLowerCase()).toContain('signature');
  });

  it('returns 401 for a wrong signature', async () => {
    const res = await request(app)
      .post('/webhooks/cal')
      .set('x-cal-signature-256', 'deadbeef'.repeat(8))
      .send(BOOKING_CREATED_PAYLOAD);

    expect(res.status).toBe(401);
  });

  it('returns 401 when signature is signed with wrong secret', async () => {
    const rawBody = JSON.stringify(BOOKING_CREATED_PAYLOAD);
    const wrongSig = sign(rawBody, 'wrong-secret');

    const res = await request(app)
      .post('/webhooks/cal')
      .set('x-cal-signature-256', wrongSig)
      .send(BOOKING_CREATED_PAYLOAD);

    expect(res.status).toBe(401);
  });
});

describe('POST /webhooks/cal — event handling', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CAL_COM_WEBHOOK_SECRET = TEST_SECRET;
    app = makeApp();
  });

  function sendSigned(payload: object) {
    const rawBody = JSON.stringify(payload);
    const sig = sign(rawBody);
    return request(app).post('/webhooks/cal').set('x-cal-signature-256', sig).send(payload);
  }

  it('BOOKING_CREATED with valid signature → 200 + updates booking status to CONFIRMED', async () => {
    const res = await sendSigned(BOOKING_CREATED_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-uuid-abc' },
        data: expect.objectContaining({ status: 'CONFIRMED' }),
      }),
    );
  });

  it('BOOKING_CANCELLED with valid signature → 200 + updates status to CANCELLED', async () => {
    const res = await sendSigned(BOOKING_CANCELLED_PAYLOAD);

    expect(res.status).toBe(200);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-uuid-def' },
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }),
    );
  });

  it('BOOKING_RESCHEDULED with valid signature → 200 + updates scheduledAt', async () => {
    const res = await sendSigned(BOOKING_RESCHEDULED_PAYLOAD);

    expect(res.status).toBe(200);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-uuid-ghi' },
        data: expect.objectContaining({
          scheduledAt: new Date('2026-07-01T14:00:00.000Z'),
        }),
      }),
    );
  });

  it('unknown triggerEvent → 200 (ignored gracefully)', async () => {
    const payload = {
      triggerEvent: 'MEETING_STARTED',
      payload: { uid: 'test' },
    };
    const res = await sendSigned(payload);
    expect(res.status).toBe(200);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('missing ecyproBookingId → 200 but no DB update', async () => {
    const payload = {
      triggerEvent: 'BOOKING_CREATED',
      payload: {
        uid: 'no-ecypro-id',
        startTime: '2026-06-01T10:00:00.000Z',
        metadata: {},
      },
    };
    const res = await sendSigned(payload);
    expect(res.status).toBe(200);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });
});
