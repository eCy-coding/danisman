/**
 * P61.B1 + P65 — Admin SSE endpoint.
 *
 * Auth: Authorization Bearer (polyfill ile) VEYA ?token=<jwt> query param
 * (fallback — polyfill desteklemeyen client'lar için).
 * Heartbeat: 30s.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { adminEventBus, type AdminEvent } from '../lib/event-bus';
import { logger } from '../config/logger';

const router = Router();

// P65 — Authorization header yoksa ?token= query param'dan al
function bridgeQueryToken(req: Request, _res: Response, next: NextFunction): void {
  if (!req.headers.authorization && typeof req.query.token === 'string') {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}

router.get(
  '/',
  bridgeQueryToken,
  authenticate,
  requireRole('ADMIN'),
  (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const write = (data: string) => res.write(data);

    write(`: connected ${new Date().toISOString()}\n`);
    write(
      `event: ready\ndata: ${JSON.stringify({ listeners: adminEventBus.listenerCount() + 1 })}\n\n`,
    );

    const onEvent = (evt: AdminEvent) => {
      write(`event: ${evt.type}\n`);
      write(`data: ${JSON.stringify(evt)}\n\n`);
    };
    const unsubscribe = adminEventBus.subscribe(onEvent);

    const heartbeat = setInterval(() => write(`: heartbeat ${Date.now()}\n\n`), 30_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      logger.info('[admin-events] client disconnected');
    });
  },
);

export default router;
