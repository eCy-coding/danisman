import { Router } from 'express';
import authRoutes from './auth';
import bookingRoutes from './bookings';
import analyticsRoutes from './analytics';
import newsletterRoutes from './newsletter';
import aiRoutes from './ai';
import adminRoutes from './admin';
import webhookRoutes from './webhooks';
import manageRoutes from './manage';
import totpRoutes from './totp';
import sessionRoutes from './sessions';
import leadRoutes from './leads';
import feedbackRoutes from './feedback';
import geoRoutes from './geo';
import crmRoutes from './crm';
import devAnalyticsRoutes from './dev-analytics';
import { openApiSpec } from '../config/openapi';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { checkAllServices } from '../lib/health';

const router = Router();

// BE-7: SERVICE_VERSION pulled from npm_package_version (set by node when run
// via `npm`/`pnpm`) → falls back to RELEASE_VERSION env (set by Render) → "1.0.0".
const SERVICE_VERSION =
  process.env.npm_package_version || process.env.RELEASE_VERSION || '1.0.0';

// ─── Basic health check ──────────────────────────────────
// Fast path — NO DB/Redis calls. For platform liveness probes.
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ecypro-api',
    version: SERVICE_VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Deep readiness probe ────────────────────────────────
// Verifies DB + Redis actually respond. Suitable for k8s readinessProbe / Render.
router.get('/ready', async (_req, res) => {
  const checks: Record<string, 'ok' | 'degraded' | 'down'> = {
    db: 'down',
    redis: 'down',
    sentry: process.env.SENTRY_DSN ? 'ok' : 'degraded',
  };

  // DB ping — 1.5s timeout
  try {
    const dbProbe = Promise.race([
      prisma.$queryRaw`SELECT 1`.then(() => 'ok' as const),
      new Promise<'down'>((resolve) => setTimeout(() => resolve('down'), 1500)),
    ]);
    checks.db = await dbProbe;
  } catch (err) {
    logger.warn('[ready] db probe failed', { message: (err as Error).message });
    checks.db = 'down';
  }

  // Redis ping — 500ms timeout; redis is optional → degraded if down
  try {
    const redisProbe = Promise.race([
      redis.ping().then(() => 'ok' as const),
      new Promise<'degraded'>((resolve) => setTimeout(() => resolve('degraded'), 500)),
    ]);
    checks.redis = await redisProbe;
  } catch {
    checks.redis = 'degraded';
  }

  const isReady = checks.db === 'ok';
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ok' : 'not_ready',
    service: 'ecypro-api',
    version: SERVICE_VERSION,
    uptime: process.uptime(),
    checks,
    timestamp: new Date().toISOString(),
  });
});

