/**
 * Booking Routes (P37-T01/T06/T09)
 *
 * Public:
 *   GET /api/bookings/slots?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *     → Proxy to Cal.com available slots (or fallback static slots)
 *     → No auth required (pre-booking flow)
 *
 * Authenticated:
 *   POST /api/bookings              → create booking
 *   GET  /api/bookings              → list user's bookings
 *   GET  /api/bookings/:id          → get single booking
 *   DELETE /api/bookings/:id        → delete booking
 *   PATCH  /api/bookings/:id/status → admin status update
 *
 * Admin:
 *   GET /api/bookings/analytics     → booking metrics (P37-T09)
 */
import { Router, Request, Response, NextFunction } from 'express';
import {
  createBooking,
  listBookings,
  getBookingById,
  deleteBooking,
  updateBookingStatus,
} from '../controllers/bookingController';
import { authenticate, requireRole } from '../middleware/auth';
import { getAvailableSlots } from '../lib/calcom-api';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { slotsFetchLimiter, publicBookingLimiter } from '../middleware/rateLimiter';

const router = Router();

// ─── P37-T01/T06: Public slots endpoint ──────────────────────
// No auth required — shown on landing page before login

router.get(
  '/slots',
  slotsFetchLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;

      // Default: today + 14 days (2 week window)
      const startDate = startDateStr ? new Date(startDateStr) : new Date();
      const endDate = endDateStr ? new Date(endDateStr) : new Date(Date.now() + 14 * 86_400_000);

      // Validate date range (max 60 days to prevent abuse)
      const diffDays = (endDate.getTime() - startDate.getTime()) / 86_400_000;
      if (diffDays > 60 || diffDays < 0) {
        res.status(400).json({ status: 'error', message: 'Date range must be 0–60 days' });
        return;
      }

      const slots = await getAvailableSlots(startDate, endDate);
      res.json({ status: 'success', data: slots });
    } catch (err) {
      next(err);
    }
  },
);

// ─── P37-T09: Booking analytics (admin only) ─────────────────

