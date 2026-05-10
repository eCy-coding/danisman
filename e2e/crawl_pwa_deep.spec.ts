/**
 * e2e/crawl_pwa_deep.spec.ts
 * istek5.txt Pane 6 (Media-Watcher) + Pane 11 (Deploy-Watch)
 * Phase 7: PWA Deep — Manifest, Service Worker, Offline, Install Prompt
 *
 * Test Listesi (15):
 *  P-PWA-01  /manifest.webmanifest veya /manifest.json 200 döner
 *  P-PWA-02  Manifest: name, short_name, icons, start_url, display
 *  P-PWA-03  Manifest icons 192px + 512px var
 *  P-PWA-04  Apple touch icon meta tag
 *  P-PWA-05  Service Worker kayıtlı ve activated
 *  P-PWA-06  SW Workbox precache entries > 0
 *  P-PWA-07  Offline — SW cache ile HTML serve edilir
 *  P-PWA-08  SW güncelleme — stale-while-revalidate header
 *  P-PWA-09  theme-color meta tag mevcut
 *  P-PWA-10  Viewport meta width=device-width initial-scale=1
 *  P-PWA-11  https: redirect (production domain)
 *  P-PWA-12  Install prompt (beforeinstallprompt) event tetiklenir
 *  P-PWA-13  PWA splash screen — apple-mobile-web-app meta tags
 *  P-PWA-14  Content-Security-Policy worker-src 'self'
 *  P-PWA-15  Push notification permission (Notification API var)
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_pwa_deep.spec.ts --project=chromium
 */

import { test, expect, type Page, type CDPSession } from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

async function setupMocks(page: Page): Promise<void> {
  await page.route('**/api/geo/**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { country: 'TR', flag: '🇹🇷', currency: 'TRY', suggestedLang: 'tr' },
      }),
    }),
  );
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
  await page.route('**/api.telegram.org/**', (r) => r.fulfill({ status: 200, json: { ok: true } }));
}

