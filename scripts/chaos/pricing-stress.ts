#!/usr/bin/env tsx
/**
 * H5 — Pricing-calculator latency stress (Track 2 pre-launch sprint).
 *
 * /api/pricing-calc is compute-bound: zod parse → recommendPaket heuristic →
 * HTML build, with Notion/Resend dispatched fire-and-forget. The per-route
 * limiter (contactLimiter, 3/hr) makes a real throughput load test pointless,
 * so this measures *handler latency* over the full Express + zod path instead.
 *
 * It boots an ephemeral server mounting the REAL pricing router, resets the
 * limiter store before each request so the budget never trips, and leaves
 * RESEND/NOTION env unset so the side-effects no-op (no external IO). Reports
 * P50/P95/P99 and exits 1 if P95 ≥ 500ms.
 */
// Point the limiter's Redis at a dead port BEFORE the config module loads, so
// every increment falls back to the in-memory store this script resets per
// request. We're measuring handler compute latency, not the limiter (which is
// validated separately in rate-limit-test.ts). Override with a real REDIS_URL
// only if you specifically want to include Redis round-trip cost.
process.env.REDIS_URL ??= 'redis://127.0.0.1:6390';

import express from 'express';

const ITERATIONS = Number(process.env.STRESS_N ?? 1000);

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function main() {
  // Ensure side-effects no-op (no RESEND/NOTION creds in this process).
  delete process.env.RESEND_API_KEY;
  process.env.NODE_ENV ??= 'test';

  const pricingRouter = (await import('../../server/routes/pricing-calc')).default;
  const { __resetFallbackStoreForTests } = await import('../../server/middleware/rateLimiter');

  const app = express();
  app.use(express.json());
  // Reset the limiter bucket before each request so contactLimiter (3/hr)
  // doesn't 429 the benchmark — we're measuring compute, not the limiter.
  app.use((_req, _res, next) => {
    __resetFallbackStoreForTests();
    next();
  });
  app.use('/api/pricing-calc', pricingRouter);

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const url = `http://127.0.0.1:${port}/api/pricing-calc`;

  const payload = JSON.stringify({
    name: 'Stress Tester',
    email: 'stress@example.com',
    company: 'Load Co',
    sector: 'Teknoloji',
    answers: { teamSize: '51-200', maturity: 'scaling', horizon: 'year', budgetBand: '25k-100k' },
    kvkkConsent: true,
  });

  const latencies: number[] = [];
  let ok = 0;
  let bad = 0;
  // Warm-up.
  for (let i = 0; i < 20; i++) {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
    });
  }
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
    });
    const dt = performance.now() - t0;
    latencies.push(dt);
    if (res.status === 200) ok++;
    else bad++;
  }
  server.close();

  latencies.sort((a, b) => a - b);
  const report = {
    generatedAt: new Date().toISOString(),
    iterations: ITERATIONS,
    ok,
    bad,
    latencyMs: {
      min: +latencies[0].toFixed(3),
      p50: +percentile(latencies, 50).toFixed(3),
      p95: +percentile(latencies, 95).toFixed(3),
      p99: +percentile(latencies, 99).toFixed(3),
      max: +latencies[latencies.length - 1].toFixed(3),
    },
  };
  console.log(JSON.stringify(report, null, 2));

  if (bad > 0) {
    console.error(`[pricing-stress] FAIL — ${bad} non-200 responses`);
    process.exit(1);
  }
  if (report.latencyMs.p95 >= 500) {
    console.error(`[pricing-stress] FAIL — P95 ${report.latencyMs.p95}ms ≥ 500ms`);
    process.exit(1);
  }
  console.error('[pricing-stress] PASS — P95 under 500ms');
}

main().catch((err) => {
  console.error('[pricing-stress] fatal:', err);
  process.exit(2);
});
