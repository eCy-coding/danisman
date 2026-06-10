/**
 * Booking route tests — public conversion funnel (P37-T01)
 *
 * Verifies:
 *   - POST /api/bookings/public valid payload → 201 + booking.create called
 *   - missing required field (scheduledAt) → 400
 *   - past / invalid scheduledAt → 400
 *   - GET /api/bookings/slots forwards to Cal.com helper → 200
 *   - GET /api/bookings/slots inverted date range → 400
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Hoisted mocks (lifted above vi.mock factories) ───────────────────────────
const {
  txUserFindUniqueMock,
  txUserCreateMock,
  txBookingCreateMock,
  getAvailableSlotsMock,
  sendBookingConfirmationMock,
  generateICSMock,
  googleCalendarUrlMock,
  bookingManageUrlMock,
  notifyNewBookingMock,
} = vi.hoisted(() => ({
  txUserFindUniqueMock: vi.fn(),
  txUserCreateMock: vi.fn(),
  txBookingCreateMock: vi.fn(),
  getAvailableSlotsMock: vi.fn(),
  sendBookingConfirmationMock: vi.fn(async () => true),
  generateICSMock: vi.fn(() => 'BEGIN:VCALENDAR'),
  googleCalendarUrlMock: vi.fn(() => 'https://calendar.google.com/test'),
  bookingManageUrlMock: vi.fn(() => 'https://ecypro.com/manage/test'),
  notifyNewBookingMock: vi.fn(async () => undefined),
}));

// Prisma: pass-through $transaction re-using the same tx-scoped mocks.
vi.mock('../config/db', () => {
  const prismaMock: Record<string, unknown> = {
    user: { findUnique: txUserFindUniqueMock, create: txUserCreateMock },
    booking: { create: txBookingCreateMock },
  };
  prismaMock.$transaction = vi.fn(async (cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock));
  return { prisma: prismaMock };
});

vi.mock('../lib/calcom-api', () => ({ getAvailableSlots: getAvailableSlotsMock }));

// Dynamically imported (fire-and-forget) async side-effects — mocked so the
// post-response IIFEs resolve against fakes instead of real email/Telegram.
vi.mock('../lib/email', () => ({ sendBookingConfirmation: sendBookingConfirmationMock }));
vi.mock('../lib/calendar', () => ({
  generateICS: generateICSMock,
  googleCalendarUrl: googleCalendarUrlMock,
}));
vi.mock('../lib/hmac', () => ({ bookingManageUrl: bookingManageUrlMock }));
vi.mock('../lib/telegram', () => ({ notifyNewBooking: notifyNewBookingMock }));

// Bypass rate limiting — covered in rateLimiter.test.ts.
vi.mock('../middleware/rateLimiter', () => ({
  publicBookingLimiter: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => next(),
  slotsFetchLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────
import bookingRoutes from './bookings';
import { errorHandler } from '../middleware/error';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', bookingRoutes);
  app.use(errorHandler);
  return app;
}

const FUTURE_ISO = new Date(Date.now() + 7 * 86_400_000).toISOString();

const FAKE_USER = { id: 'user-uuid-test-1234', email: 'ada@example.com', name: 'Ada Lovelace' };
const FAKE_BOOKING = {
  id: 'booking-uuid-test-1234',
  scheduledAt: new Date(FUTURE_ISO),
  user: { email: FAKE_USER.email, name: FAKE_USER.name },
};

// ── POST /api/bookings/public ─────────────────────────────────────────────────

describe('POST /api/bookings/public', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txUserFindUniqueMock.mockResolvedValue(null);
    txUserCreateMock.mockResolvedValue(FAKE_USER as never);
    txBookingCreateMock.mockResolvedValue(FAKE_BOOKING as never);
  });

  it('creates a booking and returns 201 with bookingId', async () => {
    const res = await request(makeApp()).post('/api/bookings/public').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      scheduledAt: FUTURE_ISO,
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.bookingId).toBe(FAKE_BOOKING.id);
    expect(txBookingCreateMock).toHaveBeenCalledTimes(1);
  });

  it('reuses an existing guest user without creating a new one', async () => {
    txUserFindUniqueMock.mockResolvedValue(FAKE_USER as never);

    const res = await request(makeApp()).post('/api/bookings/public').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      scheduledAt: FUTURE_ISO,
    });

    expect(res.status).toBe(201);
    expect(txUserCreateMock).not.toHaveBeenCalled();
    expect(txBookingCreateMock).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when scheduledAt is missing', async () => {
    const res = await request(makeApp()).post('/api/bookings/public').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(txBookingCreateMock).not.toHaveBeenCalled();
  });

  it('returns 400 when name and email are missing', async () => {
    const res = await request(makeApp())
      .post('/api/bookings/public')
      .send({ scheduledAt: FUTURE_ISO });

    expect(res.status).toBe(400);
    expect(txBookingCreateMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a past scheduledAt', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const res = await request(makeApp()).post('/api/bookings/public').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      scheduledAt: past,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('future');
    expect(txBookingCreateMock).not.toHaveBeenCalled();
  });
});

// ── GET /api/bookings/slots ─────────────────────────────────────────────────

describe('GET /api/bookings/slots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAvailableSlotsMock.mockResolvedValue([{ date: '2026-07-01', slots: [] }]);
  });

  it('returns 200 with slots from the Cal.com helper', async () => {
    const res = await request(makeApp())
      .get('/api/bookings/slots')
      .query({ startDate: '2026-07-01', endDate: '2026-07-10' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(getAvailableSlotsMock).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for an inverted date range', async () => {
    const res = await request(makeApp())
      .get('/api/bookings/slots')
      .query({ startDate: '2026-07-10', endDate: '2026-07-01' });

    expect(res.status).toBe(400);
    expect(getAvailableSlotsMock).not.toHaveBeenCalled();
  });
});
