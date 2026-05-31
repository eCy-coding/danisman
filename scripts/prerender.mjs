#!/usr/bin/env node
/**
 * scripts/prerender.mjs — Build-time per-route static HTML prerender.
 *
 * Why: Vite SPA serves index.html for all routes. Per-page <title>, <meta og:*>,
 * JSON-LD schemas are injected by react-helmet-async AFTER React hydrates. Social
 * crawlers (LinkedIn, Twitter, Facebook, Slack) do NOT execute JS — they only
 * read static HTML. Result: every route shares the same homepage OG tags. Major
 * SEO + share-card bug.
 *
 * Fix: post-build, launch a headless Chromium, navigate to each route on a
 * temporary preview server, wait for hydration, capture full document HTML,
 * write to dist/<route>/index.html. Vercel SPA routing then serves the
 * prerendered HTML per route → crawlers see correct per-page meta.
 *
 * Cost: ~30-60 s build-time overhead (depends on route count).
 * Trade-off: hydrated HTML is larger (~+50 KB per route). Acceptable.
 *
 * Chromium strategy:
 *   VERCEL=1 → @sparticuz/chromium (pre-built, Lambda-compatible binary)
 *   local    → playwright bundled chromium (full Playwright install)
 *
 * Usage:
 *   npm run build                       # default vite build (no prerender)
 *   PRERENDER=1 npm run build           # vite build + prerender
 *   PRERENDER=1 PRERENDER_ROUTES=/,/services npm run build  # subset
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
const port = Number(process.env.PRERENDER_PORT ?? 4179);
const baseUrl = `http://127.0.0.1:${port}`;

// Vercel sets VERCEL=1 in its build environment.
const ON_VERCEL = process.env.VERCEL === '1';

function getRoutes() {
  // Override via env (comma-separated).
  const fromEnv = process.env.PRERENDER_ROUTES?.split(',').map((s) => s.trim()).filter(Boolean);
  if (fromEnv?.length) return fromEnv;

  // Read sitemap.xml — same source as crawlers will follow.
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.warn('[prerender] sitemap.xml not found, defaulting to homepage only');
    return ['/'];
  }
  const xml = fs.readFileSync(sitemapPath, 'utf-8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return locs
    .map((loc) => {
      try {
        return new URL(loc).pathname;
      } catch {
        return null;
      }
    })
    .filter((p) => p && !p.startsWith('/admin') && !p.startsWith('/app') && !p.startsWith('/api'))
    .filter((p, i, arr) => arr.indexOf(p) === i);
}

function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'npx',
      ['vite', 'preview', '--port', String(port), '--host', '127.0.0.1', '--strictPort'],
      { cwd: path.resolve(__dirname, '..'), stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let started = false;
    const onData = (data) => {
      const s = data.toString();
      if (!started && s.includes(String(port))) {
        started = true;
        resolve(proc);
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('error', reject);
    setTimeout(() => {
      if (!started) reject(new Error('preview server start timeout'));
    }, 30_000);
  });
}

async function launchBrowser() {
  if (ON_VERCEL) {
    // @sparticuz/chromium provides a Lambda/Vercel-compatible pre-built binary.
    const { chromium } = await import('playwright-core');
    const sparticuz = (await import('@sparticuz/chromium')).default;
    return chromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    });
  }
  // Local: use full Playwright (bundled chromium, no extra deps).
  const { chromium } = await import('playwright');
  return chromium.launch();
}

async function prerenderRoute(browser, route) {
  let ctx;
  try {
    // newContext/newPage inside the try: a dead-browser error becomes a failure
    // result (handled + retried by main) instead of throwing out → FATAL.
    ctx = await browser.newContext({ ignoreHTTPSErrors: true, userAgent: 'eCyPro-Prerender/1.0' });
    const page = await ctx.newPage();
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    // Give Helmet a tick to flush head changes
    await wait(200);
    const html = '<!DOCTYPE html>\n' + (await page.content());

    // Write to dist/<route>/index.html
    const target =
      route === '/' ? path.join(distDir, 'index.html') : path.join(distDir, route.replace(/^\//, ''), 'index.html');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html, 'utf-8');
    const title = (await page.title()) || '(empty)';
    return { route, ok: true, size: html.length, title: title.slice(0, 60) };
  } catch (err) {
    return { route, ok: false, error: err?.message ?? String(err) };
  } finally {
    if (ctx) { try { await ctx.close(); } catch { /* ctx already gone */ } }
  }
}

