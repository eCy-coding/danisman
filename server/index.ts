import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import express from 'express';
import corsMiddleware from 'cors';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error';
import { securityHeaders, structuredLogger, corsPreflight } from './middleware/security';
import { generalLimiter, sseLimiter } from './middleware/rateLimiter';
import { sentryErrorHandler } from './middleware/sentry';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
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
app.use(securityHeaders);
app.use(structuredLogger);
app.use(corsPreflight);

app.use(corsMiddleware({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on all API endpoints
app.use('/api', generalLimiter);

// ─── Health Check Endpoint ───────────────────────────────
app.get('/api/health', (_req, res) => {
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

app.get('/api/sse/dashboard', sseLimiter, (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
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
app.use('/api', apiRoutes);

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
import { logger } from './config/logger';

const server = app.listen(PORT, () => {
  logger.info(`🚀 EcyPro API Server running on http://localhost:${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`🔐 Auth: POST /api/auth/login, POST /api/auth/register`);
  logger.info(`📅 Bookings: /api/bookings`);
  logger.info(`📈 Analytics: /api/analytics`);
  logger.info(`📡 SSE: GET /api/sse/dashboard`);
  logger.info(`📖 API Docs: http://localhost:${PORT}/api/docs`);
  logger.info(`🔒 Rate limiting: Active (Redis backed)`);
  logger.info(`🛡️ Security headers: Active`);
  logger.info(`🐛 Sentry error handler: Active`);
});

// Graceful shutdown handler
const shutdown = (signal: string) => {
  logger.info(`[${signal}] Graceful shutdown initiated...`);

  // Close all SSE connections
  for (const client of sseClients) {
    client.end();
  }
  sseClients.clear();

  server.close(() => {
    logger.info('✅ Server closed cleanly.');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('⚠️ Force shutdown after timeout.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('[FATAL] Uncaught Exception:', { message: err.message, stack: err.stack });
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  logger.error('[FATAL] Unhandled Rejection:', { reason });
  shutdown('UNHANDLED_REJECTION');
});
