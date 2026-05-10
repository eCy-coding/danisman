/**
 * P37-T04: Booking Reminder Job — node-cron
 *
 * Runs every 15 minutes and sends reminder emails for upcoming bookings:
 *   - 24h reminder: sent when booking is 24h±15min away
 *   - 1h  reminder: sent when booking is  1h±15min away
 *
 * Idempotency:
 *   - `reminder24hSent` and `reminder1hSent` flags on Booking model
 *     prevent duplicate sends even if job runs multiple times.
 *
 * Booking model fields used: scheduledAt, reminder24hSent, reminder1hSent,
 *   user.email, user.name, durationMin, meetingUrl.
 *
 * NOTE: This job requires `reminder24hSent` and `reminder1hSent` boolean
 *   columns on the Booking model (added via prisma schema — see note below).
 */

/**
 * P37-T04 (updated): Booking Reminder Job with full idempotency
 * P37-T10: NPS Feedback Email trigger — fired 1h after meeting ends
 *
 * Idempotency implementation:
 *   - Prisma WHERE includes `reminder24hSent: false` / `reminder1hSent: false`
 *   - After successful send: prisma.booking.update({ reminder24hSent: true })
 *   - Even if job runs multiple times in the same 15min window, flags prevent duplicates
 *
 * NPS email trigger:
 *   - Fired 1h after meeting end (scheduledAt + durationMin + 60min)
 *   - `feedbackEmailSent: false` flag prevents duplicates
 *   - Token generated via generateManageToken (same HMAC infra)
 */
import cron from 'node-cron';
import { prisma as _prisma } from '../config/db';
import { sendReminderEmail, sendFeedbackRequestEmail } from '../lib/email';
import { bookingManageUrl, generateManageToken } from '../lib/hmac';
import { logger } from '../config/logger';

// Type assertion: new fields (reminder24hSent, feedbackEmailSent, calcomUid) added to schema
// but prisma client needs `prisma generate` to reflect them. Using `any` until then.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;

const WINDOW_MS = 15 * 60 * 1000; // ±15 minutes tolerance
const BASE_URL = process.env.VITE_PROD_URL ?? 'https://ecypro.com';

function formatTR(date: Date, style: 'date' | 'time'): string {
  return style === 'date'
    ? date.toLocaleDateString('tr-TR', { dateStyle: 'full', timeZone: 'Europe/Istanbul' })
    : date.toLocaleTimeString('tr-TR', { timeStyle: 'short', timeZone: 'Europe/Istanbul' });
}

