/**
 * P37-T05: Booking Management API (public, token-gated)
 *
 * Allows booking owners to reschedule/cancel without login
 * using a time-limited HMAC-signed token from their confirmation email.
 *
 * Routes:
 *   GET  /api/manage/booking?id=...&token=...  → get booking details
 *   POST /api/manage/booking/cancel            → cancel booking
 *
 * Security: verifyManageToken (HMAC-SHA256, 7-day TTL)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { verifyManageToken } from '../lib/hmac';
import { sendCancellationEmail } from '../lib/email';
import { logger } from '../config/logger';

const router = Router();

const querySchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(10),
});

// GET /api/manage/booking — verify token + return booking summary
router.get('/booking', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, token } = querySchema.parse(req.query);
    const result = verifyManageToken(token);

    if (!result.valid || result.bookingId !== id) {
      res.status(401).json({ status: 'error', message: result.reason ?? 'Invalid token' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        service: { select: { titleEn: true, titleTr: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ status: 'error', message: 'Booking not found' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        durationMin: booking.durationMin,
        status: booking.status,
        service: booking.service,
        userName: booking.user.name,
      },
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: (err as Error).message });
  }
});

// POST /api/manage/booking/cancel — cancel with token
router.post('/booking/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, token } = querySchema.parse(req.body);
    const result = verifyManageToken(token);

    if (!result.valid || result.bookingId !== id) {
      res.status(401).json({ status: 'error', message: result.reason ?? 'Invalid token' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!booking) {
      res.status(404).json({ status: 'error', message: 'Booking not found' });
      return;
    }

    if (booking.status === 'CANCELLED') {
      res.json({ status: 'success', message: 'Already cancelled' });
      return;
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED', cancellationReason: 'Cancelled by attendee' },
    });

    const dateStr = booking.scheduledAt.toLocaleDateString('tr-TR', {
      dateStyle: 'full',
      timeZone: 'Europe/Istanbul',
    });
    await sendCancellationEmail(booking.user.email, booking.user.name ?? 'Valued Client', dateStr);

    logger.info('[ManageRoute] Booking cancelled by attendee', { id });
    res.json({ status: 'success', message: 'Booking cancelled' });
  } catch (err) {
    logger.error('[ManageRoute] Cancel error', { message: (err as Error).message });
    res.status(400).json({ status: 'error', message: (err as Error).message });
  }
});

export default router;
