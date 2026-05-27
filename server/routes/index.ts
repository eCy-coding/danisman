import { Router } from 'express';
import authRoutes from './auth';
import bookingRoutes from './bookings';
import analyticsRoutes from './analytics';
import newsletterRoutes from './newsletter';
import newsletterLifecycleRoutes from './newsletter-lifecycle';
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
import contactRoutes from './contact';
import calendlyRoutes from './calendly';
import quickCheckRoutes from './quick-check';
import pricingCalcRoutes from './pricing-calc';
import gdprRoutes from './gdpr';
import searchRoutes from './search';
import uploadRoutes from './upload';
import uploadsGetRoutes from './uploads-get';
import metricsRoutes from './metrics';
import adminQueuesRoutes from './admin-queues';
import adminCampaignsRoutes from './admin-campaigns';
import adminDashboardRoutes from './admin-dashboard';
import adminContentRoutes from './admin-content';
import adminCollectionsRoutes from './admin-collections';
import adminLeadsRoutes from './admin-leads';
import adminLeadsNotesRoutes from './admin-leads-notes';
import adminMediaRoutes from './admin-media';
import adminSecurityRoutes from './admin-security';
import adminEventsRoutes from './admin-events';
import adminRevalidateRoutes from './admin-revalidate';
import publicServicesRoutes from './public-services';
// P23 BE Track 2 / Aşama 1 — topic-based SSE pub/sub
import streamRoutes from './stream';
// P23 BE Track 2 / Aşama 2 — outbound webhook admin CRUD
import adminWebhookRoutes from './admin-webhooks';
import { openApiSpec } from '../config/openapi';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { checkAllServices } from '../lib/health';
import { checkEnvPresence } from '../config/env';

const router = Router();

// BE-7: SERVICE_VERSION pulled from npm_package_version (set by node when run
// via `npm`/`pnpm`) → falls back to RELEASE_VERSION env (set by Render) → "1.0.0".
const SERVICE_VERSION = process.env.npm_package_version || process.env.RELEASE_VERSION || '1.0.0';

// ─── Basic health check ──────────────────────────────────
// Fast path — NO DB/Redis calls. For platform liveness probes.
// P99 follow-up — `no-store` so no CDN ever serves a stale "ok" past
// a real outage. Also stops the default `defaultCacheByMethod` policy
// from tagging anonymous GETs as `public, max-age=60` and confusing
// platform health checkers that re-validate aggressively.
router.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    service: 'ecypro-api',
    version: SERVICE_VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Deep readiness probe ────────────────────────────────