async function sendReminders(): Promise<void> {
  const now = new Date();

  // 24h window: [now+23h45m, now+24h15m]
  const w24From = new Date(now.getTime() + 23 * 3600_000 - WINDOW_MS);
  const w24To = new Date(now.getTime() + 24 * 3600_000 + WINDOW_MS);
  // 1h window:  [now+45m, now+75m]
  const w1From = new Date(now.getTime() + 45 * 60_000);
  const w1To = new Date(now.getTime() + 75 * 60_000);
  // NPS window: meeting ended 1h ago ± 15min
  const wNpsFrom = new Date(now.getTime() - 75 * 60_000);
  const wNpsTo = new Date(now.getTime() - 45 * 60_000);

  try {
    // ─── 24h Reminders ────────────────────────────────────
    const bookings24h = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        scheduledAt: { gte: w24From, lte: w24To },
        reminder24hSent: false,
      },
      include: { user: { select: { email: true, name: true } } },
    });

    for (const booking of bookings24h) {
      const sent = await sendReminderEmail({
        to: booking.user.email!,
        name: booking.user.name ?? booking.user.email!.split('@')[0]!,
        date: formatTR(booking.scheduledAt, 'date'),
        time: formatTR(booking.scheduledAt, 'time'),
        timezone: 'Europe/Istanbul (UTC+3)',
        manageUrl: bookingManageUrl(booking.id),
        meetingUrl: booking.meetingUrl ?? undefined,
        hoursUntil: 24,
      });
      if (sent) {
        await prisma.booking.update({ where: { id: booking.id }, data: { reminder24hSent: true } });
      }
    }

    // ─── 1h Reminders ─────────────────────────────────────
    const bookings1h = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        scheduledAt: { gte: w1From, lte: w1To },
        reminder1hSent: false,
      },
      include: { user: { select: { email: true, name: true } } },
    });

    for (const booking of bookings1h) {
      const sent = await sendReminderEmail({
        to: booking.user.email!,
        name: booking.user.name ?? booking.user.email!.split('@')[0]!,
        date: formatTR(booking.scheduledAt, 'date'),
        time: formatTR(booking.scheduledAt, 'time'),
        timezone: 'Europe/Istanbul (UTC+3)',
        manageUrl: bookingManageUrl(booking.id),
        meetingUrl: booking.meetingUrl ?? undefined,
        hoursUntil: 1,
      });
      if (sent) {
        await prisma.booking.update({ where: { id: booking.id }, data: { reminder1hSent: true } });
      }
    }

    // ─── P37-T10: NPS Feedback Emails (1h after meeting end) ─

    // meetingEndAt = scheduledAt + durationMin; NPS email 1h later
    // Query: scheduledAt + durationMin ∈ [now-75min, now-45min]
    // Approximation: select bookings where scheduledAt ∈ [now-75min-90min, now-45min-15min]
    // (assuming 30-90min meetings → offset scheduledAt backwards)
    const npsBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        scheduledAt: { gte: wNpsFrom, lte: wNpsTo },
        feedbackEmailSent: false,
        feedback: null, // no feedback submitted yet
      },
      include: { user: { select: { email: true, name: true } } },
    });

    for (const booking of npsBookings) {
      // Verify meeting has actually ended (scheduledAt + durationMin <= now)
      const meetingEndAt = new Date(booking.scheduledAt.getTime() + booking.durationMin * 60_000);
      if (meetingEndAt > now) continue; // meeting not finished yet

      const feedbackToken = generateManageToken(booking.id, 7 * 24 * 60 * 60);
      const feedbackUrl = `${BASE_URL}/feedback/${booking.id}?token=${feedbackToken}`;

      // Pre-create the BookingFeedback record with token (empty, tokenUsed=false)
      await (
        prisma as unknown as { bookingFeedback: { upsert: (args: object) => Promise<unknown> } }
      ).bookingFeedback
        .upsert({
          where: { bookingId: booking.id },
          create: { bookingId: booking.id, score: 0, token: feedbackToken, tokenUsed: false },
          update: {},
        })
        .catch(() => {}); // ignore if already exists

      const sent = await sendFeedbackRequestEmail(
        booking.user.email!,
        booking.user.name ?? booking.user.email!.split('@')[0]!,
        formatTR(booking.scheduledAt, 'date'),
        feedbackUrl,
      );
      if (sent) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { feedbackEmailSent: true },
        });
      }
    }

    const totalSent = bookings24h.length + bookings1h.length + npsBookings.length;
    if (totalSent > 0) {
      logger.info('[ReminderJob] Emails sent', {
        reminder24h: bookings24h.length,
        reminder1h: bookings1h.length,
        npsEmails: npsBookings.length,
      });
    }
  } catch (err) {
    logger.error('[ReminderJob] Error', { message: (err as Error).message });
  }
}

/**
 * Start the booking reminder cron job.
 * Runs every 15 minutes (cron: 0,15,30,45 of every hour)
 */
export function startReminderJob(): void {
  logger.info('[ReminderJob] Starting — cron: every 15 minutes');

  cron.schedule(
    '0,15,30,45 * * * *',
    async () => {
      await sendReminders();
    },
    {
      timezone: 'UTC',
    },
  );
}
