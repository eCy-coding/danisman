import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth';

// ─── Input Schemas ───────────────────────────────────────

const trackPageViewSchema = z.object({
  sessionId: z.string().min(1),
  page: z.string().min(1),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
  durationMs: z.number().int().optional(),
});

const trackInteractionSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(['PAGE_VIEW', 'CTA_CLICK', 'FORM_SUBMIT', 'BOOKING_START', 'DOWNLOAD', 'SCROLL_DEPTH']),
  target: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const contactSubmissionSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  service: z.string().optional(),
  message: z.string().max(2000).optional(),
  source: z.string().optional(),
});

// ─── Controllers ─────────────────────────────────────────

/**
 * Parse Accept-Language header and decide which locale column (messageTr/messageEn)
 * the inbound contact form should write to. Defaults to English when uncertain.
 */
function detectContactLocale(req: Request): 'tr' | 'en' {
  const header = (req.headers['accept-language'] || '').toString().toLowerCase();
  return header.startsWith('tr') ? 'tr' : 'en';
}

export const trackPageView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = trackPageViewSchema.parse(req.body);

    await prisma.analytics.create({
      data: {
        sessionId: data.sessionId,
        page: data.page,
        referrer: data.referrer ?? null,
        userAgent: data.userAgent ?? req.headers['user-agent'] ?? null,
        durationMs: data.durationMs ?? null,
      },
    });

    res.status(201).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};

export const trackInteraction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = trackInteractionSchema.parse(req.body);

    await prisma.interaction.create({
      data: {
        sessionId: data.sessionId,
        type: data.type,
        target: data.target,
        // Prisma expects Prisma.InputJsonValue; zod's Record<string, unknown> is compatible at runtime.
        metadata: (data.metadata ?? undefined) as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    res.status(201).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};

export const submitContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = contactSubmissionSchema.parse(req.body);
    const locale = detectContactLocale(req);

    const submission = await prisma.contactSubmission.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        company: data.company ?? null,
        phone: data.phone ?? null,
        service: data.service ?? null,
        // B5: respect Accept-Language — route message to the correct locale column.
        messageTr: locale === 'tr' ? data.message ?? null : null,
        messageEn: locale === 'en' ? data.message ?? null : null,
        source: data.source ?? null,
      },
    });

    res.status(201).json({ status: 'success', data: { id: submission.id } });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalBookings,
      pendingBookings,
      totalPageViews,
      totalInteractions,
      unreadContacts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.analytics.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.interaction.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.contactSubmission.count({ where: { isRead: false } }),
    ]);

    res.json({
      status: 'success',
      data: {
        totalUsers,
        totalBookings,
        pendingBookings,
        totalPageViews,
        totalInteractions,
        unreadContacts,
        period: '30d',
      },
    });
  } catch (error) {
    next(error);
  }
};
