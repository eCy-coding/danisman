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
 * Opt-in: only runs when PRERENDER=1 set. Default build path unchanged.
 *
 * Usage:
 *   npm run build                       # default vite build (no prerender)
 *   PRERENDER=1 npm run build           # vite build + prerender
 *   PRERENDER=1 PRERENDER_ROUTES=/,/services npm run build  # subset
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
const port = Number(process.env.PRERENDER_PORT ?? 4179);
const baseUrl = `http://127.0.0.1:${port}`;

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

async function prerenderRoute(browser, route) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, userAgent: 'eCyPro-Prerender/1.0' });
  const page = await ctx.newPage();
  try {
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
    await ctx.close();
  }
}

async function main() {
  // Opt-out instead of opt-in for production. Skip only when explicitly disabled
  // (local dev, CI without browser binary, fast iteration).
  if (process.env.PRERENDER === '0' || process.env.SKIP_PRERENDER === '1') {
    console.log('[prerender] skipped — PRERENDER=0 or SKIP_PRERENDER=1 set');
    return;
  }
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('[prerender] dist/index.html missing — run vite build first');
    process.exit(1);
  }

  console.log('[prerender] starting preview server on', baseUrl);
  const server = await startPreviewServer();
  await wait(500);

  const routes = getRoutes();
  console.log(`[prerender] prerendering ${routes.length} routes`);
  const browser = await chromium.launch();
  const results = [];
  for (const r of routes) {
    const res = await prerenderRoute(browser, r);
    results.push(res);
    if (res.ok) {
      console.log(`  ✓ ${r}  (${(res.size / 1024).toFixed(1)} kB)  "${res.title}"`);
    } else {
      console.log(`  ✗ ${r}  ${res.error}`);
    }
  }
  await browser.close();
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
  // Graceful skip on environments without Playwright browser binary
  // (Vercel, Render, CI without `playwright install chromium`).
  // Build continues; local dev/CI with chromium still runs full prerender.
  const transient = [
    'browserType.launch',
    'Executable doesn\'t exist',
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
