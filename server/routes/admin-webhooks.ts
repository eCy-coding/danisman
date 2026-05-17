/**
 * P23 BE Track 2 / Aşama 2 — Admin CRUD for outbound webhook subscriptions.
 *
 *   POST   /api/admin/webhooks                 — create subscription
 *   GET    /api/admin/webhooks                 — list (own + with admin override)
 *   GET    /api/admin/webhooks/:id/deliveries  — delivery history
 *   POST   /api/admin/webhooks/:id/retry/:dId  — manual retry of a single delivery
 *   PATCH  /api/admin/webhooks/:id             — toggle active / update URL+events
 *   DELETE /api/admin/webhooks/:id             — delete subscription
 *
 * Auth: `authenticate` + admin OR owner check per row.
 * Secret return policy: the `secret` field is returned ONLY in the POST
 * response (creation) and in the optional `secret:rotate` flow. List/
 * detail responses elide the secret. Operator must persist it client-side
 * at creation time.
 */

import { Router, type Response } from 'express';
import { randomBytes } from 'node:crypto';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { enqueue } from '../queues';

const router = Router();

router.use(authenticate);

function generateSecret(): string {
  // 32 random bytes → 256 bits of entropy → 64 hex chars; safe for HMAC-SHA256.
  return randomBytes(32).toString('hex');
}

function isAdmin(req: AuthRequest): boolean {
  return req.user?.role === 'ADMIN';
}

router.post('/', async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ status: 'error', message: 'auth required' });
    return;
  }
  const body = (req.body ?? {}) as {
    url?: unknown;
    events?: unknown;
    userId?: unknown;
  };
  if (typeof body.url !== 'string' || !/^https?:\/\//i.test(body.url)) {
    res.status(400).json({ status: 'error', message: 'invalid url' });
    return;
  }
  if (!Array.isArray(body.events) || body.events.some((e) => typeof e !== 'string')) {
    res.status(400).json({ status: 'error', message: 'events must be string[]' });
    return;
  }
  // Admin may create on behalf of another user. Regular user creates own.
  const ownerId = isAdmin(req) && typeof body.userId === 'string' ? body.userId : user.id;

  const secret = generateSecret();
  const sub = await prisma.webhookSubscription.create({
    data: {
      userId: ownerId,
      url: body.url,
      events: body.events as string[],
      secret,
      active: true,
    },
  });
  logger.info('[admin-webhooks] subscription created', { id: sub.id, userId: ownerId });
  // Return the secret ONCE — client must persist it locally.
  res.status(201).json({
    status: 'ok',
    subscription: {
      id: sub.id,
      userId: sub.userId,
      url: sub.url,
      events: sub.events,
      active: sub.active,
      createdAt: sub.createdAt,
    },
    secret,
  });
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ status: 'error', message: 'auth required' });
    return;
  }
  const where = isAdmin(req) ? {} : { userId: user.id };
  const subs = await prisma.webhookSubscription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      userId: true,
      url: true,
      events: true,
      active: true,
      failureCount: true,
      lastSuccess: true,
      lastFailure: true,
      createdAt: true,
    },
  });
  res.json({ status: 'ok', subscriptions: subs });
});

router.get('/:id/deliveries', async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ status: 'error', message: 'auth required' });
    return;
  }
  const sub = await prisma.webhookSubscription.findUnique({
    where: { id: req.params.id },
    select: { userId: true },
  });
  if (!sub) {
    res.status(404).json({ status: 'error', message: 'not_found' });
    return;
  }
  if (!isAdmin(req) && sub.userId !== user.id) {
    res.status(403).json({ status: 'error', message: 'forbidden' });
    return;
  }
  const deliveries = await prisma.webhookDelivery.findMany({
    where: { subscriptionId: req.params.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      eventType: true,
      status: true,
      attemptCount: true,
      lastAttemptAt: true,
      responseStatus: true,
      errorMessage: true,
      createdAt: true,
    },
  });
  res.json({ status: 'ok', deliveries });
});

router.post('/:id/retry/:deliveryId', async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ status: 'error', message: 'auth required' });
    return;
  }
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: req.params.deliveryId },
    include: { subscription: { select: { userId: true, id: true } } },
  });
  if (!delivery || delivery.subscriptionId !== req.params.id) {
    res.status(404).json({ status: 'error', message: 'not_found' });
    return;
  }
  if (!isAdmin(req) && delivery.subscription.userId !== user.id) {
    res.status(403).json({ status: 'error', message: 'forbidden' });
    return;
  }
  // Reset status and re-enqueue. attemptCount is preserved so the audit
  // trail shows total operator + auto attempts.
  await prisma.webhookDelivery.update({
    where: { id: delivery.id },
    data: { status: 'pending', errorMessage: null },
  });
  const result = await enqueue('webhook-out', {
    deliveryId: delivery.id,
    subscriptionId: delivery.subscriptionId,
    eventType: delivery.eventType,
    payload: delivery.payload,
  });
  logger.info('[admin-webhooks] manual retry queued', {
    deliveryId: delivery.id,
    mode: result.mode,
  });
  res.json({ status: 'ok', delivery: delivery.id, mode: result.mode });
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ status: 'error', message: 'auth required' });
    return;
  }
  const existing = await prisma.webhookSubscription.findUnique({
    where: { id: req.params.id },
    select: { userId: true },
  });
  if (!existing) {
    res.status(404).json({ status: 'error', message: 'not_found' });
    return;
  }
  if (!isAdmin(req) && existing.userId !== user.id) {
    res.status(403).json({ status: 'error', message: 'forbidden' });
    return;
  }
  const body = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (typeof body.url === 'string' && /^https?:\/\//i.test(body.url)) data.url = body.url;
  if (Array.isArray(body.events) && body.events.every((e: unknown) => typeof e === 'string')) {
    data.events = body.events;
  }
  if (typeof body.active === 'boolean') {
    data.active = body.active;
    // Re-enabling resets the failure counter so the auto-deactivation
    // breaker doesn't immediately re-trip on the next failure.
    if (body.active) data.failureCount = 0;
  }
  if (Object.keys(data).length === 0) {
    res.status(400).json({ status: 'error', message: 'no_fields' });
    return;
  }
  const sub = await prisma.webhookSubscription.update({
    where: { id: req.params.id },
    data,
    select: {
      id: true,
      userId: true,
      url: true,
      events: true,
      active: true,
      failureCount: true,
      updatedAt: true,
    },
  });
  res.json({ status: 'ok', subscription: sub });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ status: 'error', message: 'auth required' });
    return;
  }
  const existing = await prisma.webhookSubscription.findUnique({
    where: { id: req.params.id },
    select: { userId: true },
  });
  if (!existing) {
    res.status(404).json({ status: 'error', message: 'not_found' });
    return;
  }
  if (!isAdmin(req) && existing.userId !== user.id) {
    res.status(403).json({ status: 'error', message: 'forbidden' });
    return;
  }
  await prisma.webhookSubscription.delete({ where: { id: req.params.id } });
  res.json({ status: 'ok' });
});

export default router;
