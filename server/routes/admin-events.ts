/**
 * P61.B1 — Admin SSE endpoint (Server-Sent Events real-time push).
 *
 * GET /api/admin/events
 * Auth: JWT + ADMIN role
 * Heartbeat: every 30s comment line to keep connection alive through proxies.
 * Channel: in-memory event-bus (single-process). Multi-instance için Redis
 * pub/sub upgrade gerekir (P62).
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { adminEventBus, type AdminEvent } from '../lib/event-bus';
import { logger } from '../config/logger';

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const write = (data: string) => {
    res.write(data);
  };

  // Initial hello + listener count
  write(`: connected ${new Date().toISOString()}\n`);
  write(`event: ready\ndata: ${JSON.stringify({ listeners: adminEventBus.listenerCount() + 1 })}\n\n`);

  const onEvent = (evt: AdminEvent) => {
    write(`event: ${evt.type}\n`);
    write(`data: ${JSON.stringify(evt)}\n\n`);
  };

  const unsubscribe = adminEventBus.subscribe(onEvent);

  const heartbeat = setInterval(() => {
    write(`: heartbeat ${Date.now()}\n\n`);
  }, 30_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    logger.info('[admin-events] client disconnected');
  });
});

export default router;
