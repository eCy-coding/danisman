import './env'; // MUST be first — loads .env + .env.local before any module reads process.env
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import express from 'express';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error';
import { securityHeaders, structuredLogger, corsPreflight } from './middleware/security';
import { requestId } from './middleware/request-id';
import { httpMetricsMiddleware } from './observability/http-metrics-middleware';
import { corsProd } from './middleware/cors';
import { originGuard } from './middleware/originGuard';
import { generalLimiter, sseLimiter } from './middleware/rateLimiter';
import { tierRateLimiter } from './middleware/rate-limit-tier';
import { sentryErrorHandler } from './middleware/sentry';
import { authenticate } from './middleware/auth';
import { requestTimeout } from './middleware/timeout';
import { logger } from './config/logger';
import { shutdownDatabase } from './config/db';
import { validateEnv } from './lib/preflight';
import { sendTelegramAlert } from './lib/telegram-alert';

// Pre-flight: fail fast at boot if required ENV is unset, rather than losing
// leads silently at runtime (form chain breaks if NOTION_*/RESEND_API_KEY
// are missing). Runs after `import './env'` has loaded .env/.env.local.
validateEnv();

// BE-8: Sentry — environment + release tracking + tunable sampling.
//   - `release` reads from RELEASE_VERSION (set by Render/Railway build) or
//     npm_package_version when launched via npm scripts; this lets Sentry
//     tag every event with a deployable artifact ID so source-map upload
//     and "first seen in" queries work end-to-end.
//   - `environment` defaults to NODE_ENV so prod / staging / preview each
//     get their own Sentry environment filter.
//   - tracesSampleRate dropped to 0.1 (10%) to control quota at scale;
//     SENTRY_TRACES_SAMPLE_RATE env can override per environment.
if (process.env.SENTRY_DSN) {
  const release =
    process.env.SENTRY_RELEASE ||
    process.env.RELEASE_VERSION ||
    process.env.npm_package_version ||
    undefined;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1') || 0.1,
    profilesSampleRate: Number.parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.1') || 0.1,
    // P8 — server-side PII scrubbing. We never want raw request bodies,
    // Authorization/Cookie headers, or query strings reaching Sentry.
    beforeSend(event) {
      try {
        if (event.user) {
          if (event.user.email) event.user.email = '[redacted]';
          if (event.user.ip_address) event.user.ip_address = '[redacted]';
          if (event.user.username) event.user.username = '[redacted]';
        }
        if (event.request) {
          if (event.request.cookies) delete event.request.cookies;
          if (event.request.data) event.request.data = '[redacted]';
          if (event.request.headers) {
            const h = event.request.headers as Record<string, string>;
            if (h.Authorization) h.Authorization = '[redacted]';
            if (h.authorization) h.authorization = '[redacted]';
            if (h.Cookie) h.Cookie = '[redacted]';
            if (h.cookie) h.cookie = '[redacted]';
            if (h['x-api-key']) h['x-api-key'] = '[redacted]';
          }
          if (typeof event.request.url === 'string') {
            const idx = event.request.url.indexOf('?');
            if (idx >= 0) event.request.url = event.request.url.slice(0, idx) + '?[redacted]';
          }
          if (typeof event.request.query_string === 'string') {
            event.request.query_string = '[redacted]';
          }
        }
      } catch {
        /* never let scrubbing fail the event */
      }
      // Operational bridge: page the founder on fatal/error events. Fire-and-
      // forget — beforeSend is sync-only, so we never await. Env-gated +
      // cooldown live inside sendTelegramAlert; no-op when token/chat unset.
      if (event.level === 'fatal' || event.level === 'error') {
        void sendTelegramAlert(event.level, event.message ?? 'Sentry event', {
          event_id: event.event_id,
          transaction: event.transaction,
        });
      }
      return event;
    },
  });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Trust the first proxy hop (Render, Vercel, Nginx, Cloudflare).
// Required for req.ip to reflect the real client IP, which rate limiter + logger use.
// Configurable via TRUST_PROXY: "true" | "false" | integer hop count.
const trustProxyEnv = process.env.TRUST_PROXY ?? '1';
if (trustProxyEnv === 'true' || trustProxyEnv === 'false') {
  app.set('trust proxy', trustProxyEnv === 'true');
} else {
  const hops = Number.parseInt(trustProxyEnv, 10);
  app.set('trust proxy', Number.isFinite(hops) ? hops : 1);
}

