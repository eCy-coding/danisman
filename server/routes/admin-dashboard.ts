/**
 * P57.2 — Admin dashboard aggregate endpoints.
 *
 * Read-only KPI + chart + activity + health summary. JWT + ADMIN required.
 *
 * Routes (mounted under /api/admin/dashboard):
 *   GET /kpi      — 6 KPI + deltas
 *   GET /charts   — 30d lead trend + source pie + funnel
 *   GET /activity — last 10 events
 *   GET /health   — backend/db/queue + error rate + uptime
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/db';
import { redis } from '../config/redis';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

async function safeCount(promise: Promise<number>): Promise<number> {
  try {
    return await promise;
  } catch {
    return 0;
  }
}

router.get('/kpi', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * DAY_MS);
    const since60 = new Date(now.getTime() - 60 * DAY_MS);
    const since7 = new Date(now.getTime() - 7 * DAY_MS);
    const since14 = new Date(now.getTime() - 14 * DAY_MS);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [leads30, leadsPrev30, subs7, subsPrev7, bookingsMonth, totalSubs] = await Promise.all([
      safeCount(prisma.contactSubmission.count({ where: { createdAt: { gte: since30 } } })),
      safeCount(
        prisma.contactSubmission.count({
          where: { createdAt: { gte: since60, lt: since30 } },
        }),
      ),
      safeCount(prisma.newsletterSubscriber.count({ where: { subscribedAt: { gte: since7 } } })),
      safeCount(
        prisma.newsletterSubscriber.count({
          where: { subscribedAt: { gte: since14, lt: since7 } },
        }),
      ),
      safeCount(prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } })),
      safeCount(prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } })),
    ]);

    const leadsDelta =
      leadsPrev30 > 0 ? Math.round(((leads30 - leadsPrev30) / leadsPrev30) * 100) : 0;
    const subscribersDelta =
      subsPrev7 > 0 ? Math.round(((subs7 - subsPrev7) / subsPrev7) * 100) : 0;

    // P44-T07 Round-6 — replace the "unread last 7d" heuristic with real
    // server-side lead scoring. Pulls the last-30d contact submissions
    // (capped at 200 for stability) and counts Tier A (score >= 80). Also
    // computes the avg lead score so the dashboard "Sıcak Lead" panel finally
    // surfaces a meaningful number.
    const { countHotLeads, scoreLead } = await import('../services/lead-scoring');
    const recentContacts = await prisma.contactSubmission.findMany({
      where: { createdAt: { gte: since30 } },
      select: {
        id: true,
        email: true,
        service: true,
        messageTr: true,
        messageEn: true,
        phone: true,
        source: true,
      },
      take: 200,
    });
    const { count: hotLeads } = countHotLeads(recentContacts);
    const avgLeadScore =
      recentContacts.length > 0
        ? Math.round(
            recentContacts.reduce((s, c) => s + scoreLead(c).score, 0) / recentContacts.length,
          )
        : 0;

    const conversionRate = leads30 > 0 ? (bookingsMonth / leads30) * 100 : 0;

    res.json({
      status: 'ok',
      data: {
        totalLeads30d: leads30,
        leadsDelta,
        newSubscribers7d: subs7,
        subscribersDelta,
        hotLeads,
        discoveryCallsThisMonth: bookingsMonth,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgLeadScore,
        totalActiveSubs: totalSubs,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/charts', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * DAY_MS);

    // 30d trend
    const recent = await prisma.contactSubmission.findMany({
      where: { createdAt: { gte: since30 } },
      select: { createdAt: true, source: true },
    });

    const byDay = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * DAY_MS);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    const sourceMap = new Map<string, number>();
    for (const r of recent) {
      const k = r.createdAt.toISOString().slice(0, 10);
      byDay.set(k, (byDay.get(k) ?? 0) + 1);
      const src = r.source ?? 'direct';
      sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
    }

    const leadTrend30d = Array.from(byDay.entries()).map(([day, count]) => ({
      day: day.slice(5), // MM-DD
      count,
    }));
    const sourceBreakdown = Array.from(sourceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Funnel: View → Engage → Form → Book (proxy)
    const [pageViews, interactions, forms, bookings] = await Promise.all([
      safeCount(prisma.analytics.count({ where: { createdAt: { gte: since30 } } })),
      safeCount(prisma.interaction.count({ where: { createdAt: { gte: since30 } } })),
      safeCount(prisma.contactSubmission.count({ where: { createdAt: { gte: since30 } } })),
      safeCount(prisma.booking.count({ where: { createdAt: { gte: since30 } } })),
    ]);
    const funnel = [
      { stage: 'Görüntüleme', count: pageViews },
      { stage: 'Etkileşim', count: interactions },
      { stage: 'Form', count: forms },
      { stage: 'Rezervasyon', count: bookings },
    ];

    res.json({ status: 'ok', data: { leadTrend30d, sourceBreakdown, funnel } });
  } catch (err) {
    next(err);
  }
});

router.get('/activity', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [contacts, subs, bookings] = await Promise.all([
      prisma.contactSubmission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullName: true, email: true, createdAt: true },
      }),
      prisma.newsletterSubscriber.findMany({
        orderBy: { subscribedAt: 'desc' },
        take: 5,
        select: { id: true, email: true, subscribedAt: true },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          scheduledAt: true,
          user: { select: { email: true, name: true } },
        },
      }),
    ]);

    const events = [
      ...contacts.map((c) => ({
        id: c.id,
        type: 'İletişim',
        subject: `${c.fullName} (${c.email})`,
        timestamp: c.createdAt.toISOString(),
      })),
      ...subs.map((s) => ({
        id: s.id,
        type: 'Newsletter',
        subject: s.email,
        timestamp: s.subscribedAt.toISOString(),
      })),
      ...bookings.map((b) => ({
        id: b.id,
        type: 'Rezervasyon',
        subject: `${b.user?.name ?? 'Bilinmiyor'} (${b.user?.email ?? '—'})`,
        timestamp: b.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .slice(0, 10);

    res.json({ status: 'ok', data: events });
  } catch (err) {
    next(err);
  }
});

router.get('/health', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dbStart = Date.now();
    let dbStatus: 'ok' | 'degraded' | 'down' = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
      if (Date.now() - dbStart > 500) dbStatus = 'degraded';
    } catch {
      dbStatus = 'down';
    }

    let queueStatus: 'ok' | 'degraded' | 'down' = 'ok';
    try {
      await redis.ping();
    } catch {
      queueStatus = 'down';
    }

    res.json({
      status: 'ok',
      data: {
        backend: 'ok' as const,
        db: dbStatus,
        queue: queueStatus,
        errorRate: 0, // Sentry/log entegrasyonu sonrası gerçek
        uptime: process.uptime(),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
