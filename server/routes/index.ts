import { Router } from 'express';
import authRoutes from './auth';
import bookingRoutes from './bookings';
import analyticsRoutes from './analytics';
import newsletterRoutes from './newsletter';
import { openApiSpec } from '../config/openapi';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { logger } from '../config/logger';

const router = Router();

// ─── Basic health check ──────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Deep readiness probe ────────────────────────────────
// Verifies DB + Redis actually respond. Suitable for k8s readinessProbe / Render.
router.get('/ready', async (_req, res) => {
  const checks: Record<string, 'ok' | 'degraded' | 'down'> = {
    db: 'down',
    redis: 'down',
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

// OpenAPI Documentation
router.get('/docs', (_req, res) => {
  res.json(openApiSpec);
});

// API Routes
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/newsletter', newsletterRoutes);

export default router;