// ─── Security & Middleware ───────────────────────────────
// P14-BE: request-id MUST be the very first middleware so every later
// log entry, Sentry breadcrumb, rate-limit denial, and error response
// can correlate against the same trace identifier.
app.use(requestId);
// P18 BE Track 2 / Aşama 2 — Prometheus emission BEFORE auth/rate-limit
// so even rejected requests show up in `http_requests_total{status="429"}`.
app.use(httpMetricsMiddleware);
app.use(securityHeaders);
app.use(structuredLogger);
app.use(corsPreflight);

// BE-4: Production-ready CORS — explicit origin allowlist + methods/headers
// whitelist + credentials + 24h preflight cache. See middleware/cors.ts.
app.use(corsProd());

// Phase 109a: Origin/Referer guard for state-changing methods.
// Webhooks + health probes carry no Origin → bypass via prefix list.
app.use(
  originGuard({
    ignore: ['/api/webhooks', '/api/health', '/api/sse', '/__health'],
  }),
);

// P15-BE Aşama 6: capture raw body for HMAC webhook verification.
// Without this hook every webhook handler that recomputes a signature
// would have to operate on JSON.stringify(req.body), which loses
// byte-perfect fidelity (key order, whitespace) and silently fails
// verification for valid requests. See server/middleware/verify-webhook.ts.
import { captureRawBody } from './middleware/verify-webhook';
app.use(express.json({ limit: '10mb', verify: captureRawBody }));
app.use(express.urlencoded({ extended: true }));

// P13/1 — Per-request hard timeout. Skips SSE + health.
app.use(
  requestTimeout({
    ms: Number.parseInt(process.env.REQUEST_TIMEOUT_MS ?? '30000', 10) || 30_000,
    uploadMs: Number.parseInt(process.env.UPLOAD_TIMEOUT_MS ?? '60000', 10) || 60_000,
  }),
);

// Rate limiting on all API endpoints
// 1) Per-IP cheap door-keeper (existing) — first line of defense.
app.use('/api', generalLimiter);
// 2) P16 BE Track 2 / Aşama 2 — Tier-based per-user limiter.
//    Classifies the caller (anonymous / auth / admin / api-key) and applies
//    a tier-specific budget. Mounted GLOBALLY after the IP limiter so
//    authenticated requests still benefit when individual routes don't add
//    per-route auth before this point — those will fall into the
//    `anonymous` tier (stricter, still safe). Routes that need a tighter
//    or looser per-tier budget can mount `tierRateLimit({ budgets })`
//    inline AFTER `authenticate`.
app.use('/api', tierRateLimiter);

// P23 BE Track 2 / Aşama 5 — CDN Cache-Control + Vary defaults.
// Method-aware policy:
//   POST/PUT/PATCH/DELETE → no-store
//   GET + auth (Bearer/cookie) → private, must-revalidate
//   GET anonymous → public, max-age=60, s-maxage=300
// Individual routes may overwrite via `setCache(res, …)` before the
// response body is sent — this middleware only sets defaults.
import { defaultCacheByMethod } from './middleware/cache-control';
app.use('/api', defaultCacheByMethod());

// P13/1 — Drain-aware health endpoint. Once SIGTERM lands we flip
// `isShuttingDown` and the probe returns 503 with Retry-After so the
// load-balancer stops sending traffic before we cut the listener.
let isShuttingDown = false;

// ─── Playwright webServer probe (mock-server compat) ─────
app.get('/__health', (_req, res) => res.json({ ok: true }));

// ─── Standard health probes (BetterStack / k8s / uptime monitors) ──
app.get('/healthz', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok', service: 'ecypro-api' });
});
app.get('/readyz', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (isShuttingDown) {
    res.setHeader('Retry-After', '15');
    res.status(503).json({ status: 'not_ready', reason: 'draining' });
    return;
  }
  res.json({ status: 'ready', service: 'ecypro-api' });
});

// ─── Health Check Endpoint ───────────────────────────────
app.get('/api/health', (_req, res) => {
  // P99 follow-up — no CDN/edge caching of liveness payloads.
  res.setHeader('Cache-Control', 'no-store');
  if (isShuttingDown) {
    res.setHeader('Retry-After', '15');
    res.status(503).json({
      status: 'shutting_down',
      service: 'ecypro-api',
      message: 'Server is draining connections',
    });
    return;
  }
  res.json({
    status: 'ok',
    service: 'ecypro-api',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  });
});

