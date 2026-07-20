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
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
// Reassigned in main(): an orphaned preview server (e.g. from a killed prior
// run) holding the base port must never wedge the whole prerender again —
// we probe and slide to the first free port instead of failing on strictPort.
let port = Number(process.env.PRERENDER_PORT ?? 4179);
let baseUrl = `http://127.0.0.1:${port}`;

function probePortFree(p) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(p, '127.0.0.1');
  });
}

async function findFreePort(start, tries = 10) {
  for (let p = start; p < start + tries; p += 1) {
    if (await probePortFree(p)) return p;
  }
  throw new Error(`no free port in ${start}..${start + tries - 1}`);
}

// Vercel sets VERCEL=1 in its build environment.
const ON_VERCEL = process.env.VERCEL === '1' && process.env.PRERENDER_FORCE_LOCAL !== '1';

function getRoutes() {
  // Override via env (comma-separated).
  const fromEnv = process.env.PRERENDER_ROUTES?.split(',').map((s) => s.trim()).filter(Boolean);
  if (fromEnv?.length) return fromEnv;

  // Read ALL sitemaps crawlers will follow — canonical URLs are
  // locale-prefixed (/tr/*, /en/*) and live in sitemap-tr/-en, so reading
  // only sitemap.xml left every canonical target as an unprerendered shell.
  const sitemapFiles = ['sitemap.xml', 'sitemap-tr.xml', 'sitemap-en.xml']
    .map((f) => path.join(distDir, f))
    .filter((f) => fs.existsSync(f));
  if (sitemapFiles.length === 0) {
    console.warn('[prerender] no sitemap found, defaulting to homepage only');
    return ['/'];
  }
  const locs = sitemapFiles.flatMap((f) => {
    const xml = fs.readFileSync(f, 'utf-8');
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  });
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
  // Self-healing: a missing browser binary (fresh worktree, interrupted
  // download) triggers exactly one automatic install attempt before the
  // failure propagates — so FORCE_LOCAL/CI still fails loud, but a clean
  // machine no longer silently ships a shell or needs manual setup.
  const { chromium } = await import('playwright');
  try {
    return await chromium.launch();
  } catch (err) {
    const msg = String(err?.message ?? err);
    if (!/Executable doesn't exist/i.test(msg)) throw err;
    console.warn('[prerender] chromium binary missing — one-shot self-install…');
    clearStaleBrowserLock();
    const cli = path.resolve(__dirname, '..', 'node_modules', 'playwright-core', 'cli.js');
    // No timeout: a loaded machine can take >15 min to download+extract; a
    // killed extraction leaves a truncated binary that test -x still "passes"
    // (observed 2026-07-18) — worse than waiting.
    const r = spawnSync(process.execPath, [cli, 'install', 'chromium', 'chromium-headless-shell'], {
      stdio: 'inherit',
    });
    if (r.status !== 0) console.error(`[prerender] self-install exited ${r.status}`);
    try {
      return await chromium.launch();
    } catch (err2) {
      // Last-resort: system Chrome (channel). Zero-download, present on dev
      // Macs and on GitHub ubuntu runners — makes local prerender immune to
      // the download/extraction fragility entirely.
      console.warn('[prerender] bundled chromium still unavailable — falling back to system Chrome');
      return chromium.launch({ channel: 'chrome' });
    }
  }
}

/** A crashed/killed installer leaves __dirlock behind; every later install
 *  then prints a "wait or remove lock" banner and exits 0 WITHOUT installing
 *  (observed 2026-07-18: three runs burned on this). A lock older than 10
 *  minutes cannot belong to a live install — move it aside. */
function clearStaleBrowserLock() {
  const browsersDir =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    (process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')
      : path.join(os.homedir(), '.cache', 'ms-playwright'));
  const lock = path.join(browsersDir, '__dirlock');
  try {
    const st = fs.statSync(lock);
    if (Date.now() - st.mtimeMs > 10 * 60 * 1000) {
      fs.renameSync(lock, `${lock}.stale-${Date.now()}`);
      console.warn('[prerender] moved stale playwright __dirlock aside');
    }
  } catch {
    /* no lock — nothing to clear */
  }
}

/** Hard per-route watchdog: page.goto/content can wedge past their own
 *  timeouts (observed: run frozen at route 44 for 15+ min under
 *  `vercel build`). A stuck route becomes a reported failure, never a hang. */
function withWatchdog(promise, route, ms = 60_000) {
  return Promise.race([
    promise,
    wait(ms).then(() => ({ route, ok: false, error: `watchdog ${ms}ms exceeded` })),
  ]);
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
  // Vercel build env: chromium binary memory/timeout sınırı 130-route
  // prerender'ı sustainably destekleyemiyor (browserContext close). Vercel'de
  // prerender otomatik skip; lokal `npm run build`'de çalışır.
  // PRERENDER_FORCE_LOCAL=1: explicit opt-in for the prebuilt-deploy flow —
  // `vercel build` runs on this machine with VERCEL=1 set, which would both
  // skip prerender and select the linux-only sparticuz binary. Forcing keeps
  // the local full-playwright path while producing .vercel/output.
  const forceLocal = process.env.PRERENDER_FORCE_LOCAL === '1';
  if (
    !forceLocal &&
    (process.env.PRERENDER === '0' ||
      process.env.SKIP_PRERENDER === '1' ||
      process.env.VERCEL === '1')
  ) {
    const reason = process.env.VERCEL === '1'
      ? 'VERCEL=1 build env (chromium unstable on Vercel)'
      : 'PRERENDER=0 or SKIP_PRERENDER=1 set';
    console.log(`[prerender] skipped — ${reason}`);
    return;
  }
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('[prerender] dist/index.html missing — run vite build first');
    process.exit(1);
  }

  const requestedPort = port;
  port = await findFreePort(requestedPort);
  baseUrl = `http://127.0.0.1:${port}`;
  if (port !== requestedPort) {
    console.warn(`[prerender] port ${requestedPort} busy (orphaned server?) — using ${port}`);
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

  // Bounded concurrency: one browser, N pages in flight. Sequential rendering
  // of the full route set took ~2h on a 2-core CI runner (real measurement,
  // deploy run 29709484891) — long enough to flirt with the job limit, where a
  // cancellation kills every downstream signal. Each worker keeps the existing
  // watchdog + browser-death retry semantics; only the scheduling changes.
  // Vercel's memory-constrained builder stays at 1 to preserve its relaunch
  // pacing.
  const CONCURRENCY = ON_VERCEL ? 1 : Number(process.env.PRERENDER_CONCURRENCY ?? 4);
  console.log(`[prerender] concurrency: ${CONCURRENCY}`);

  const queue = [...routes];
  const relaunchLock = { busy: false };

  async function renderOne(r) {
    let res = await withWatchdog(prerenderRoute(browser, r), r);
    if (!res.ok && isBrowserDead(res.error)) {
      // Only one worker may relaunch; the others simply retry on the new
      // browser once the relaunch settles.
      if (!relaunchLock.busy) {
        relaunchLock.busy = true;
        console.warn(`[prerender] ↻ ${r}: browser died — relaunch + retry`);
        try { await browser.close(); } catch { /* already gone */ }
        browser = await launchBrowser();
        sinceRelaunch = 0;
        relaunchLock.busy = false;
      } else {
        while (relaunchLock.busy) await wait(250);
      }
      res = await withWatchdog(prerenderRoute(browser, r), r);
    }
    results.push(res);
    if (res.ok) {
      sinceRelaunch++;
      console.log(`  ✓ ${r}  (${(res.size / 1024).toFixed(1)} kB)  "${res.title}"`);
    } else {
      console.log(`  ✗ ${r}  ${res.error}`);
    }
    if (sinceRelaunch >= RELAUNCH_EVERY && !relaunchLock.busy) {
      relaunchLock.busy = true;
      try { await browser.close(); } catch { /* already gone */ }
      browser = await launchBrowser();
      sinceRelaunch = 0;
      relaunchLock.busy = false;
    }
  }

  async function worker() {
    for (;;) {
      const r = queue.shift();
      if (r === undefined) return;
      await renderOne(r);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
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

  // PRERENDER_FORCE_LOCAL=1 = the prebuilt-deploy path (CI runner). A missing
  // browser binary there means the install step broke — shipping would mean a
  // silent SEO-shell regression (exactly how prod regressed before). Fail loud.
  if (process.env.PRERENDER_FORCE_LOCAL === '1') {
    console.error('[prerender] FATAL with PRERENDER_FORCE_LOCAL=1 — refusing graceful skip:', msg);
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
