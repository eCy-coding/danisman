/**
 * Dev Analytics Relay — geliştirme ortamında frontend dataLayer/GA4 push'larını yakalar
 *
 * Sadece NODE_ENV !== 'production' aktif. Production'da 404 döndürür.
 *
 * POST /api/dev/analytics/collect → mock GA4 collect endpoint
 *                                     → console + SSE broadcast
 * GET  /api/dev/analytics/events  → son 100 in-memory event
 *
 * Kullanım: scripts/analytics-dev.ts ile koordineli — script port 4001'de
 * standalone çalışır, bu route ise API server üzerinden frontend'in proxy
 * yapabileceği route'tur (CORS olmaz, /api altındadır).
 */
import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const router = Router();

interface DevEvent {
  ts: number;
  source: 'ga4' | 'gtm' | 'frontend';
  name: string;
  payload: Record<string, unknown>;
  ip?: string;
}

const events: DevEvent[] = [];
const MAX_EVENTS = 100;

// Sadece dev'de aktif gate
function devOnly(req: Request, res: Response, next: () => void): void {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ status: 'error', message: 'Not found' });
    return;
  }
  next();
}

// ── POST /collect ──────────────────────────────────────────
router.post('/collect', devOnly, (req: Request, res: Response): void => {
  const body = req.body as Record<string, unknown>;
  const ev: DevEvent = {
    ts: Date.now(),
    source: 'frontend',
    name: (body.event_name as string) || (body.event as string) || 'unknown',
    payload: body,
    ip: req.ip,
  };

  events.unshift(ev);
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;

  logger.info(`[dev-analytics] ${ev.name}`, { source: ev.source });
  res.json({ status: 'success', received: true, ts: ev.ts });
});

// ── GET /events ────────────────────────────────────────────
router.get('/events', devOnly, (_req: Request, res: Response): void => {
  res.json({
    status: 'success',
    data: {
      total: events.length,
      events: events.slice(0, 50),
    },
  });
});

// ── DELETE /events ──────────────────────────────────────────
router.delete('/events', devOnly, (_req: Request, res: Response): void => {
  events.length = 0;
  res.json({ status: 'success', message: 'Events cleared' });
});

export default router;