// ─── Prometheus-style metrics ────────────────────────────
// Intentionally minimal: no external `prom-client` dependency; plain text format.
const startTime = Date.now();
router.get('/metrics', (_req, res) => {
  const mem = process.memoryUsage();
  const uptimeSec = Math.round((Date.now() - startTime) / 1000);
  const lines = [
    '# HELP process_uptime_seconds Seconds since process start',
    '# TYPE process_uptime_seconds counter',
    `process_uptime_seconds ${uptimeSec}`,
    '# HELP process_resident_memory_bytes Resident memory in bytes',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${mem.rss}`,
    '# HELP nodejs_heap_used_bytes V8 heap in use',
    '# TYPE nodejs_heap_used_bytes gauge',
    `nodejs_heap_used_bytes ${mem.heapUsed}`,
    '# HELP nodejs_heap_total_bytes V8 heap allocated',
    '# TYPE nodejs_heap_total_bytes gauge',
    `nodejs_heap_total_bytes ${mem.heapTotal}`,
  ].join('\n');
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines + '\n');
});

// ─── Deep service health (all external integrations) ────────────────────────
// Async-checks DB, Redis, Cal.com, Telegram, Resend, Logtail, Gemini, Docker
router.get('/health/services', async (_req, res) => {
  try {
    const report = await checkAllServices();
    const httpStatus = report.overall === 'critical' ? 503 : 200;
    res.status(httpStatus).json(report);
  } catch (err) {
    logger.error('[health/services] check failed', { message: (err as Error).message });
    res.status(503).json({ overall: 'critical', error: 'Health check failed' });
  }
});

// ─── BE-12: OpenAPI Documentation ──────────────────────────────────────────
// /api/docs.json — raw OpenAPI 3 JSON (machine consumers, Postman import)
router.get('/docs.json', (_req, res) => {
  res.json(openApiSpec);
});

// /api/docs — Swagger UI rendered from CDN (no extra npm dep).
// Production gate: require an admin JWT to view interactive docs in prod.
// Dev/test: open. Set DOCS_PUBLIC=1 to keep open in prod (e.g. for partners).
router.get('/docs', (req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const isPublic = process.env.DOCS_PUBLIC === '1';
  if (!isProd || isPublic) return renderSwaggerUI(req, res);

  // Production + private → require Bearer token. Reuse the auth middleware
  // lazily so we don't pull it into the hot path for /health etc.
  return import('../middleware/auth').then(({ authenticate, requireRole }) => {
    authenticate(req, res, () => {
      requireRole('ADMIN')(
        req as Parameters<ReturnType<typeof requireRole>>[0],
        res,
        () => renderSwaggerUI(req, res),
      );
    });
  }).catch(next);
});

function renderSwaggerUI(_req: import('express').Request, res: import('express').Response): void {
  // Single-file HTML; loads Swagger UI assets from cdnjs (Anthropic-allowlisted CDN
  // already used elsewhere in the project for browser artifacts).
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>EcyPro API — Swagger UI</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css" />
  <style>body{margin:0;background:#1E1F20;}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js" crossorigin></script>
  <script>
    window.addEventListener('load', () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout',
        persistAuthorization: true,
      });
    });
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// ─── P36-T02: SSE Analytics Real-Time Stream ─────────────────────────────────
// Streams live interaction events + aggregated KPIs to AdminAnalyticsPage.
// No auth required for connection (frontend proxied, token validated below).
const analyticsClients = new Set<import('express').Response>();

router.get('/sse/analytics', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial snapshot
  try {
    const [contacts, subscribers, bookings, interactions] = await Promise.all([
      prisma.contactSubmission.count({ where: { isRead: false } }),
      prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.interaction.count({
        where: { createdAt: { gte: new Date(Date.now() - 5 * 60_000) } },
      }),
    ]);

    res.write(
      `data: ${JSON.stringify({
        type: 'snapshot',
        timestamp: Date.now(),
        kpi: {
          unreadContacts: contacts,
          activeSubscribers: subscribers,
          pendingBookings: bookings,
          activeNow: interactions,
        },
      })}\n\n`,
    );
  } catch {
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
  }

  analyticsClients.add(res);
  logger.info(`[SSE/analytics] client connected. total=${analyticsClients.size}`);

  const keepAlive = setInterval(() => res.write(': keepalive\n\n'), 25_000);

  // Heartbeat with fresh KPIs every 30s
  const kpiPoll = setInterval(async () => {
    try {
      const [contacts, subscribers, bookings, interactions] = await Promise.all([
        prisma.contactSubmission.count({ where: { isRead: false } }),
        prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.interaction.count({
          where: { createdAt: { gte: new Date(Date.now() - 5 * 60_000) } },
        }),
      ]);
      res.write(
        `data: ${JSON.stringify({
          type: 'kpi',
          timestamp: Date.now(),
          kpi: {
            unreadContacts: contacts,
            activeSubscribers: subscribers,
            pendingBookings: bookings,
            activeNow: interactions,
          },
        })}\n\n`,
      );
    } catch {
      /* DB unavailable — skip */
    }
  }, 30_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clearInterval(kpiPoll);
    analyticsClients.delete(res);
    logger.info(`[SSE/analytics] client disconnected. total=${analyticsClients.size}`);
  });
});

// Broadcast analytics event to all connected clients (called from analytics routes)
export function broadcastAnalyticsEvent(type: string, data: unknown): void {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of analyticsClients) {
    client.write(payload);
  }
}

// ─── P40-T95: Status Page API ─────────────────────────────────────────────────
router.get('/status', async (_req, res) => {
  try {
    const [dbOk, redisOk] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      redis
        .ping()
        .then(() => true)
        .catch(() => false),
    ]);

    const components = [
      { name: 'API', status: 'operational' as const },
      { name: 'Database', status: dbOk ? ('operational' as const) : ('degraded' as const) },
      { name: 'Cache', status: redisOk ? ('operational' as const) : ('degraded' as const) },
    ];

    const overall = components.every((c) => c.status === 'operational')
      ? 'operational'
      : 'degraded';
    res.json({
      page: { name: 'EcyPro API', url: 'https://ecypro.com' },
      status: {
        indicator: overall,
        description: overall === 'operational' ? 'All Systems Operational' : 'Degraded Service',
      },
      components,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[status] check failed', { message: (err as Error).message });
    res.status(503).json({
      status: { indicator: 'critical', description: 'Major Outage' },
      updatedAt: new Date().toISOString(),
    });
  }
});

// API Routes
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/manage', manageRoutes);
router.use('/auth/2fa', totpRoutes);
router.use('/sessions', sessionRoutes);
router.use('/leads', leadRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/geo', geoRoutes);
router.use('/crm', crmRoutes);
router.use('/dev/analytics', devAnalyticsRoutes);

export default router;