// ─── SSE: Real-Time Dashboard Stream ─────────────────────
const sseClients = new Set<express.Response>();

app.get('/api/sse/dashboard', sseLimiter, authenticate as express.RequestHandler, (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial heartbeat
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  sseClients.add(res);
  logger.info(`[SSE] Client connected. Total: ${sseClients.size}`);

  // Keep-alive ping every 30s
  const keepAlive = setInterval(() => {
    res.write(`: keepalive\n\n`);
  }, 30_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
    logger.info(`[SSE] Client disconnected. Total: ${sseClients.size}`);
  });
});

// Broadcast function for Director engine
export function broadcastSSE(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

// ─── API Routes ──────────────────────────────────────────
// P15-BE Aşama 4: URI-based versioning.
//
// New canonical prefix: `/api/v1/*` — every contracted v1 surface.
// Legacy alias: `/api/*` — same router, kept live until 2026-12-01 sunset
// per docs/API_VERSIONING.md. The alias attaches a `Deprecation` and
// `Sunset` header so SDK consumers see the migration window in logs.
//
// Frontend (VITE_API_URL) is intentionally NOT changed in this sprint
// because a parallel FE task is in flight — backwards-compatibility keeps
// the legacy callers green during the rollover.
const DEPRECATION_SUNSET_DATE = 'Tue, 01 Dec 2026 00:00:00 GMT';
app.use('/api/v1', apiRoutes);
app.use(
  '/api',
  (req, res, next) => {
    // Don't tag /api/v1/* — it would double-fire under express subrouting,
    // and that path is the canonical one anyway.
    if (req.path.startsWith('/v1/') || req.path === '/v1') {
      return next();
    }
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', DEPRECATION_SUNSET_DATE);
    res.setHeader(
      'Link',
      '</api/v1>; rel="successor-version", </docs/API_VERSIONING.md>; rel="deprecation"',
    );
    return next();
  },
  apiRoutes,
);

// ─── 404 Handler ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
  });
});

// ─── Global Error Handler ────────────────────────────────
app.use(sentryErrorHandler());
app.use(errorHandler);

// ─── Graceful Shutdown ───────────────────────────────────

// P37-T04: Start booking reminder cron job (non-blocking)
import { startReminderJob } from './jobs/booking-reminders';
import { notifyServerStart, notifyCriticalError } from './lib/telegram';
import { startLeadPipeline, stopLeadPipeline } from './services/lead-pipeline';
// Integration Outbox / WAL — retries FAILED/PENDING third-party side effects
// (Notion, Resend) so a partial failure can't silently lose a lead.
import { startOutboxProcessor, stopOutboxProcessor } from './jobs/process-outbox';
import { startFlushViewCountJob } from './jobs/flushViewCountJob';
// P17 BE Track 2 / Aşama 1 — BullMQ queue workers.
//   In single-process dev the API container also hosts the workers; in
//   prod the worker dyno bootstraps via `server/workers/standalone.ts` and
//   we can set DISABLE_INLINE_WORKERS=1 to keep the API process pure HTTP.
import { startAllWorkers, stopAllWorkers } from './workers';
import { closeQueues } from './queues';
// P23 BE Track 2 / Aşama 1 — topic-based SSE pub/sub + BullMQ bridge.
import { getSseManager } from './lib/realtime/sse-manager';
import { attachJobBridge } from './lib/realtime/publish';
if (process.env.NODE_ENV !== 'test') {
  startReminderJob();
  startLeadPipeline();
  startOutboxProcessor();
  startFlushViewCountJob();
  if (process.env.DISABLE_INLINE_WORKERS !== '1') {
    startAllWorkers();
  }
  // Wire job-completion notifications onto the SSE manager. Safe to call
  // even when BullMQ is unavailable (no-op + log).
  attachJobBridge();
}