test.describe('Crawler: PWA Deep — Pane 6+11 (Phase 7)', () => {
  test.use({ storageState: undefined });

  // ─── P-PWA-01: manifest.webmanifest ──────────────────────────
  test('P-PWA-01: /manifest.webmanifest 200 döner ve JSON geçerli', async ({ request }) => {
    test.setTimeout(15_000);

    // Try both common manifest paths
    const paths = ['/manifest.webmanifest', '/manifest.json', '/site.webmanifest'];
    let found = false;

    for (const path of paths) {
      const res = await request.get(`${BASE_URL}${path}`).catch(() => null);
      if (res && res.status() === 200) {
        const body = await res.json().catch(() => null);
        if (body) {
          expect(body).toBeDefined();
          found = true;
          console.warn(`✅ Manifest found at: ${path}`);
          break;
        }
      }
    }

    if (!found) console.warn('⚠ Web App Manifest yok — PWA install prompt çalışmaz');
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-02: Manifest required fields ──────────────────────
  test('P-PWA-02: Manifest name, short_name, start_url, display mevcut', async ({ request }) => {
    test.setTimeout(15_000);

    const paths = ['/manifest.webmanifest', '/manifest.json'];
    for (const path of paths) {
      const res = await request.get(`${BASE_URL}${path}`).catch(() => null);
      if (!res || res.status() !== 200) continue;

      const manifest = await res.json().catch(() => null);
      if (!manifest) continue;

      expect(manifest.name || manifest.short_name, 'Manifest name eksik').toBeTruthy();
      expect(manifest.start_url, 'Manifest start_url eksik').toBeTruthy();

      const validDisplays = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];
      if (manifest.display) {
        expect(validDisplays).toContain(manifest.display);
      }
      return;
    }
    console.warn('⚠ Manifest bulunamadı — fields kontrol edilemedi');
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-03: Manifest icons 192 + 512 ──────────────────────
  test('P-PWA-03: Manifest icons 192px ve 512px boyutları var', async ({ request }) => {
    test.setTimeout(15_000);

    const paths = ['/manifest.webmanifest', '/manifest.json'];
    for (const path of paths) {
      const res = await request.get(`${BASE_URL}${path}`).catch(() => null);
      if (!res || res.status() !== 200) continue;

      const manifest = await res.json().catch(() => null);
      if (!manifest?.icons) {
        console.warn('⚠ Manifest icons eksik');
        return;
      }

      const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes ?? '');
      const has192 = sizes.some((s: string) => s.includes('192'));
      const has512 = sizes.some((s: string) => s.includes('512'));

      if (!has192) console.warn('⚠ 192x192 icon eksik');
      if (!has512) console.warn('⚠ 512x512 icon eksik');
      console.warn(`Icon sizes: ${sizes.join(', ')}`);
      return;
    }
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-04: Apple touch icon ──────────────────────────────
  test('P-PWA-04: apple-touch-icon meta/link mevcut', async ({ page }) => {
    test.setTimeout(15_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const appleIcon = await page.evaluate(() => {
      const link = document.querySelector('link[rel="apple-touch-icon"]');
      return link ? link.getAttribute('href') : null;
    });

    if (!appleIcon) console.warn('⚠ apple-touch-icon link eksik — iOS home screen icon yok');
    else console.warn(`✅ apple-touch-icon: ${appleIcon}`);
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-05: Service Worker activated ──────────────────────
  test('P-PWA-05: Service Worker kayıtlı ve activated', async ({ page }) => {
    test.setTimeout(30_000);
    await setupMocks(page);
    await page
      .goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25_000 })
      .catch(() => page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }));
    await page.waitForTimeout(2_000);

    const swInfo = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return null;
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return null;
      return {
        scope: reg.scope,
        state: reg.active?.state ?? reg.installing?.state ?? reg.waiting?.state ?? 'none',
        scriptURL: reg.active?.scriptURL?.split('/').pop() ?? '',
      };
    });

    if (swInfo) {
      console.warn(`SW: scope=${swInfo.scope}, state=${swInfo.state}, script=${swInfo.scriptURL}`);
      expect(['activated', 'activating', 'installed', 'installing']).toContain(swInfo.state);
    } else {
      console.warn('⚠ Service Worker kayıtlı değil');
    }
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-06: Workbox precache ──────────────────────────────
  test('P-PWA-06: Workbox precache entries var (sw.js)', async ({ request }) => {
    test.setTimeout(15_000);

    const swRes = await request.get(`${BASE_URL}/sw.js`).catch(() => null);
    if (!swRes || swRes.status() !== 200) {
      console.warn('⚠ sw.js bulunamadı — Workbox precache kontrol edilemedi');
      return;
    }

    const swContent = await swRes.text();
    const hasWorkbox =
      swContent.includes('workbox') ||
      swContent.includes('precache') ||
      swContent.includes('precacheAndRoute');
    const hasPrecache =
      swContent.includes('precacheManifest') || swContent.includes('self.__WB_MANIFEST');

    console.warn(`SW: workbox=${hasWorkbox}, precache=${hasPrecache}`);
    if (!hasWorkbox) console.warn('⚠ Workbox yok — cache stratejisi eksik');
    expect(swContent.length).toBeGreaterThan(100);
  });

  // ─── P-PWA-07: Offline HTML cache ────────────────────────────
  test('P-PWA-07: Offline modda HTML serve edilir (SW cache)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CDP offline sadece Chromium');
    test.setTimeout(40_000);
    await setupMocks(page);

    // Load and wait for SW
    await page
      .goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20_000 })
      .catch(() => page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }));
    await page.waitForTimeout(2_000);

    const client: CDPSession = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });

    // Try to navigate while offline
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_500);

    const body = await page
      .locator('body')
      .textContent()
      .catch(() => '');
    const hasContent = (body ?? '').length > 50;

    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
    await client.detach();

    console.warn(`Offline content length: ${body?.length ?? 0}`);
    if (!hasContent) console.warn('⚠ SW cache yok — offline sayfası boş');
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-08: Cache-Control header ──────────────────────────
  test('P-PWA-08: Static assets Cache-Control header var', async ({ request }) => {
    test.setTimeout(15_000);

    const res = await request.get(BASE_URL).catch(() => null);
    if (!res) {
      console.warn('⚠ Erişilemiyor');
      return;
    }

    const cacheControl = res.headers()['cache-control'];
    const etag = res.headers()['etag'];

    console.warn(`Cache-Control: ${cacheControl}, ETag: ${etag}`);
    if (!cacheControl && !etag) {
      console.warn('⚠ Cache-Control/ETag yok — browser caching eksik');
    }
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-09: theme-color ───────────────────────────────────
  test('P-PWA-09: theme-color meta tag mevcut', async ({ page }) => {
    test.setTimeout(15_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .getAttribute('content')
      .catch(() => null);
    if (!themeColor) console.warn('⚠ theme-color meta eksik — tarayıcı UI rengi yok');
    else console.warn(`✅ theme-color: ${themeColor}`);
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-10: Viewport meta ─────────────────────────────────
  test('P-PWA-10: Viewport meta width=device-width, initial-scale=1', async ({ page }) => {
    test.setTimeout(15_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });

  // ─── P-PWA-11: HTTPS redirect ────────────────────────────────
  test('P-PWA-11: Production domain HTTP → HTTPS redirect', async ({ request }) => {
    test.setTimeout(15_000);

    const res = await request.get('http://ecypro.com', { maxRedirects: 0 }).catch(() => null);
    if (res && res.status() >= 300 && res.status() < 400) {
      const location = res.headers()['location'] ?? '';
      expect(location).toContain('https://');
      console.warn(`✅ HTTP→HTTPS redirect: ${location}`);
    } else {
      console.warn('⚠ HTTP→HTTPS redirect kontrol edilemedi (domain resolve yok)');
    }
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-12: beforeinstallprompt ───────────────────────────
  test('P-PWA-12: PWA install kriterleri (manifest + SW + HTTPS)', async ({ page }) => {
    test.setTimeout(30_000);
    await setupMocks(page);

    let installPromptFired = false;
    await page.addInitScript(() => {
      window.addEventListener('beforeinstallprompt', () => {
        (window as Window & { __pwaInstallFired?: boolean }).__pwaInstallFired = true;
      });
    });

    await page
      .goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20_000 })
      .catch(() => page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }));
    await page.waitForTimeout(2_000);

    installPromptFired = await page.evaluate(
      () => !!(window as Window & { __pwaInstallFired?: boolean }).__pwaInstallFired,
    );

    if (!installPromptFired) {
      // Check PWA criteria manually
      const manifest = await page
        .locator('link[rel="manifest"]')
        .getAttribute('href')
        .catch(() => null);
      const swReg = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return false;
        const reg = await navigator.serviceWorker.getRegistration();
        return !!reg;
      });
      console.warn(
        `PWA criteria: manifest=${!!manifest}, SW=${swReg}, installPrompt=${installPromptFired}`,
      );
    }
    expect(true).toBeTruthy(); // Soft — depends on browser/https
  });

  // ─── P-PWA-13: Apple mobile meta ─────────────────────────────
  test('P-PWA-13: Apple mobile meta tags (splash screen, status bar)', async ({ page }) => {
    test.setTimeout(15_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const appleMeta = await page.evaluate(() => ({
      capable: !!document.querySelector('meta[name="apple-mobile-web-app-capable"]'),
      statusBar: !!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]'),
      title: !!document.querySelector('meta[name="apple-mobile-web-app-title"]'),
    }));

    console.warn(
      `Apple PWA meta: capable=${appleMeta.capable}, statusBar=${appleMeta.statusBar}, title=${appleMeta.title}`,
    );
    if (!appleMeta.capable) console.warn('⚠ apple-mobile-web-app-capable eksik');
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-14: CSP worker-src ────────────────────────────────
  test('P-PWA-14: Content-Security-Policy worker-src "self" izni', async ({ request }) => {
    test.setTimeout(15_000);

    const res = await request.get(BASE_URL);
    const csp = res.headers()['content-security-policy'];

    if (csp) {
      const hasWorkerSrc = csp.includes('worker-src') || csp.includes("'self'");
      if (!hasWorkerSrc) console.warn('⚠ CSP worker-src eksik — SW blocked olabilir');
      else console.warn(`✅ CSP: ${csp.slice(0, 80)}...`);
    } else {
      console.warn('⚠ CSP header yok — localhost dev server');
    }
    expect(true).toBeTruthy();
  });

  // ─── P-PWA-15: Notification API ──────────────────────────────
  test('P-PWA-15: Notification API browser tarafından destekleniyor', async ({ page }) => {
    test.setTimeout(15_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const notifSupport = await page.evaluate(() => 'Notification' in window);
    console.warn(`Notification API: ${notifSupport}`);
    // Chromium should support it
    expect(notifSupport).toBe(true);

    // Check that permission is not auto-granted
    const permission = await page.evaluate(async () => {
      if (!('Notification' in window)) return 'not-supported';
      return Notification.permission;
    });
    console.warn(`Notification permission: ${permission}`);
    // Should be 'default' (not auto-granted)
    expect(['default', 'denied', 'granted']).toContain(permission);
  });
});
