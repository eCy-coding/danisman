#!/usr/bin/env node
/**
 * eCyPro — Visual Regression Baseline Capture
 * P11/3 — devops-publisher + a11y-fixer
 *
 * For each public route, captures:
 *   - mobile (375×667) screenshot
 *   - desktop (1440×900) screenshot
 *   - console messages (errors/warnings counted)
 *   - axe-core violation count
 *   - HTTP status of main document
 *
 * Output:
 *   outputs/screenshots/mobile/<slug>.png
 *   outputs/screenshots/desktop/<slug>.png
 *   outputs/P11_VISUAL_BASELINE.json
 *
 * Usage (host):
 *   PREVIEW_URL=http://localhost:4173 node scripts/capture-visual-baseline.mjs
 *
 * Requires preview server already running (use RUN_VISUAL_BASELINE.command
 * wrapper which boots vite preview).
 */

import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';

// Top routes — public surface that ships in sitemap (15 most-trafficked + 2 legal).
// Locale-prefixed shadow routes are NOT captured here (same render path); admin
// routes are NOT captured (auth-gated).
const ROUTES = [
  { slug: 'home', path: '/' },
  { slug: 'services', path: '/services' },
  { slug: 'pricing', path: '/pricing' },
  { slug: 'blog', path: '/blog' },
  { slug: 'contact', path: '/contact' },
  { slug: 'about', path: '/about' },
  { slug: 'team', path: '/team' },
  { slug: 'careers', path: '/careers' },
  { slug: 'faq', path: '/faq' },
  { slug: 'industries', path: '/industries' },
  { slug: 'methodology', path: '/methodology' },
  { slug: 'partners', path: '/partners' },
  { slug: 'case-studies', path: '/case-studies' },
  { slug: 'events', path: '/events' },
  { slug: 'locations', path: '/locations' },
  { slug: 'privacy', path: '/privacy' },
  { slug: 'terms', path: '/terms' },
  { slug: 'cookies', path: '/cookies' },
  { slug: 'maturity-assessment', path: '/maturity-assessment' },
  { slug: 'not-found', path: '/__nonexistent_route__' },
];

const VIEWPORTS = {
  mobile: { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
};

const outDir = path.resolve(process.cwd(), 'outputs', 'screenshots');
fs.mkdirSync(path.join(outDir, 'mobile'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'desktop'), { recursive: true });

async function captureRoute(browser, route) {
  const entry = {
    slug: route.slug,
    path: route.path,
    captured_at: new Date().toISOString(),
    mobile: null,
    desktop: null,
  };

  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: vp.isMobile,
      userAgent:
        vp.isMobile
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    const consoleMessages = { error: 0, warning: 0, log: 0 };
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error') consoleMessages.error += 1;
      else if (type === 'warning') consoleMessages.warning += 1;
      else consoleMessages.log += 1;
    });

    let status = null;
    let netFailed = 0;
    page.on('response', (r) => {
      const code = r.status();
      if (r.url() === `${PREVIEW_URL}${route.path}` || r.url().endsWith(route.path)) {
        if (status === null) status = code;
      }
      if (code >= 400) netFailed += 1;
    });

    try {
      const resp = await page.goto(`${PREVIEW_URL}${route.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      if (status === null && resp) status = resp.status();
      // Settle animations
      await page.waitForTimeout(750);

      const screenshotPath = path.join(outDir, vpName, `${route.slug}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      let axeViolations = null;
      try {
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        axeViolations = result.violations.length;
      } catch (e) {
        axeViolations = `error:${e.message?.slice(0, 80)}`;
      }

      entry[vpName] = {
        screenshot: path.relative(process.cwd(), screenshotPath),
        status,
        console: consoleMessages,
        net_failed: netFailed,
        axe_violations: axeViolations,
      };
      console.log(
        `  ✓ ${vpName.padEnd(7)} ${route.path.padEnd(28)} → status=${status} axe=${axeViolations} console.error=${consoleMessages.error}`,
      );
    } catch (e) {
      entry[vpName] = { error: e.message?.slice(0, 200) };
      console.log(`  ✗ ${vpName.padEnd(7)} ${route.path.padEnd(28)} → ${e.message?.slice(0, 80)}`);
    } finally {
      await context.close();
    }
  }
  return entry;
}

(async () => {
  console.log(`P11 visual baseline · target=${PREVIEW_URL} routes=${ROUTES.length}`);
  console.log('─'.repeat(80));

  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const route of ROUTES) {
    console.log(`▶ ${route.slug}`);
    const entry = await captureRoute(browser, route);
    results.push(entry);
  }
  await browser.close();

  const out = {
    captured_at: new Date().toISOString(),
    preview_url: PREVIEW_URL,
    route_count: ROUTES.length,
    viewports: VIEWPORTS,
    results,
  };
  fs.writeFileSync(
    path.resolve(process.cwd(), 'outputs', 'P11_VISUAL_BASELINE.json'),
    JSON.stringify(out, null, 2),
  );

  // Tally
  const ok = results.filter((r) => r.mobile?.status === 200 && r.desktop?.status === 200).length;
  console.log('─'.repeat(80));
  console.log(`✅ Captured ${ROUTES.length} routes. OK=${ok}.`);
  console.log(`Output: outputs/P11_VISUAL_BASELINE.json`);
  console.log(`Screenshots: outputs/screenshots/{mobile,desktop}/<slug>.png`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
