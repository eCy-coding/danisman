#!/usr/bin/env node
/**
 * P20 BE — Capacity load test (autocannon-style, dynamic require).
 *
 * KULLANIM:
 *   node scripts/load-test.mjs              # localhost:3001 against /api/health
 *   BASE_URL=https://api.ecypro.com node scripts/load-test.mjs
 *   PATH_=/api/services CONCURRENCY=50 DURATION=30 node scripts/load-test.mjs
 *
 * SANDBOX UYARISI:
 *   - Bu script gerçek bir HTTP load test koşar; sandbox ortamında network
 *     yoksa veya target ayakta değilse autocannon ECONNREFUSED ile çıkar.
 *   - `autocannon` paketi `optionalDependencies`'te değil; eksikse script
 *     graceful "skipped" çıkar (CI'da non-fatal).
 *
 * KABUL KRİTERLERİ (P20):
 *   - P95 latency  ≤ 500 ms
 *   - Error rate   < 1 %
 *   - Throughput   ≥ 30 req/sec (Render Starter), ≥ 100 req/sec (Standard)
 *
 * Tier kapasite:
 *   Render Starter (0.5 vCPU, 512 MB)  →  ~20-30 concurrent, ~30 req/sec
 *   Render Standard (1 vCPU, 2 GB)     →  ~100-150 concurrent, ~100 req/sec
 *   Render Pro (2 vCPU, 4 GB)          →  ~250-400 concurrent, ~250 req/sec
 *
 * Bkz. outputs/P20_BE_CAPACITY.md
 */

import process from 'node:process';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';
const PATH = process.env.PATH_ ?? '/api/health';
const CONCURRENCY = Number.parseInt(process.env.CONCURRENCY ?? '100', 10) || 100;
const DURATION = Number.parseInt(process.env.DURATION ?? '60', 10) || 60;
const TIMEOUT = Number.parseInt(process.env.TIMEOUT ?? '10', 10) || 10;

const TARGET = `${BASE_URL.replace(/\/$/, '')}${PATH}`;
const THRESHOLDS = {
  p95LatencyMs: 500,
  errorRatePct: 1,
  minThroughput: 30,
};

let autocannon;
try {
  ({ default: autocannon } = await import('autocannon'));
} catch {
  console.log('[load-test] autocannon paketi yüklü değil → SKIPPED (npm i -D autocannon)');
  process.exit(0);
}

console.log(`[load-test] target=${TARGET}`);
console.log(`[load-test] concurrency=${CONCURRENCY}, duration=${DURATION}s, timeout=${TIMEOUT}s`);
console.log(`[load-test] thresholds: p95≤${THRESHOLDS.p95LatencyMs}ms, err<${THRESHOLDS.errorRatePct}%, tps≥${THRESHOLDS.minThroughput}`);

const result = await new Promise((resolve, reject) => {
  const instance = autocannon(
    {
      url: TARGET,
      connections: CONCURRENCY,
      duration: DURATION,
      timeout: TIMEOUT,
      headers: {
        accept: 'application/json',
        'user-agent': 'ecypro-load-test/1.0',
      },
    },
    (err, res) => (err ? reject(err) : resolve(res)),
  );
  autocannon.track(instance, { renderProgressBar: true });
});

const totalRequests = result.requests?.total ?? 0;
const errors = (result.errors ?? 0) + (result.timeouts ?? 0) + (result.non2xx ?? 0);
const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
const tps = result.requests?.average ?? 0;
const p95 = result.latency?.p97_5 ?? result.latency?.p99 ?? 0;
const p99 = result.latency?.p99 ?? 0;

console.log('\n[load-test] ─── Results ─────────────────────────────────');
console.log(`  Total requests : ${totalRequests}`);
console.log(`  Errors         : ${errors} (${errorRate.toFixed(2)}%)`);
console.log(`  Throughput     : ${tps.toFixed(1)} req/sec (avg)`);
console.log(`  Latency P95    : ${p95} ms`);
console.log(`  Latency P99    : ${p99} ms`);

const fails = [];
if (p95 > THRESHOLDS.p95LatencyMs) fails.push(`P95 ${p95} ms > ${THRESHOLDS.p95LatencyMs} ms`);
if (errorRate > THRESHOLDS.errorRatePct)
  fails.push(`error rate ${errorRate.toFixed(2)}% > ${THRESHOLDS.errorRatePct}%`);
if (tps < THRESHOLDS.minThroughput)
  fails.push(`throughput ${tps.toFixed(1)} req/sec < ${THRESHOLDS.minThroughput}`);

if (fails.length > 0) {
  console.error('\n[load-test] ❌ FAIL:');
  for (const f of fails) console.error(`  • ${f}`);
  process.exit(1);
}

console.log('\n[load-test] ✅ PASS — all capacity thresholds met.');
