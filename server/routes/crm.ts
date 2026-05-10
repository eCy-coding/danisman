/**
 * CRM Routes — Lead pipeline + sıcak lead listesi + sync hooks
 *
 * GET  /api/crm/leads/hot            → Tier A leads (admin)
 * GET  /api/crm/pipeline-stats        → funnel sayımları (admin)
 * POST /api/crm/sync-contact          → manual contact resync (admin)
 * POST /api/crm/notify                → manuel test bildirimi (admin)
 *
 * Lead scoring API (server/lib/lead-scoring.ts) ile entegre.
 */
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireRole } from '../middleware/auth';
import { logger } from '../config/logger';
import { computeLeadScore, classifyLead, type InteractionRecord } from '../lib/lead-scoring';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

interface ContactRow {
  id: string;
  email: string;
  fullName: string;
  messageTr: string | null;
  messageEn: string | null;
  company: string | null;
  isRead: boolean;
  createdAt: Date;
}

// ── GET /api/crm/leads/hot ──────────────────────────────────
router.get(
  '/leads/hot',
  ...adminOnly,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Son 90 günün contact submissions'larını çek
      const since = new Date(Date.now() - 90 * 24 * 60 * 60_000);
      const contacts: ContactRow[] = await prisma.contactSubmission.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          email: true,
          fullName: true,
          messageTr: true,
          messageEn: true,
          company: true,
          isRead: true,
          createdAt: true,
        },
      });

      // Her contact için skor hesapla
      const scored = await Promise.all(
        contacts.map(async (c) => {
          // Bu email için interaction sayımları
          const interactionsRaw = await (
            prisma as unknown as {
              analytics: {
                groupBy: (
                  args: object,
                ) => Promise<Array<{ interactionType: string; _count: { id: number } }>>;
              };
            }
          ).analytics
            .groupBy({
              by: ['interactionType'],
              where: { sessionId: { contains: c.email.split('@')[0] } }, // best-effort
              _count: { id: true },
            })
            .catch(() => [] as Array<{ interactionType: string; _count: { id: number } }>);

          const interactions: InteractionRecord[] = interactionsRaw.map((r) => ({
            type: r.interactionType,
            count: r._count.id,
          }));
          // Contact form submit her zaman var (en az +100 puan)
          interactions.push({ type: 'CONTACT_SUBMIT', count: 1 });

          const result = computeLeadScore(interactions, c.email, c.createdAt);
          const tier = classifyLead(result.totalScore);
          const message = (c.messageTr ?? c.messageEn ?? '').slice(0, 160);
          return {
            id: c.id,
            email: c.email,
            name: c.fullName,
            company: c.company,
            message,
            isRead: c.isRead,
            createdAt: c.createdAt,
            score: result.totalScore,
            tier: tier.tier,
            tierLabel: tier.label,
            tierColor: tier.color,
          };
        }),
      );

      // Sadece tier A (>= 100 puan)
      const hot = scored.filter((s) => s.tier === 'A').sort((a, b) => b.score - a.score);

      res.json({
        status: 'success',
        data: { items: hot, total: hot.length, scannedTotal: contacts.length },
      });
    } catch (err) {
      logger.error('[crm/leads/hot] error', { message: (err as Error).message });
      next(err);
    }
  },
);

// ── GET /api/crm/pipeline-stats ─────────────────────────────
router.get(
  '/pipeline-stats',
  ...adminOnly,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalContacts,
        unreadContacts,
        totalSubscribers,
        activeSubscribers,
        totalBookings,
        confirmedBookings,
      ] = await Promise.all([
        prisma.contactSubmission.count(),
        prisma.contactSubmission.count({ where: { isRead: false } }),
        prisma.newsletterSubscriber.count(),
        prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
        prisma.booking.count(),
        prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] } } }),
      ]);

      const last30Contacts = await prisma.contactSubmission.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60_000) } },
      });

      res.json({
        status: 'success',
        data: {
          contacts: { total: totalContacts, unread: unreadContacts, last30: last30Contacts },
          newsletter: { total: totalSubscribers, active: activeSubscribers },
          bookings: {
            total: totalBookings,
            confirmed: confirmedBookings,
            conversionRate: totalBookings ? confirmedBookings / totalBookings : 0,
          },
          funnel: {
            step1_contact: last30Contacts,
            step2_subscribed: activeSubscribers,
            step3_booked: confirmedBookings,
          },
        },
      });
    } catch (err) {
      logger.error('[crm/pipeline-stats] error', { message: (err as Error).message });
      next(err);
    }
  },
);

// ── POST /api/crm/sync-contact ──────────────────────────────
router.post(
  '/sync-contact',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { contactId } = req.body as { contactId: string };
      if (!contactId) {
        res.status(400).json({ status: 'error', message: 'contactId required' });
        return;
      }

      const contact = await prisma.contactSubmission.findUnique({ where: { id: contactId } });
      if (!contact) {
        res.status(404).json({ status: 'error', message: 'Contact not found' });
        return;
      }

      const result = computeLeadScore(
        [{ type: 'CONTACT_SUBMIT', count: 1 }],
        contact.email,
        contact.createdAt,
      );
      const tier = classifyLead(result.totalScore);

      logger.info('[crm/sync-contact] resynced', {
        contactId,
        score: result.totalScore,
        tier: tier.tier,
      });

      res.json({
        status: 'success',
        data: {
          contactId,
          email: contact.email,
          score: result.totalScore,
          tier,
        },
      });
    } catch (err) {
      logger.error('[crm/sync-contact] error', { message: (err as Error).message });
      next(err);
    }
  },
);

// ── POST /api/crm/notify ────────────────────────────────────
// Telegram test endpoint — admin manuel bildirim tetikleyebilir
router.post(
  '/notify',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message } = req.body as { message: string };
      if (!message) {
        res.status(400).json({ status: 'error', message: 'message required' });
        return;
      }

      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!token || !chatId) {
        res.status(503).json({ status: 'error', message: 'Telegram not configured' });
        return;
      }

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: `🔔 ${message}` }),
        signal: ctrl.signal,
      });
      clearTimeout(t);

      if (!tgRes.ok) {
        res.status(502).json({ status: 'error', message: 'Telegram error' });
        return;
      }

      res.json({ status: 'success', message: 'Notification sent' });
    } catch (err) {
      logger.error('[crm/notify] error', { message: (err as Error).message });
      next(err);
    }
  },
);

export default router;