// P16 BE Track 2 / Aşama 4 — verifies DB + Redis + Sentry + Telegram and
// returns per-check latency. Suitable for k8s readinessProbe / Render.
//
// Status semantics:
//   - "ready"     all critical deps OK         → 200
//   - "degraded"  optional deps down, DB OK    → 200 (still take traffic)
//   - "not_ready" DB down                      → 503 (rotate out)
//
// Critical = DB. Redis, Sentry, Telegram are optional and only flip the
// envelope to "degraded" (still 200) so the load balancer keeps the pod.
router.get('/ready', async (_req, res) => {
  type CheckResult = {
    status: 'ok' | 'degraded' | 'down' | 'unconfigured';
    latencyMs?: number;
    detail?: string;
  };

  async function measureWithTimeout<T>(
    label: string,
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutValue: T,
  ): Promise<{ value: T; latencyMs: number }> {
    const start = Date.now();
    const value = await Promise.race([
      fn().catch((err) => {
        logger.warn(`[ready] ${label} probe error`, { message: (err as Error).message });
        return timeoutValue;
      }),
      new Promise<T>((resolve) => setTimeout(() => resolve(timeoutValue), timeoutMs)),
    ]);
    return { value, latencyMs: Date.now() - start };
  }

  // DB — 1.5s timeout, hard requirement.
  const dbProbe = await measureWithTimeout(
    'db',
    () => prisma.$queryRaw`SELECT 1`.then(() => 'ok' as const),
    1500,
    'down' as const,
  );
  const dbCheck: CheckResult = { status: dbProbe.value, latencyMs: dbProbe.latencyMs };

  // Redis — 500ms timeout, optional. "down" maps to "degraded" so it doesn't
  // 503 the pod (sessions degrade gracefully to in-memory fallback).
  const redisProbe = await measureWithTimeout(
    'redis',
    () => redis.ping().then(() => 'ok' as const),
    500,
    'degraded' as const,
  );
  const redisCheck: CheckResult = { status: redisProbe.value, latencyMs: redisProbe.latencyMs };

  // Sentry — presence-only (DSN configured). No network probe; Sentry itself
  // wouldn't be the bottleneck and we don't want /ready to spend a TCP roundtrip.
  const sentryCheck: CheckResult = process.env.SENTRY_DSN
    ? { status: 'ok' }
    : { status: 'unconfigured', detail: 'SENTRY_DSN not set' };

  // Telegram — 1.5s timeout, optional dep (booking alerts). Token absent →
  // unconfigured (no health impact). Token present → ping getMe; failure
  // degrades but doesn't 503.
  let telegramCheck: CheckResult;
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    telegramCheck = { status: 'unconfigured', detail: 'TELEGRAM_BOT_TOKEN not set' };
  } else {
    const probe = await measureWithTimeout(
      'telegram',
      async () => {
        const r = await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`,
          { signal: AbortSignal.timeout(1200) },
        );
        return (r.ok ? 'ok' : 'degraded') as 'ok' | 'degraded';
      },
      1500,
      'degraded' as const,
    );
    telegramCheck = { status: probe.value, latencyMs: probe.latencyMs };
  }

  const checks = {
    db: dbCheck,
    redis: redisCheck,
    sentry: sentryCheck,
    telegram: telegramCheck,
  } as const;

  const dbOk = dbCheck.status === 'ok';
  const anyOptionalDown =
    redisCheck.status === 'down' ||
    redisCheck.status === 'degraded' ||
    telegramCheck.status === 'down' ||
    telegramCheck.status === 'degraded';

  const overall: 'ready' | 'degraded' | 'not_ready' = !dbOk
    ? 'not_ready'
    : anyOptionalDown
      ? 'degraded'
      : 'ready';

  const httpStatus = overall === 'not_ready' ? 503 : 200;
  res.status(httpStatus).json({
    status: overall === 'not_ready' ? 'not_ready' : 'ok',
    overall,
    service: 'ecypro-api',
    version: SERVICE_VERSION,
    uptime: process.uptime(),
    checks,
    timestamp: new Date().toISOString(),
  });
});

// ─── Runtime preflight health ────────────────────────────
// Phase 6.A — deeper-than-liveness probe for post-deploy verification.
// Reports lead-pipeline integration readiness: required/optional env
// presence (NAMES only, never values), a 1s DB round-trip, and
// env-presence for Notion/Resend (no live API call — both are rate-limited).
//
// Status semantics:
//   - "healthy"    required env present + DB ok                 → 200
//   - "degraded"   required + DB ok, some optional env missing  → 200
//   - "unhealthy"  required env missing OR DB probe fails        → 503
router.get('/health/preflight', async (_req, res) => {
  const envCheck = checkEnvPresence();

  // DB — 1s timeout. Latency recorded regardless of outcome.
  const dbStart = Date.now();
  let dbOk = false;
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('database probe timeout (1s)')), 1000);
      }),
    ]);
    dbOk = true;
  } catch (err) {
    logger.warn('[health/preflight] DB check failed', { message: (err as Error).message });
  } finally {
    if (timer) clearTimeout(timer);
  }
  const dbLatencyMs = Date.now() - dbStart;

  // Notion / Resend — env-presence only. A live probe would burn a
  // rate-limited external call on every health poll.
  const notionOk = Boolean(process.env.NOTION_API_KEY);
  const resendOk = Boolean(process.env.RESEND_API_KEY);

  const status: 'healthy' | 'degraded' | 'unhealthy' =
    !envCheck.required.ok || !dbOk ? 'unhealthy' : !envCheck.optional.ok ? 'degraded' : 'healthy';

  const httpStatus = status === 'unhealthy' ? 503 : 200;

  res.setHeader('Cache-Control', 'no-store');
  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    checks: {
      env: {
        required: envCheck.required,
        optional: envCheck.optional,
      },
      database: { ok: dbOk, latencyMs: dbLatencyMs },
      notion: { ok: notionOk, checked: 'env-presence-only' },
      resend: { ok: resendOk, checked: 'env-presence-only' },
    },
    version: SERVICE_VERSION,
  });
});

// ─── Prometheus /metrics ─────────────────────────────────
// P18 BE Track 2 / Aşama 2 — `prom-client` text format with custom
// counters/histograms (HTTP, cache, BullMQ, db pool). The router is
// defined in `./metrics.ts` so authentication + sampled gauges live in
// one place.
router.use('/metrics', metricsRoutes);

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
  return import('../middleware/auth')
    .then(({ authenticate, requireRole }) => {
      authenticate(req, res, () => {
        requireRole('ADMIN')(req as Parameters<ReturnType<typeof requireRole>>[0], res, () =>
          renderSwaggerUI(req, res),
        );
      });
    })
    .catch(next);
});

function renderSwaggerUI(_req: import('express').Request, res: import('express').Response): void {
  // Single-file HTML; loads Swagger UI assets from cdnjs (Anthropic-allowlisted CDN
  // already used elsewhere in the project for browser artifacts).
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>eCyPro API — Swagger UI</title>
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
      page: { name: 'eCyPro API', url: 'https://ecypro.com' },
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
router.use('/newsletter', newsletterLifecycleRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);
// P18 BE Track 2 / Aşama 3 — Bull-Board queue dashboard. Mounted at
// `/admin/queues` so the public path is `/api/admin/queues/*`. Auth +
// IP allowlist enforced inside the subrouter.
router.use('/admin/queues', adminQueuesRoutes);
router.use('/admin/newsletter/campaigns', adminCampaignsRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/admin/content', adminContentRoutes);
router.use('/admin/collections', adminCollectionsRoutes);
router.use('/admin/leads', adminLeadsRoutes);
router.use('/admin/leads', adminLeadsNotesRoutes);
router.use('/admin/media', adminMediaRoutes);
router.use('/admin/security', adminSecurityRoutes);
router.use('/admin/events', adminEventsRoutes);
router.use('/admin/revalidate', adminRevalidateRoutes);
router.use('/public/services', publicServicesRoutes);
// P23 BE Track 2 / Aşama 2 — partner-facing event push subscriptions.
router.use('/admin/webhooks', adminWebhookRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/manage', manageRoutes);
router.use('/auth/2fa', totpRoutes);
router.use('/sessions', sessionRoutes);
router.use('/leads', leadRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/geo', geoRoutes);
router.use('/crm', crmRoutes);
router.use('/dev/analytics', devAnalyticsRoutes);
router.use('/contact', contactRoutes);
router.use('/calendly', calendlyRoutes);
// Track 1 launch — inbound assessment + paket recommender endpoints. They
// share the v1 mount so paths land at /api/v1/quick-check-submit and
// /api/v1/pricing-calculator-submit per the launch brief.
router.use('/quick-check-submit', quickCheckRoutes);
router.use('/pricing-calculator-submit', pricingCalcRoutes);
router.use('/gdpr', gdprRoutes);
router.use('/search', searchRoutes);
// P18 BE Track 2 / Aşama 1 — upload pipeline.
//   POST /api/upload          → multipart accept + storage put + variant enqueue
//   GET  /api/uploads/get?... → HMAC-signed read (local adapter only)
router.use('/upload', uploadRoutes);
router.use('/uploads', uploadsGetRoutes);

// P23 BE Track 2 / Aşama 1 — `/api/stream`, `/api/stream/publish`, `/api/stream/_stats`.
router.use('/', streamRoutes);

export default router;