const server = app.listen(PORT, () => {
  logger.info(`🚀 eCyPro API Server running on http://localhost:${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`🔐 Auth: POST /api/auth/login, POST /api/auth/register`);
  logger.info(`📅 Bookings: /api/bookings`);
  logger.info(`📈 Analytics: /api/analytics`);
  logger.info(`📡 SSE: GET /api/sse/dashboard`);
  logger.info(`📖 API Docs: http://localhost:${PORT}/api/docs`);
  logger.info(`🔒 Rate limiting: Active (Redis backed)`);
  logger.info(`🛡️ Security headers: Active`);
  logger.info(`🐛 Sentry error handler: Active`);
  notifyServerStart(PORT).catch(() => {});
});

// P13/1 — Drain timeline:
//   t+0    SIGTERM/SIGINT received
//          → flip readiness probe to 503 (load balancer stops sending)
//   t+0    stop background jobs (lead pipeline, cron)
//   t+0    close SSE clients (long-lived)
//   t+0    server.close() — finish in-flight HTTP, refuse new sockets
//   t+30s  hard ceiling — Render aborts container at ~30s on rolling deploys.
//   between: prisma.$disconnect + pgPool.end + Sentry.flush (in parallel)
const SHUTDOWN_TIMEOUT_MS =
  Number.parseInt(process.env.SHUTDOWN_TIMEOUT_MS ?? '30000', 10) || 30_000;

let shuttingDownPromise: Promise<void> | null = null;

const shutdown = (signal: string): Promise<void> => {
  if (shuttingDownPromise) return shuttingDownPromise;

  shuttingDownPromise = (async () => {
    logger.info(`[${signal}] Graceful shutdown initiated (ceiling ${SHUTDOWN_TIMEOUT_MS}ms)…`);
    isShuttingDown = true;

    // 1) Stop background services so we don't enqueue more work mid-drain.
    try {
      stopLeadPipeline();
    } catch (err) {
      logger.warn(`[shutdown] stopLeadPipeline failed: ${(err as Error).message}`);
    }
    try {
      stopOutboxProcessor();
    } catch (err) {
      logger.warn(`[shutdown] stopOutboxProcessor failed: ${(err as Error).message}`);
    }

    // P17 BE Track 2 / Aşama 1 — drain BullMQ workers + producer registry.
    // Stop accepting new jobs first (workers close), then close the queues
    // so any in-flight enqueue completes before connection teardown.
    try {
      await stopAllWorkers();
    } catch (err) {
      logger.warn(`[shutdown] stopAllWorkers failed: ${(err as Error).message}`);
    }
    try {
      await closeQueues();
    } catch (err) {
      logger.warn(`[shutdown] closeQueues failed: ${(err as Error).message}`);
    }

    // 2) Close SSE clients — keep-alive streams will never satisfy server.close.
    for (const client of sseClients) {
      try {
        client.end();
      } catch {
        /* socket may already be gone */
      }
    }
    sseClients.clear();

    // P23 BE Track 2 / Aşama 1 — drain the topic-based SSE manager. Sends a
    // `server_shutdown` event so the browser EventSource reconnects against
    // the new instance instead of retrying the old (closing) one in tight
    // loop.
    try {
      getSseManager().drain('shutdown');
    } catch (err) {
      logger.warn(`[shutdown] sse drain failed: ${(err as Error).message}`);
    }

    // 3) Stop accepting new connections + wait for in-flight to drain.
    const httpClosed = new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) logger.warn(`[shutdown] server.close emitted: ${err.message}`);
        else logger.info('[shutdown] HTTP server closed.');
        resolve();
      });
    });

    const hardCeiling = new Promise<void>((resolve) =>
      setTimeout(() => {
        logger.warn(`[shutdown] HTTP drain hit ${SHUTDOWN_TIMEOUT_MS}ms ceiling — forcing close`);
        resolve();
      }, SHUTDOWN_TIMEOUT_MS).unref?.(),
    );

    await Promise.race([httpClosed, hardCeiling]);

    // 4) Drain databases + flush observability in parallel — bounded.
    await Promise.allSettled([
      shutdownDatabase(8_000),
      Sentry.flush(4_000).then(
        () => logger.info('[shutdown] Sentry flushed.'),
        (err) => logger.warn(`[shutdown] Sentry flush failed: ${(err as Error).message}`),
      ),
    ]);

    logger.info('✅ Shutdown complete — exiting 0.');
    process.exit(0);
  })();

  return shuttingDownPromise;
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('[FATAL] Uncaught Exception:', { message: err.message, stack: err.stack });
  notifyCriticalError(err, 'uncaughtException').finally(() => shutdown('UNCAUGHT_EXCEPTION'));
});

process.on('unhandledRejection', (reason) => {
  logger.error('[FATAL] Unhandled Rejection:', { reason });
  shutdown('UNHANDLED_REJECTION');
});
