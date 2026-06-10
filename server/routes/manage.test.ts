/**
 * P37-T05 — booking management route tests (public, token-gated)
 *
 * Verifies:
 *   - GET  /booking with valid HMAC token → 200 booking summary
 *   - POST /booking/cancel with valid token → 200 + prisma.update CANCELLED
 *   - invalid token → 401, expired token → 401, malformed (zod) → 400
 *   - not-found booking → 404
 *
 * The route verifies tokens via `verifyManageToken` (HMAC-SHA256). We use
 * the REAL `generateManageToken` so signatures match; the shared secret is
 * `JWT_SECRET` injected by vitest.config.server.ts (BOOKING_HMAC_SECRET unset
 * → falls back to JWT_SECRET).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Module mocks (hoisted before all imports) ────────────────────────────────

vi.mock('../config/db', () => ({
  prisma: {
    booking: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('../lib/email', () => ({
  sendCancellationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../config/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import manageRoutes from './manage';
import { errorHandler } from '../middleware/error';
import { prisma } from '../config/db';
import { sendCancellationEmail } from '../lib/email';
import { generateManageToken } from '../lib/hmac';

// ── Test utilities ────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/manage', manageRoutes);
  app.use(errorHandler);
  return app;
}

// ── Shared fixtures ───────────────────────────────────────────────────────────

const BOOKING_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';

const FAKE_BOOKING = {
  id: BOOKING_ID,
  scheduledAt: new Date('2026-07-01T10:00:00.000Z'),
  durationMin: 60,
  status: 'CONFIRMED',
  cancellationReason: null,
  user: { name: 'Ada Lovelace', email: 'ada@example.com' },
  service: { titleEn: 'Strategy Session', titleTr: 'Strateji Görüşmesi' },
};

// ── GET /api/manage/booking ─────────────────────────────────────────────────

describe('GET /api/manage/booking', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with booking summary for a valid token', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(FAKE_BOOKING as never);
    const token = generateManageToken(BOOKING_ID);

    const res = await request(app).get('/api/manage/booking').query({ id: BOOKING_ID, token });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBe(BOOKING_ID);
    expect(res.body.data.userName).toBe('Ada Lovelace');
    expect(res.body.data.service.titleEn).toBe('Strategy Session');
  });

  it('returns 401 for a tampered/invalid token', async () => {
    const res = await request(app)
      .get('/api/manage/booking')
      .query({ id: BOOKING_ID, token: 'not-a-valid-token-string' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(prisma.booking.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', async () => {
    const token = generateManageToken(BOOKING_ID, -10);

    const res = await request(app).get('/api/manage/booking').query({ id: BOOKING_ID, token });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('EXPIRED');
    expect(prisma.booking.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 when token bookingId does not match the id param', async () => {
    const token = generateManageToken(OTHER_ID);

    const res = await request(app).get('/api/manage/booking').query({ id: BOOKING_ID, token });

    expect(res.status).toBe(401);
    expect(prisma.booking.findUnique).not.toHaveBeenCalled();
  });

  it('returns 400 for a non-uuid id (zod validation)', async () => {
    const token = generateManageToken('not-a-uuid');

    const res = await request(app).get('/api/manage/booking').query({ id: 'not-a-uuid', token });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when the booking does not exist', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);
    const token = generateManageToken(BOOKING_ID);

    const res = await request(app).get('/api/manage/booking').query({ id: BOOKING_ID, token });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Booking not found');
  });
});

// ── POST /api/manage/booking/cancel ───────────────────────────────────────────

describe('POST /api/manage/booking/cancel', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('cancels a confirmed booking and returns 200', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(FAKE_BOOKING as never);
    const token = generateManageToken(BOOKING_ID);

    const res = await request(app)
      .post('/api/manage/booking/cancel')
      .send({ id: BOOKING_ID, token });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Booking cancelled');
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BOOKING_ID },
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }),
    );
    expect(sendCancellationEmail).toHaveBeenCalledTimes(1);
  });

  it('is idempotent for an already-cancelled booking (no update)', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      ...FAKE_BOOKING,
      status: 'CANCELLED',
    } as never);
    const token = generateManageToken(BOOKING_ID);

    const res = await request(app)
      .post('/api/manage/booking/cancel')
      .send({ id: BOOKING_ID, token });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Already cancelled');
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .post('/api/manage/booking/cancel')
      .send({ id: BOOKING_ID, token: 'bogus-token' });

    expect(res.status).toBe(401);
    expect(prisma.booking.findUnique).not.toHaveBeenCalled();
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('returns 404 when cancelling a non-existent booking', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);
    const token = generateManageToken(BOOKING_ID);

    const res = await request(app)
      .post('/api/manage/booking/cancel')
      .send({ id: BOOKING_ID, token });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Booking not found');
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('returns 400 when token field is missing (zod validation)', async () => {
    const res = await request(app).post('/api/manage/booking/cancel').send({ id: BOOKING_ID });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