router.get(
  '/analytics',
  authenticate,
  requireRole('ADMIN'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const periods = {
        last7: new Date(now.getTime() - 7 * 86_400_000),
        last30: new Date(now.getTime() - 30 * 86_400_000),
        last90: new Date(now.getTime() - 90 * 86_400_000),
      };

      // Aggregate: total by status in each period
      const [total, byStatus, last90Daily, byService] = await Promise.all([
        // Total counts by status (all-time)
        prisma.booking.groupBy({
          by: ['status'],
          _count: { id: true },
        }),

        // Last 30d by status
        prisma.booking.groupBy({
          by: ['status'],
          where: { createdAt: { gte: periods.last30 } },
          _count: { id: true },
        }),

        // Daily count last 90 days (for trend chart) — typed Prisma $queryRaw
        prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
          SELECT DATE("scheduledAt") as day, COUNT(*) as count
          FROM bookings
          WHERE "scheduledAt" >= ${periods.last90}
          GROUP BY DATE("scheduledAt")
          ORDER BY day ASC
        `,

        // By service (top 5)
        prisma.booking.groupBy({
          by: ['serviceId'],
          where: { createdAt: { gte: periods.last30 }, serviceId: { not: null } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5,
        }),
      ]);

      // Convert BigInt to number for JSON serialization
      const trendData = last90Daily.map((row) => ({
        day: String(row.day).slice(0, 10),
        count: Number(row.count),
      }));

      // Status distribution (all-time)
      const statusDist = total.reduce<Record<string, number>>((acc, g) => {
        acc[g.status] = g._count.id;
        return acc;
      }, {});

      // Status distribution last 30d
      const statusDistL30 = byStatus.reduce<Record<string, number>>((acc, g) => {
        acc[g.status] = g._count.id;
        return acc;
      }, {});

      const totalAll = Object.values(statusDist).reduce((a: number, b: number) => a + b, 0);
      const cancelledAll = statusDist.CANCELLED ?? 0;
      const noShowAll = statusDist.NO_SHOW ?? 0;
      const cancelRate = totalAll > 0 ? Math.round((cancelledAll / totalAll) * 100) : 0;
      const noShowRate = totalAll > 0 ? Math.round((noShowAll / totalAll) * 100) : 0;

      res.json({
        status: 'success',
        data: {
          summary: {
            total: totalAll,
            confirmed: statusDist.CONFIRMED ?? 0,
            completed: statusDist.COMPLETED ?? 0,
            cancelled: cancelledAll,
            noShow: noShowAll,
            cancelRate,
            noShowRate,
          },
          last30: {
            total: Object.values(statusDistL30).reduce((a: number, b: number) => a + b, 0),
            byStatus: statusDistL30,
          },
          trend: trendData,
          byService: byService.map((s: any) => ({ serviceId: s.serviceId, count: s._count.id })),
        },
      });
    } catch (err) {
      logger.error('[BookingAnalytics] Error', { message: (err as Error).message });
      next(err);
    }
  },
);

// ─── P37-T01: Public booking create (no login required) ──────
// Accepts name+email+scheduledAt from BookingModal.
// Finds or creates user by email, then creates Booking.
// Sends confirmation email + ICS attachment asynchronously.

router.post(
  '/public',
  publicBookingLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        name,
        email,
        company,
        notes,
        scheduledAt,
        durationMin = 30,
      } = req.body as {
        name: string;
        email: string;
        company?: string;
        notes?: string;
        scheduledAt: string;
        durationMin?: number;
      };

      if (!name?.trim() || !email?.trim() || !scheduledAt) {
        res
          .status(400)
          .json({ status: 'error', message: 'name, email and scheduledAt are required' });
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const ts = new Date(scheduledAt);
      if (isNaN(ts.getTime()) || ts < new Date()) {
        res
          .status(400)
          .json({ status: 'error', message: 'scheduledAt must be a future ISO-8601 datetime' });
        return;
      }

      // P15-BE: Atomic guest user + booking creation.
      // Previously two independent writes — if the user was newly created
      // but booking.create then failed (validation, DB connection drop),
      // the platform held a passwordless ghost account with no booking
      // attached. Wrapping in a Prisma $transaction restores the
      // all-or-nothing invariant.
      const { user, booking } = await prisma.$transaction(async (tx) => {
        let found = await tx.user.findUnique({ where: { email: emailLower } });
        if (!found) {
          found = await tx.user.create({
            data: {
              email: emailLower,
              name: name.trim(),
              passwordHash: '', // guest user — no password
              role: 'USER',
            },
          });
        }

        const created = await tx.booking.create({
          data: {
            userId: found.id,
            scheduledAt: ts,
            durationMin: Math.min(Math.max(durationMin, 15), 120),
            notesTr: notes ?? (company ? `Şirket: ${company}` : null),
          },
          include: {
            user: { select: { email: true, name: true } },
          },
        });

        return { user: found, booking: created };
      });
      void user; // booking already carries user via include

      // Async confirmation email (fail-open — don't block response)
      void (async () => {
        try {
          const { sendBookingConfirmation } = await import('../lib/email');
          const { generateICS, googleCalendarUrl } = await import('../lib/calendar');
          const { bookingManageUrl } = await import('../lib/hmac');

          const dateStr = ts.toLocaleDateString('tr-TR', {
            dateStyle: 'full',
            timeZone: 'Europe/Istanbul',
          });
          const timeStr = ts.toLocaleTimeString('tr-TR', {
            timeStyle: 'short',
            timeZone: 'Europe/Istanbul',
          });
          const attendeeName = name.trim();
          const ORGANIZER_EMAIL = process.env.EMAIL_FROM_ADDRESS ?? 'noreply@ecypro.com';

          const calInput = {
            uid: booking.id,
            title: 'EcyPro — Stratejik Danışmanlık Görüşmesi',
            startDate: ts,
            durationMinutes: durationMin,
            organizerEmail: ORGANIZER_EMAIL,
            organizerName: 'EcyPro Premium Consulting',
            attendeeEmail: emailLower,
            attendeeName,
          };

          // gcalUrl for future use in email template — currently unused
          void googleCalendarUrl(calInput);
          const icsContent = generateICS(calInput);
          await sendBookingConfirmation({
            to: emailLower,
            name: attendeeName,
            date: dateStr,
            time: timeStr,
            timezone: 'Europe/Istanbul (UTC+3)',
            meetingUrl: undefined,
            manageUrl: bookingManageUrl(booking.id),
            icsContent: icsContent ?? undefined,
          });
        } catch (err) {
          logger.error('[PublicBooking] Email send failed', { error: (err as Error).message });
        }
      })();

      void (async () => {
        try {
          const { notifyNewBooking } = await import('../lib/telegram');
          const _dateStr = ts.toLocaleDateString('tr-TR', {
            dateStyle: 'short',
            timeZone: 'Europe/Istanbul',
          });
          const _timeStr = ts.toLocaleTimeString('tr-TR', {
            timeStyle: 'short',
            timeZone: 'Europe/Istanbul',
          });
          await notifyNewBooking({
            name: name.trim(),
            email: emailLower,
            date: _dateStr,
            time: _timeStr,
            timezone: 'Europe/Istanbul',
          });
        } catch {
          /* non-blocking */
        }
      })();

      res.status(201).json({
        status: 'success',
        data: {
          bookingId: booking.id,
          scheduledAt: booking.scheduledAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Authenticated booking CRUD ───────────────────────────────

router.use(authenticate);

router.post('/', createBooking);
router.get('/', listBookings);
router.get('/:id', getBookingById); // Phase 20 C1
router.delete('/:id', deleteBooking); // Phase 20 C2
router.patch('/:id/status', requireRole('ADMIN'), updateBookingStatus);

export default router;
