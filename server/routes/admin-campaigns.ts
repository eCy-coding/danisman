/**
 * P55.B1 — Admin newsletter campaigns endpoints.
 *
 * Routes mounted at `/api/admin/newsletter/campaigns`:
 *   - GET   /            — list campaigns (paginated, in-memory store)
 *   - POST  /            — create campaign (subject + body + audienceFilter)
 *   - POST  /:id/send    — enqueue campaign send to all confirmed subscribers
 *   - GET   /:id         — campaign detail with delivery stats
 *   - GET   /metrics     — drip queue + DLQ depth + counters
 *
 * Storage: Redis Hash `campaign:<id>` — no Prisma schema migration needed.
 *   Campaign rows: id, subject, body, audienceFilter, createdAt,
 *                   queuedAt, sentCount, failedCount, status.
 *
 * Auth: requires JWT + ADMIN role (re-uses existing middleware).
 */

import crypto from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import {
  enrollSubscriber,
  getQueueDepth,
  getDlqDepth,
  getDripMetrics,
} from '../jobs/drip-campaign';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

const CAMPAIGN_KEY = (id: string) => `campaign:${id}`;
const CAMPAIGN_INDEX_KEY = 'campaign:index'; // sorted set by createdAt

const createSchema = z.object({
  subject: z.string().min(3).max(150),
  body: z.string().min(10).max(50_000),
  audienceFilter: z
    .object({
      source: z.string().optional(),
      consentOnly: z.boolean().default(true),
    })
    .default({ consentOnly: true }),
  templateKey: z.string().min(1).max(80).default('welcome'),
});

interface CampaignRecord {
  id: string;
  subject: string;
  body: string;
  audienceFilter: { source?: string; consentOnly: boolean };
  templateKey: string;
  createdAt: number;
  queuedAt: number | null;
  sentCount: number;
  failedCount: number;
  status: 'draft' | 'queued' | 'sent' | 'failed';
}

async function saveCampaign(c: CampaignRecord): Promise<void> {
  await redis.set(CAMPAIGN_KEY(c.id), JSON.stringify(c));
  await redis.zadd(CAMPAIGN_INDEX_KEY, c.createdAt, c.id);
}

async function loadCampaign(id: string): Promise<CampaignRecord | null> {
  const raw = await redis.get(CAMPAIGN_KEY(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CampaignRecord;
  } catch {
    return null;
  }
}

// ── GET / ─────────────────────────────────────────────────────────────────

router.get('/', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(50, parseInt(String(req.query.limit ?? '20'), 10));
    const offset = Math.max(0, parseInt(String(req.query.offset ?? '0'), 10));
    // Newest first
    const ids = await redis.zrevrange(CAMPAIGN_INDEX_KEY, offset, offset + limit - 1);
    const items: CampaignRecord[] = [];
    for (const id of ids) {
      const c = await loadCampaign(id);
      if (c) items.push(c);
    }
    const total = await redis.zcard(CAMPAIGN_INDEX_KEY);
    res.json({ status: 'ok', data: { items, total, limit, offset } });
  } catch (err) {
    next(err);
  }
});

// ── POST / ────────────────────────────────────────────────────────────────

router.post('/', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    const campaign: CampaignRecord = {
      id: crypto.randomUUID(),
      subject: data.subject,
      body: data.body,
      audienceFilter: data.audienceFilter,
      templateKey: data.templateKey,
      createdAt: Date.now(),
      queuedAt: null,
      sentCount: 0,
      failedCount: 0,
      status: 'draft',
    };
    await saveCampaign(campaign);
    logger.info('[admin-campaigns] created', { id: campaign.id, subject: data.subject });
    res.status(201).json({ status: 'ok', data: campaign });
  } catch (err) {
    next(err);
  }
});

// ── GET /metrics ──────────────────────────────────────────────────────────
// P44-T07: must be declared BEFORE `/:id` because Express matches in
// registration order; with `/:id` first, `/metrics` was being captured as
// `id=metrics` and rejected by loadCampaign() with a 404. The admin newsletter
// UI calls this endpoint to populate Queue depth / DLQ depth / processed
// counters on the campaigns dashboard.
router.get('/metrics', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [queue, dlq] = await Promise.all([getQueueDepth(), getDlqDepth()]);
    const counters = getDripMetrics();
    res.json({ status: 'ok', data: { queue, dlq, counters } });
  } catch (err) {
    next(err);
  }
});

// ── GET /:id ──────────────────────────────────────────────────────────────

router.get('/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ status: 'error', message: 'id required' });
    const c = await loadCampaign(id);
    if (!c) return res.status(404).json({ status: 'error', message: 'not_found' });
    res.json({ status: 'ok', data: c });
  } catch (err) {
    next(err);
  }
});

// ── POST /:id/send ────────────────────────────────────────────────────────

router.post('/:id/send', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ status: 'error', message: 'id required' });
    const c = await loadCampaign(id);
    if (!c) return res.status(404).json({ status: 'error', message: 'not_found' });
    if (c.status !== 'draft') {
      return res.status(409).json({ status: 'error', message: `already ${c.status}` });
    }

    const where: { unsubscribedAt: null; consent?: boolean; source?: string } = {
      unsubscribedAt: null,
    };
    if (c.audienceFilter.consentOnly) where.consent = true;
    if (c.audienceFilter.source) where.source = c.audienceFilter.source;

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where,
      select: { id: true, email: true },
    });

    let enrolled = 0;
    for (const s of subscribers) {
      const firstName = s.email.split('@')[0] ?? 'orada';
      const result = await enrollSubscriber({
        subscriberId: s.id,
        email: s.email,
        firstName,
        sequenceKey: 'newsletter-welcome-tr',
      });
      if (result.ok) enrolled += result.scheduled;
    }

    c.status = 'queued';
    c.queuedAt = Date.now();
    c.sentCount = enrolled;
    await saveCampaign(c);
    logger.info('[admin-campaigns] queued', { id, recipients: subscribers.length });

    // P44-T07 Round-6 — adminEventBus emit so the Newsletter Kampanyalar
    // dashboard's campaign ticker updates without polling. The bridge in
    // admin-analytics-stream.ts maps `campaign.sent` to the wire-format
    // `campaign_sent` event.
    try {
      const { adminEventBus } = await import('../lib/event-bus');
      adminEventBus.publish('campaign.sent', {
        id,
        subject: c.subject,
        recipientCount: subscribers.length,
        enrolled,
      });
    } catch {
      /* never block campaign queueing on bus publish */
    }

    res.json({ status: 'ok', data: { id, recipients: subscribers.length, enrolled } });
  } catch (err) {
    next(err);
  }
});

// ── POST /test ─────────────────────────────────────────────────────────────

const testSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(150),
  body: z.string().min(1).max(50_000),
});

router.post('/test', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = testSchema.parse(req.body);
    const { sendDripEmail } = await import('../utils/drip-smtp');
    await sendDripEmail({
      to: data.to,
      subject: `[TEST] ${data.subject}`,
      html: `<div style="font-family:system-ui;color:#0f172a;padding:16px"><p style="font-size:11px;color:#64748b">Test gönderimi</p>${data.body.replace(/\n/g, '<br/>')}</div>`,
      text: data.body,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
