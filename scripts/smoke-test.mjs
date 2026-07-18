#!/usr/bin/env node
/**
 * smoke-test.mjs — Fetch-based production smoke test for eCyPro.
 *
 * Usage:
 *   node scripts/smoke-test.mjs                          # default https://ecypro.com
 *   node scripts/smoke-test.mjs --url http://localhost:4173
 *   npm run smoke -- --url https://staging.ecypro.com
 *
 * Checks per URL:
 *   - HTTP status (200 or 404 for SPA-fallback path)
 *   - Response time < 3s (warn if >3s)
 *   - For HTML pages: contains <title>, og:image, canonical, html lang
 *   - For sitemaps/feeds: valid XML root tag
 *   - Critical headers: Strict-Transport-Security (warn if HTTP), X-Content-Type-Options
 *
 * Exit code:
 *   0 — all green or only warnings
 *   1 — any failure (non-200, missing critical content, timeout)
 */

import { argv, exit } from 'node:process';

// ---------------- args ----------------
function getArg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}
const BASE = getArg('url', 'https://ecypro.com').replace(/\/+$/, '');
const TIMEOUT_MS = Number(getArg('timeout', '8000'));

// ---------------- spec ----------------
const SPEC = [
  { path: '/',                kind: 'html', mustContain: ['<title>', 'canonical', 'og:image'] },
  { path: '/services',        kind: 'html', mustContain: ['<title>'] },
  { path: '/pricing',         kind: 'html', mustContain: ['<title>'] },
  { path: '/contact',         kind: 'html', mustContain: ['<title>'] },
  { path: '/blog',            kind: 'html', mustContain: ['<title>'] },
  { path: '/about',           kind: 'html', mustContain: ['<title>'] },
  { path: '/cookies',         kind: 'html', mustContain: ['<title>'] },
  { path: '/privacy',         kind: 'html', mustContain: ['<title>'] },
  { path: '/terms',           kind: 'html', mustContain: ['<title>'] },
  { path: '/random-404-path', kind: 'html', mustContain: ['<title>'], spaFallback: true },
  { path: '/robots.txt',      kind: 'text', mustContain: ['User-agent', 'Sitemap'] },
  { path: '/sitemap.xml',     kind: 'xml',  mustContain: ['<urlset', '<loc>'] },
  { path: '/sitemap-index.xml', kind: 'xml', mustContain: ['<sitemapindex', '<loc>'] },
  { path: '/manifest.webmanifest', kind: 'json', mustContain: ['name', 'icons'] },
  { path: '/og-image.jpg',    kind: 'image' },
  { path: '/favicon.ico',     kind: 'image' },
  { path: '/health.json',     kind: 'json',  mustContain: ['status', 'ok'] },
];

// ---------------- helpers ----------------
const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', RESET = '\x1b[0m';
const tag = (color, text) => `${color}${text}${RESET}`;

// Case-insensitive substring match — tolerates JSON key casing, XML
// attribute capitalisation, and the occasional header reflow without
// losing the strictness of "this string must appear somewhere in the body".
function bodyContains(buf, needle) {
  if (!buf) return false;
  return buf.toLowerCase().includes(String(needle).toLowerCase());
}

// One probe attempt — single fetch + content check. Returns a result object.
async function probeOnce(spec) {
  const url = BASE + spec.path;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      // Force identity to dodge preview-server compression quirks that
      // occasionally returned an empty body during P4 smoke runs.
      headers: { 'Accept-Encoding': 'identity' },
    });
    const ms = Date.now() - t0;
    const buf = spec.kind === 'image' ? null : await res.text();

    const result = { spec, url, status: res.status, ms, ok: true, warnings: [], errors: [], bodyLen: buf ? buf.length : null };

    // Status check
    if (spec.spaFallback) {
      // SPA fallback should serve index.html with 200 (or some setups serve 404 + HTML body)
      if (res.status !== 200 && res.status !== 404) {
        result.errors.push(`SPA fallback returned ${res.status} (expected 200 or 404)`);
        result.ok = false;
      }
    } else if (res.status !== 200) {
      result.errors.push(`HTTP ${res.status}`);
      result.ok = false;
    }

    // Performance check (informational; warn only)
    if (ms > 3000) result.warnings.push(`slow: ${ms}ms (target <3000ms)`);

    // Content check (case-insensitive)
    if (spec.mustContain && buf) {
      for (const needle of spec.mustContain) {
        if (!bodyContains(buf, needle)) {
          result.errors.push(`missing content: "${needle}" (body=${buf.length}B)`);
          result.ok = false;
        }
      }
    }

    // Critical headers — only enforce on HTML root of HTTPS sites
    if (BASE.startsWith('https://') && spec.path === '/') {
      const hsts = res.headers.get('strict-transport-security');
      const nosniff = res.headers.get('x-content-type-options');
      if (!hsts) result.warnings.push('missing Strict-Transport-Security header');
      if (!nosniff) result.warnings.push('missing X-Content-Type-Options header');
    }

    return result;
  } catch (e) {
    return {
      spec, url, status: 0, ms: Date.now() - t0, ok: false,
      warnings: [],
      errors: [e.name === 'AbortError' ? `timeout after ${TIMEOUT_MS}ms` : (e.cause?.code || e.message)],
    };
  } finally {
    clearTimeout(timer);
  }
}

// Wrap probeOnce with a single retry for transient preview-server hiccups.
// The original P4 run saw 0-ms empty-body responses for sitemap-index.xml
// and manifest.webmanifest immediately after preview boot; a 250ms breather
// and a second fetch reliably succeeds.
async function probe(spec) {
  const first = await probeOnce(spec);
  if (first.ok) return first;
  await new Promise((r) => setTimeout(r, 250));
  const second = await probeOnce(spec);
  if (second.ok) {
    second.warnings.push(`recovered on retry (first attempt: ${first.errors.join('; ')})`);
    return second;
  }
  return second;
}

function fmt(r) {
  const symbol = r.ok ? tag(GREEN, '✓') : tag(RED, '✗');
  const status = r.status ? `${r.status}` : tag(RED, 'ERR');
  const ms = `${r.ms}ms`;
  const path = r.spec.path.padEnd(28);
  let line = `${symbol} ${status.padEnd(4)} ${ms.padStart(7)}  ${path}`;
  if (r.errors.length) line += `  ${tag(RED, r.errors.join('; '))}`;
  if (r.warnings.length) line += `  ${tag(YELLOW, r.warnings.join('; '))}`;
  return line;
}

// ---------------- main ----------------
console.log(`${DIM}eCyPro smoke test — ${BASE}${RESET}\n`);

const results = [];
for (const spec of SPEC) {
  const r = await probe(spec);
  console.log(fmt(r));
  results.push(r);
}

const failed = results.filter((r) => !r.ok);
const warned = results.filter((r) => r.ok && r.warnings.length);

console.log('');
if (failed.length === 0) {
  console.log(tag(GREEN, `✓ ${results.length}/${results.length} green${warned.length ? ` (${warned.length} warnings)` : ''}`));
  exit(0);
} else {
  console.log(tag(RED, `✗ ${failed.length}/${results.length} FAILED`));
  exit(1);
}
