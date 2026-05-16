/**
 * P18 BE Track 2 / Aşama 2 — Prometheus scrape endpoint.
 *
 * Mounted at `/metrics` (under `/api`). The route emits the canonical
 * text-format exposition for prom-client. Authentication strategy:
 *
 *   - If `METRICS_BEARER` env is set, require `Authorization: Bearer <token>`
 *     with constant-time comparison.
 *   - If `METRICS_BASIC_USER` / `METRICS_BASIC_PASS` are set, require
 *     RFC-7617 Basic auth with constant-time comparison.
 *   - If neither is set (dev/private VPC), the endpoint is open.
 *
 * On top of the route auth, Prometheus scrapes typically come from a
 * private subnet — operators should ALSO restrict by IP at the
 * reverse-proxy (nginx allow rule). This is defense-in-depth.
 *
 * The handler updates the BullMQ pending gauges + db pool gauges
 * SYNCHRONOUSLY before serialising the registry so scrapes always reflect
 * the latest snapshot rather than the previous-scrape sample.
 */

import { Router, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { metrics } from '../observability/metrics';
import { ALL_QUEUE_NAMES, getQueueStats } from '../queues';
import { pgPool } from '../config/db';
import { logger } from '../config/logger';

const router = Router();

function safeStringEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function authenticateScrape(req: Request, res: Response): boolean {
  const bearer = process.env.METRICS_BEARER ?? '';
  const basicUser = process.env.METRICS_BASIC_USER ?? '';
  const basicPass = process.env.METRICS_BASIC_PASS ?? '';

  // No auth configured → open endpoint (dev / private VPC). We log a
  // single warning on boot via the operator, not here, to avoid noise.
  if (!bearer && !basicUser && !basicPass) return true;

  const header = (req.headers.authorization ?? '').toString();

  if (bearer && header.startsWith('Bearer ')) {
    const presented = header.slice('Bearer '.length).trim();
    if (safeStringEqual(presented, bearer)) return true;
  }

  if (basicUser && basicPass && header.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(header.slice('Basic '.length).trim(), 'base64').toString('utf8');
      const idx = decoded.indexOf(':');
      if (idx > 0) {
        const u = decoded.slice(0, idx);
        const p = decoded.slice(idx + 1);
        if (safeStringEqual(u, basicUser) && safeStringEqual(p, basicPass)) {
          return true;
        }
      }
    } catch {
      // base64 garbage — fall through to 401
    }
  }

  res.set('WWW-Authenticate', 'Bearer realm="metrics"');
  res.status(401).type('text/plain').send('Unauthorized');
  return false;
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  if (!authenticateScrape(req, res)) return;

  // Refresh sampled gauges before serialising so the scrape returns a
  // coherent snapshot rather than stale numbers from the previous tick.
  try {
    const stats = await Promise.all(ALL_QUEUE_NAMES.map((n) => getQueueStats(n)));
    for (const s of stats) {
      const pending = (s.waiting ?? 0) + (s.delayed ?? 0);
      metrics.setBullmqPending(s.queue, pending);
    }
  } catch (err) {
    logger.warn('[metrics] queue stats sample failed', {
      message: (err as Error).message,
    });
  }

  try {
    const total = (pgPool as unknown as { totalCount?: number }).totalCount ?? 0;
    const idle = (pgPool as unknown as { idleCount?: number }).idleCount ?? 0;
    metrics.setDbPool(total - idle, idle);
  } catch {
    // pg pool not initialised or shaped differently — skip.
  }

  try {
    const rendered = await metrics.render();
    res.setHeader('Content-Type', rendered.contentType);
    res.status(200).send(rendered.body);
  } catch (err) {
    logger.error('[metrics] render failed', { message: (err as Error).message });
    res.status(500).type('text/plain').send('# metrics rendering failed');
  }
});

export default router;