async function main() {
  // Opt-out instead of opt-in for production. Skip only when explicitly disabled
  // (local dev, fast iteration).
  if (process.env.PRERENDER === '0' || process.env.SKIP_PRERENDER === '1') {
    console.log('[prerender] skipped — PRERENDER=0 or SKIP_PRERENDER=1 set');
    return;
  }
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('[prerender] dist/index.html missing — run vite build first');
    process.exit(1);
  }

  console.log('[prerender] starting preview server on', baseUrl);
  console.log(`[prerender] chromium source: ${ON_VERCEL ? '@sparticuz/chromium' : 'playwright (local)'}`);
  const server = await startPreviewServer();
  await wait(500);

  const routes = getRoutes();
  console.log(`[prerender] prerendering ${routes.length} routes`);
  // On Vercel @sparticuz/chromium can crash mid-crawl (build-container memory).
  // Relaunch + retry the affected route once (reactive) and relaunch every
  // RELAUNCH_EVERY routes (proactive) to cap memory growth. Local never dies, so
  // it just runs straight through.
  let browser = await launchBrowser();
  const RELAUNCH_EVERY = ON_VERCEL ? 20 : Infinity;
  const isBrowserDead = (e) =>
    /closed|crashed|disconnected|Target (page|closed)|Session closed|Protocol error/i.test(e || '');
  const results = [];
  let sinceRelaunch = 0;
  for (const r of routes) {
    let res = await prerenderRoute(browser, r);
    if (!res.ok && isBrowserDead(res.error)) {
      console.warn(`[prerender] ↻ ${r}: browser died — relaunch + retry`);
      try { await browser.close(); } catch { /* already gone */ }
      browser = await launchBrowser();
      sinceRelaunch = 0;
      res = await prerenderRoute(browser, r);
    }
    results.push(res);
    if (res.ok) {
      sinceRelaunch++;
      console.log(`  ✓ ${r}  (${(res.size / 1024).toFixed(1)} kB)  "${res.title}"`);
    } else {
      console.log(`  ✗ ${r}  ${res.error}`);
    }
    if (sinceRelaunch >= RELAUNCH_EVERY) {
      try { await browser.close(); } catch { /* already gone */ }
      browser = await launchBrowser();
      sinceRelaunch = 0;
    }
  }
  try { await browser.close(); } catch { /* already gone */ }
  server.kill('SIGTERM');

  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  console.log(`[prerender] ${ok}/${results.length} ok, ${fail} fail`);

  // Summary file for Vercel inspection
  fs.writeFileSync(
    path.join(distDir, 'prerender-report.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), routes: results }, null, 2),
  );

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  const msg = err?.message ?? String(err);

  // On Vercel: NEVER silently skip. A failed prerender = broken SEO shipped to prod.
  if (ON_VERCEL) {
    console.error('[prerender] FATAL on Vercel build — browser launch failed; refusing to ship SEO-broken build:', msg);
    process.exit(1);
  }

  // Local only: graceful skip when no browser binary (fast iteration, stripped envs).
  const transient = [
    'browserType.launch',
    "Executable doesn't exist",
    "Cannot find module 'playwright'",
    'Failed to launch',
    'spawn ENOENT',
    'preview server start timeout',
  ];
  if (transient.some((sig) => msg.includes(sig))) {
    console.warn(`[prerender] skipped (no browser binary): ${msg.slice(0, 120)}`);
    console.warn('[prerender] build continues — set PRERENDER=0 to silence');
    process.exit(0);
  }
  console.error('[prerender] fatal:', err);
  process.exit(1);
});
