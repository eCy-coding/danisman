import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { sendBookingConfirmation } from '../lib/email';
import { generateICS, googleCalendarUrl } from '../lib/calendar';
import { bookingManageUrl } from '../lib/hmac';
import { logger } from '../config/logger';

// ─── Input Schemas ───────────────────────────────────────

const createBookingSchema = z.object({
  serviceId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime(),
  durationMin: z.number().int().min(15).max(120).default(30),
  notes: z.string().max(1000).optional(),
});

const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  cancellationReason: z.string().max(500).optional(),
});

// ─── Controllers ─────────────────────────────────────────

export const createBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = createBookingSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        serviceId: data.serviceId ?? null,
        scheduledAt: new Date(data.scheduledAt),
        durationMin: data.durationMin,
        notesTr: data.notes ?? null,
      },
      include: {
        service: true,
        user: { select: { email: true, name: true } },
      },
    });

    // P37-T02/T03: Async confirmation email + ICS attachment (non-blocking)
    void (async () => {
      try {
        const scheduledAt = booking.scheduledAt;
        const dateStr = scheduledAt.toLocaleDateString('tr-TR', {
          dateStyle: 'full',
          timeZone: 'Europe/Istanbul',
        });
        const timeStr = scheduledAt.toLocaleTimeString('tr-TR', {
          timeStyle: 'short',
          timeZone: 'Europe/Istanbul',
        });
        const manageUrl = bookingManageUrl(booking.id);
        const attendeeName = (booking.user.name ?? booking.user.email.split('@')[0]) as string;
        const ORGANIZER_EMAIL = process.env.EMAIL_FROM_ADDRESS ?? 'noreply@ecypro.com';

        const calInput = {
          uid: booking.id,
          title: `EcyPro — Stratejik Danışmanlık Görüşmesi`,
          startDate: scheduledAt,
          durationMinutes: booking.durationMin,
          organizerEmail: ORGANIZER_EMAIL,
          organizerName: 'EcyPro Premium Consulting',
          attendeeEmail: booking.user.email,
          attendeeName,
          meetingUrl: booking.meetingUrl ?? undefined,
        };

        const icsContent = generateICS(calInput);
        const gcalUrl = googleCalendarUrl(calInput);

        await sendBookingConfirmation({
          to: booking.user.email as string,
          name: attendeeName,
          date: dateStr,
          time: timeStr,
          timezone: 'Europe/Istanbul (UTC+3)',
          meetingUrl: booking.meetingUrl ?? undefined,
          manageUrl: `${manageUrl}&gcal=${encodeURIComponent(gcalUrl)}`,
          icsContent: icsContent ?? undefined,
        });
      } catch (emailErr) {
        logger.warn('[Booking] Confirmation email failed (non-fatal)', {
          message: (emailErr as Error).message,
        });
      }
    })();

    res.status(201).json({ status: 'success', data: { booking } });
  } catch (error) {
    next(error);
  }
};

export const listBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    // Admins/Consultants can see all bookings; users see only theirs
    const whereClause = userRole === 'ADMIN' || userRole === 'CONSULTANT' ? {} : { userId };

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: { service: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where: whereClause }),
    ]);

    res.json({
      status: 'success',
      data: { bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id  — Phase 20 C1
 * Owner OR ADMIN/CONSULTANT can fetch; everyone else gets 403.
 */
export const getBookingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');

    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true, user: { select: { id: true, name: true, email: true } } },
    });
    if (!booking) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');

    const isPrivileged = userRole === 'ADMIN' || userRole === 'CONSULTANT';
    if (!isPrivileged && booking.userId !== userId) {
      throw new HttpError(403, 'FORBIDDEN', 'Insufficient permissions for this booking');
    }

    res.json({ status: 'success', data: { booking } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/bookings/:id  — Phase 20 C2
 *
 * Soft-cancel for the booking owner: status → CANCELLED + reason.
 * Hard-delete for ADMIN. Returns 204 No Content on success.
 */
export const deleteBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');

    const { id } = req.params;
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');

    const isAdmin = userRole === 'ADMIN';
    const isOwner = existing.userId === userId;
    if (!isAdmin && !isOwner) {
      throw new HttpError(403, 'FORBIDDEN', 'Insufficient permissions for this booking');
    }

    if (isAdmin) {
      await prisma.booking.delete({ where: { id } });
    } else {
      await prisma.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason:
            (req.body?.cancellationReason as string | undefined) ?? 'Cancelled by user',
        },
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = updateBookingStatusSchema.parse(req.body);
    const { id } = req.params;
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: data.status,
        cancellationReason: data.cancellationReason ?? null,
      },
    });

    res.json({ status: 'success', data: { booking } });
  } catch (error) {
    next(error);
  }
};
