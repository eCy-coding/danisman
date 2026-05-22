#!/usr/bin/env tsx
/**
 * H3 — Rate-limit chaos test (Track 2 pre-launch sprint).
 *
 * Validates that the production rate-limit middleware actually sheds load by
 * returning 429 once a per-IP/per-tier budget is exhausted, and that the
 * RFC-6585 headers (X-RateLimit-*, Retry-After) are emitted correctly.
 *
 * Two modes:
 *   - In-process (default): boots an ephemeral Express server mounting the
 *     REAL `generalLimiter` + `tierRateLimiter` (and the strict
 *     `quickCheckLimiter`) and hammers it over loopback. No DB/Redis needed —
 *     the limiters fall back to their in-memory store when Redis isn't ready.
 *   - Live: set CHAOS_TARGET=https://api.example.com to hammer a real
 *     deployment instead (uses /api/__chaos_probe so no side-effects).
 *
 * Budgets under test (from server/middleware):
 *   - global tier (anonymous):  60 req / 15 min   → caps first
 *   - general per-IP:          100 req / 15 min
 *   - quickCheckLimiter:         3 req / 60 min   (strict anti-abuse)
 *
 * Report: ~/Documents/eCyPro-memory/chaos-reports/rate-limit-<date>.json
 * Exit 1 if the limiter fails to throttle (no 429 seen) — CI-gateable.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

process.env.NODE_ENV ??= 'test';

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  firstThrottleAt: number | null;
  sawRateLimitHeaders: boolean;
  sawRetryAfterOn429: boolean;
}

async function hammer(url: string, count: number, concurrency: number): Promise<Stats> {
  const stats: Stats = {
    total: 0,
    byStatus: {},
    firstThrottleAt: null,
    sawRateLimitHeaders: false,
    sawRetryAfterOn429: false,
  };
  let sent = 0;
  // Sequential index assignment so firstThrottleAt is meaningful; concurrency
  // controls in-flight parallelism.
  async function worker() {
    while (sent < count) {
      const idx = ++sent;
      try {
        const res = await fetch(url, { method: 'GET' });
        stats.total++;
        const code = String(res.status);
        stats.byStatus[code] = (stats.byStatus[code] ?? 0) + 1;
        if (res.headers.get('x-ratelimit-limit')) stats.sawRateLimitHeaders = true;
        if (res.status === 429) {
          if (stats.firstThrottleAt === null || idx < stats.firstThrottleAt) {
            stats.firstThrottleAt = idx;
          }
          if (res.headers.get('retry-after')) stats.sawRetryAfterOn429 = true;
        }
      } catch {
        stats.total++;
        stats.byStatus.error = (stats.byStatus.error ?? 0) + 1;
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return stats;
}

async function bootEphemeral(): Promise<{ base: string; close: () => void }> {
  const express = (await import('express')).default;
  const { generalLimiter, quickCheckLimiter, __resetFallbackStoreForTests } =
    await import('../../server/middleware/rateLimiter');
  const { tierRateLimiter, _tierTesting } = await import('../../server/middleware/rate-limit-tier');

  __resetFallbackStoreForTests();
  _tierTesting.reset();

  const app = express();
  // Mirror server/index.ts ordering: per-IP general, then per-tier.
  app.use('/api', generalLimiter);
  app.use('/api', tierRateLimiter);
  app.get('/api/__chaos_probe', (_req, res) => res.json({ ok: true }));
  // Strict per-route limiter on its own bucket.
  app.get('/api/__chaos_quickcheck', quickCheckLimiter, (_req, res) => res.json({ ok: true }));

  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ base: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}

async function main() {
  const liveTarget = process.env.CHAOS_TARGET;
  let base: string;
  let close = () => {};

  if (liveTarget) {
    base = liveTarget.replace(/\/$/, '');
    console.error(`[chaos] live mode → ${base}`);
  } else {
    const eph = await bootEphemeral();
    base = eph.base;
    close = eph.close;
    console.error(`[chaos] in-process mode → ${base}`);
  }

  // Scenario 1: global limiter stack — fire past the 60/anon-tier cap.
  const globalRun = await hammer(`${base}/api/__chaos_probe`, 90, 20);

  // Scenario 2: strict per-route quickCheckLimiter (3/hr) — only meaningful
  // in-process (live probe path differs).
  const strictRun = liveTarget ? null : await hammer(`${base}/api/__chaos_quickcheck`, 8, 1);

  close();

  const report = {
    generatedAt: new Date().toISOString(),
    mode: liveTarget ? 'live' : 'in-process',
    target: base,
    scenarios: {
      globalTierStack: {
        budgetExpected: { anonymousTier: 60, generalPerIp: 100 },
        ...globalRun,
      },
      ...(strictRun ? { quickCheckStrict: { budgetExpected: { perHour: 3 }, ...strictRun } } : {}),
    },
  };

  const dir = join(homedir(), 'Documents', 'eCyPro-memory', 'chaos-reports');
  mkdirSync(dir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const out = join(dir, `rate-limit-${date}.json`);
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.error(`[chaos] report → ${out}`);

  // Pass criteria: the global stack MUST throttle (429 seen) and emit headers.
  const g = report.scenarios.globalTierStack;
  const ok = (g.byStatus['429'] ?? 0) > 0 && g.sawRateLimitHeaders && g.sawRetryAfterOn429;
  if (!ok) {
    console.error('[chaos] FAIL — limiter did not throttle as expected');
    process.exit(1);
  }
  // In-process we can also assert the strict bucket throttled at the 4th hit.
  if (strictRun) {
    const s = report.scenarios.quickCheckStrict!;
    if ((s.byStatus['429'] ?? 0) === 0 || (s.firstThrottleAt ?? 99) > 4) {
      console.error('[chaos] FAIL — quickCheckLimiter did not throttle at budget');
      process.exit(1);
    }
  }
  console.error('[chaos] PASS');
}

main().catch((err) => {
  console.error('[chaos] fatal:', err);
  process.exit(2);
});
