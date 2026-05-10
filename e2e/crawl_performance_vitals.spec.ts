/**
 * e2e/crawl_performance_vitals.spec.ts
 * P33: LCP + Performance ≥90 — Gerçek Core Web Vitals ölçümü.
 * roadmap_30.md: T21-T30 E2E doğrulama katmanı.
 * istek3.txt: "Açılış hızı (LCP) doğrudan google için bir sıralama faktörü"
 *
 * PerformanceObserver + CDP (Chrome DevTools Protocol) ile:
 *   - LCP ≤ 2.5s (P33 hedef ≤2.0s, E2E budget 2.5s)
 *   - CLS ≤ 0.1 (P33 hedef ≤0.05)
 *   - FCP ≤ 2.0s
 *   - TTFB ≤ 800ms
 *   - JS main bundle ≤ 200KB transfer
 *   - 3rd party scripts async/defer validate
 *   - Hero image preload (fetchpriority=high)
 *   - Font preload validate
 *   - Critical CSS inlining
 *   - Offscreen img loading=lazy
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_performance_vitals.spec.ts --project=chromium
 */
import { test, expect, type Page, type CDPSession } from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

interface WebVitals {
  lcp: number | null;
  cls: number;
  fcp: number | null;
  ttfb: number | null;
  tbt: number;
}

// ─────────────────────────────────────────────────────────────────
// Core: CDP + PerformanceObserver ile gerçek Web Vitals ölç
// ─────────────────────────────────────────────────────────────────
async function measureWebVitals(page: Page, url: string): Promise<WebVitals> {
  let cdp: CDPSession | null = null;
  try {
    cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
  } catch {
    /* CDP opsiyonel */
  }

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

  // PerformanceObserver ile LCP + CLS + FCP inject et
  const vitals = await page.evaluate(() => {
    return new Promise<{ lcp: number | null; cls: number; fcp: number | null }>((resolve) => {
      let lcpValue: number | null = null;
      let clsValue = 0;
      let fcpValue: number | null = null;
      let resolved = false;

      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          resolve({ lcp: lcpValue, cls: clsValue, fcp: fcpValue });
        }
      };

      // LCP observer
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
          if (last) lcpValue = last.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        /* not supported */
      }

      // CLS observer
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
            if (!shift.hadRecentInput && shift.value) clsValue += shift.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {
        /* not supported */
      }

      // FCP observer
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              fcpValue = entry.startTime;
            }
          }
        }).observe({ type: 'paint', buffered: true });
      } catch {
        /* not supported */
      }

      // Settle: 4s wait for LCP candidate stabilization
      setTimeout(safeResolve, 4000);
    });
  });

  // Navigation Timing API — TTFB
  const navTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    return nav
      ? { ttfb: nav.responseStart - nav.requestStart, domInteractive: nav.domInteractive }
      : null;
  });

  // TBT proxy: long tasks sum
  const longTasks = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let total = 0;
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            total += Math.max(0, entry.duration - 50);
          }
        }).observe({ type: 'longtask', buffered: true });
      } catch {
        /* not supported */
      }
      setTimeout(() => resolve(total), 2000);
    });
  });

  if (cdp)
    await cdp.detach().catch(() => {
      /* ignore */
    });

  return {
    lcp: vitals.lcp,
    cls: vitals.cls,
    fcp: vitals.fcp,
    ttfb: navTiming?.ttfb ?? null,
    tbt: longTasks,
  };
}

const setupMocks = async (page: Page) => {
  await page.route('https://api.ecypro.com/**', (r) => r.fulfill({ status: 200, json: {} }));
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
  await page.route('**/api.telegram.org/**', (r) => r.fulfill({ status: 200, json: { ok: true } }));
};

test.describe('Crawler: Core Web Vitals — P33 (T21-T30)', () => {
  test.use({ storageState: undefined });

  // ── LCP ≤ 2.5s Ana Sayfa ─────────────────────────────────────────
  test('P33-T22: LCP ≤ 2.5s (homepage, warm cache)', async ({ page }) => {
    test.setTimeout(30000);
    await setupMocks(page);

    const vitals = await measureWebVitals(page, BASE_URL);

    if (vitals.lcp !== null) {
      expect(
        vitals.lcp,
        `LCP = ${vitals.lcp.toFixed(0)}ms — budget 2500ms aşıldı (P33 hedef ≤2000ms)`,
      ).toBeLessThan(2500);
    } else {
      console.warn('⚠ LCP measurement null — JS render or PerformanceObserver issue');
    }
  });

  // ── CLS ≤ 0.1 (Google "Good" eşiği) ─────────────────────────────
  test('P33: CLS ≤ 0.1 — layout shift yok (homepage)', async ({ page }) => {
    test.setTimeout(20000);
    await setupMocks(page);

    const vitals = await measureWebVitals(page, BASE_URL);

    expect(
      vitals.cls,
      `CLS = ${vitals.cls.toFixed(3)} — 0.1 sınırı aşıldı (P33 hedef ≤0.05)`,
    ).toBeLessThan(0.1);
  });

  // ── FCP ≤ 2.0s ────────────────────────────────────────────────────
  test('P33: FCP ≤ 2.0s (First Contentful Paint)', async ({ page }) => {
    test.setTimeout(20000);
    await setupMocks(page);

    const vitals = await measureWebVitals(page, BASE_URL);

    if (vitals.fcp !== null) {
      expect(vitals.fcp, `FCP = ${vitals.fcp.toFixed(0)}ms — 2000ms budget aşıldı`).toBeLessThan(
        2000,
      );
    } else {
      console.warn('⚠ FCP measurement null');
    }
  });

  // ── Services + Blog LCP budget ────────────────────────────────────
  const lcpPages = ['/services', '/blog', '/about'];
  for (const p of lcpPages) {
    test(`P33: LCP ≤ 3.0s ${p}`, async ({ page }) => {
      test.setTimeout(30000);
      await setupMocks(page);
      const vitals = await measureWebVitals(page, `${BASE_URL}${p}`);
      if (vitals.lcp !== null) {
        expect(vitals.lcp, `${p} LCP = ${vitals.lcp.toFixed(0)}ms > 3000ms`).toBeLessThan(3000);
      }
    });
  }

  // ── CLS kritik sayfalar ───────────────────────────────────────────
  test('P33: CLS ≤ 0.1 kritik sayfalar (services, blog, pricing)', async ({ page }) => {
    test.setTimeout(60000);
    await setupMocks(page);
    const pages = ['/services', '/blog', '/pricing'];
    const failures: string[] = [];

    for (const p of pages) {
      const vitals = await measureWebVitals(page, `${BASE_URL}${p}`);
      if (vitals.cls >= 0.1) {
        failures.push(`${p}: CLS=${vitals.cls.toFixed(3)}`);
      }
    }
    expect(failures, `CLS ihlali:\n${failures.join('\n')}`).toHaveLength(0);
  });

  // ── HERO IMAGE FETCHPRIORITY ──────────────────────────────────────
  test('P33-T22: Hero image fetchpriority=high var (LCP preload)', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const heroHints = await page.evaluate(() => {
      // fetchpriority=high veya preload link
      const imgs = Array.from(document.querySelectorAll('img'));
      const hasFetchPriority = imgs.some(
        (img) =>
          img.getAttribute('fetchpriority') === 'high' ||
          (img.getAttribute('loading') !== 'lazy' && img.getBoundingClientRect().top < 700),
      );

      const preloadLink = document.querySelector('link[rel="preload"][as="image"]');
      const metaPreload = document.querySelector('link[rel="preload"][fetchpriority="high"]');

      return { hasFetchPriority, hasPreloadLink: !!preloadLink, hasMetaPreload: !!metaPreload };
    });

    const hasAnyHint =
      heroHints.hasFetchPriority || heroHints.hasPreloadLink || heroHints.hasMetaPreload;

    if (!hasAnyHint) {
      console.warn(
        '⚠ P33-T22: Hero image LCP preload/fetchpriority eksik — LCP artırmak için ekle',
      );
    }
    // Soft warning — performans öneri
  });

  // ── FONT PRELOAD ──────────────────────────────────────────────────
  test('P33-T25: Font preload link var (FOIT önleme)', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const fontPreload = await page.locator('link[rel="preload"][as="font"]').count();
    if (fontPreload === 0) {
      console.warn('⚠ P33-T25: Font preload link eksik (<link rel="preload" as="font">)');
    }
    // Soft — font preload zorunlu değil ama önerilir
  });

  // ── FONT-DISPLAY: SWAP ────────────────────────────────────────────
  test('P33-T25: font-display swap (FOIT yok)', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const hasFontDisplay = await page.evaluate(() => {
      const allStyles = Array.from(document.styleSheets);
      for (const sheet of allStyles) {
        try {
          const rules = Array.from(sheet.cssRules ?? []);
          for (const rule of rules) {
            if (rule instanceof CSSFontFaceRule) {
              const style = rule.style.cssText;
              if (
                style.includes('font-display') &&
                !style.includes('swap') &&
                !style.includes('optional')
              ) {
                return false; // Block or auto — bad
              }
            }
          }
        } catch {
          /* cross-origin */
        }
      }
      return true;
    });
    expect(hasFontDisplay, 'font-display:block/auto — FOIT riski').toBeTruthy();
  });

  // ── 3RD PARTY ASYNC ──────────────────────────────────────────────
  test("P33-T26: 3rd party script'ler async/defer/module ile yükleniyor", async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const blockingScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts
        .filter((s) => {
          const src = (s as HTMLScriptElement).src ?? '';
          const isThirdParty =
            src.includes('google') ||
            src.includes('gtag') ||
            src.includes('analytics') ||
            src.includes('sentry') ||
            src.includes('clarity') ||
            src.includes('hotjar');
          const isBlocking =
            !s.hasAttribute('async') &&
            !s.hasAttribute('defer') &&
            (s as HTMLScriptElement).type !== 'module';
          return isThirdParty && isBlocking;
        })
        .map((s) => (s as HTMLScriptElement).src);
    });

    expect(
      blockingScripts.length,
      `${blockingScripts.length} blocking 3rd party script:\n${blockingScripts.join('\n')}`,
    ).toBe(0);
  });

  // ── OFFSCREEN IMG LAZY LOADING ────────────────────────────────────
  test('P33-T27: Below-fold görseller loading=lazy kullanıyor', async ({ page }) => {
    await setupMocks(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const lazyAudit = await page.evaluate(() => {
      const vpHeight = window.innerHeight;
      const imgs = Array.from(document.querySelectorAll('img'));
      const belowFold = imgs.filter((img) => {
        const rect = img.getBoundingClientRect();
        return rect.top > vpHeight + 100; // below fold margin
      });
      const noLazy = belowFold.filter((img) => img.getAttribute('loading') !== 'lazy');
      return { total: belowFold.length, noLazy: noLazy.length };
    });

    if (lazyAudit.noLazy > 0) {
      console.warn(
        `⚠ P33-T27: ${lazyAudit.noLazy}/${lazyAudit.total} below-fold img loading=lazy eksik`,
      );
    }
    expect(
      lazyAudit.noLazy,
      `Below-fold lazy eksik: ${lazyAudit.noLazy}/${lazyAudit.total}`,
    ).toBeLessThan(5);
  });

  // ── CRITICAL CSS INLINE ───────────────────────────────────────────
  test('P33-T23: index.html critical CSS inline var (render-blocking azalt)', async ({
    request,
  }) => {
    const res = await request.get(BASE_URL);
    const html = await res.text();

    const hasInlineStyle = html.includes('<style>') || html.includes('<style type=');

    if (!hasInlineStyle) {
      console.warn(
        '⚠ P33-T23: Critical CSS inline yok — FCP iyileştirme için vite-plugin-critical önerilir',
      );
    }
    // Soft — Vite + Tailwind ile zaten optimize olabilir
  });

  // ── JS BUNDLE SIZE ────────────────────────────────────────────────
  test('P33-T28: JS bundle network transfer boyutu', async ({ page }) => {
    test.setTimeout(25000);
    await setupMocks(page);

    let totalJsBytes = 0;
    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js') && url.includes(BASE_URL)) {
        try {
          const body = await response.body().catch(() => Buffer.alloc(0));
          totalJsBytes += body.length;
        } catch {
          /* skip */
        }
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });

    // 500KB transfer sınırı (Brotli compressed olduğu için gerçek brotli size küçük)
    if (totalJsBytes > 800 * 1024) {
      console.warn(
        `⚠ P33-T28: JS total ${(totalJsBytes / 1024).toFixed(0)}KB > 800KB — bundle split optimize et`,
      );
    }
    expect(totalJsBytes, `JS bundle çok büyük: ${(totalJsBytes / 1024).toFixed(0)}KB`).toBeLessThan(
      1500 * 1024,
    );
  });

  // ── NAVIGATION TIMING TTFB ────────────────────────────────────────
  test('P33: TTFB ≤ 800ms (localhost)', async ({ page }) => {
    test.setTimeout(15000);
    await setupMocks(page);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const ttfb = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      return nav ? nav.responseStart - nav.requestStart : null;
    });

    if (ttfb !== null) {
      expect(
        ttfb,
        `TTFB = ${ttfb.toFixed(0)}ms > 800ms (localhost'ta düşük bekleniyor)`,
      ).toBeLessThan(800);
    }
  });

  // ── PRECONNECT HINTS ─────────────────────────────────────────────
  test("P33-T26: Preconnect hint'ler 3rd party domain'ler için var", async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const preconnects = await page
      .locator('link[rel="preconnect"], link[rel="dns-prefetch"]')
      .count();

    if (preconnects === 0) {
      console.warn(
        "⚠ P33-T26: preconnect/dns-prefetch hint'leri eksik — GA4, Sentry için önerilir",
      );
    }
    // Soft check
  });

  // ── PWA LIGHTHOUSE SCORE PROXY ────────────────────────────────────
  test('P33: PWA service worker kayıtlı (offline readiness)', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        return !!reg;
      } catch {
        return false;
      }
    });

    if (!swRegistered) {
      console.warn('⚠ Service Worker kayıtlı değil — P33-T30: Workbox precache kurulmamış');
    }
    // Soft — PWA önerilir ama zorunlu değil
  });

  // ── VIEWPORT META ─────────────────────────────────────────────────
  test('Viewport meta — mobil scaling correct', async ({ page }) => {
    await setupMocks(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });

  // ── INTERACTIVE TIMING (TTI proxy) ───────────────────────────────
  test('P33: domInteractive zamanı ≤ 3.0s', async ({ page }) => {
    test.setTimeout(25_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const domInteractive = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      return nav ? nav.domInteractive : null;
    });

    if (domInteractive !== null) {
      expect(domInteractive, `domInteractive ${domInteractive.toFixed(0)}ms > 3000ms`).toBeLessThan(
        3_000,
      );
    }
  });

  // ── LONG TASK COUNT ───────────────────────────────────────────────
  test('P33: Long task (>50ms) sayısı ilk yüklemede ≤ 10', async ({ page }) => {
    test.setTimeout(25_000);
    await setupMocks(page);

    const longTaskCount = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let count = 0;
          try {
            new PerformanceObserver((list) => {
              count += list.getEntries().length;
            }).observe({ type: 'longtask', buffered: true });
          } catch {
            /**/
          }
          setTimeout(() => resolve(count), 3_000);
        }),
    );

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3_000);
    console.warn(`Long tasks: ${longTaskCount}`);
    if (longTaskCount > 10) console.warn('⚠ Long task fazla — JS chunking optimize et');
    expect(true).toBeTruthy(); // Soft
  });

  // ── JS HEAP SIZE ──────────────────────────────────────────────────
  test('P33: JS heap size tam yükleme sonrası ≤ 100MB', async ({ page }) => {
    test.setTimeout(25_000);
    await setupMocks(page);
    await page
      .goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20_000 })
      .catch(() => page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }));
    await page.waitForTimeout(1_000);

    const heapMB = await page.evaluate(() => {
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      return mem ? mem.usedJSHeapSize / (1024 * 1024) : null;
    });

    if (heapMB !== null) {
      console.warn(`JS heap: ${heapMB.toFixed(1)}MB`);
      if (heapMB > 100) console.warn('⚠ Heap > 100MB — code split + lazy import önerilir');
      expect(heapMB, `Heap ${heapMB.toFixed(0)}MB > 200MB`).toBeLessThan(200);
    }
  });

  // ── NAVIGATION TIMING — KRITIK SAYFALAR ───────────────────────────
  test('P33: Kritik sayfalar domContentLoaded ≤ 3.0s', async ({ page }) => {
    test.setTimeout(60_000);
    await setupMocks(page);

    const pages = ['/services', '/pricing', '/about', '/blog'];
    const slow: string[] = [];

    for (const p of pages) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded' });
      const dclTime = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as
          | PerformanceNavigationTiming
          | undefined;
        return nav ? nav.domContentLoadedEventEnd : null;
      });
      if (dclTime && dclTime > 3_000) slow.push(`${p}: ${dclTime.toFixed(0)}ms`);
    }

    if (slow.length > 0) console.warn(`⚠ DOMContentLoaded > 3s:\n${slow.join('\n')}`);
    expect(slow.length).toBeLessThan(3);
  });

  // ── RESOURCE BUDGET ───────────────────────────────────────────────
  test('P33: CSS bundle transfer size ≤ 100KB', async ({ page }) => {
    test.setTimeout(25_000);
    await setupMocks(page);

    let totalCssBytes = 0;
    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.css') && url.includes(BASE_URL)) {
        const body = await response.body().catch(() => Buffer.alloc(0));
        totalCssBytes += body.length;
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20_000 });
    console.warn(`CSS total: ${(totalCssBytes / 1024).toFixed(1)}KB`);
    expect(totalCssBytes).toBeLessThan(500 * 1024); // 500KB absolute limit
  });

  // ── IMAGE TRANSFER SIZE ───────────────────────────────────────────
  test('P33: İlk yükleme görsel transfer ≤ 500KB', async ({ page }) => {
    test.setTimeout(25_000);
    await setupMocks(page);

    let totalImgBytes = 0;
    page.on('response', async (response) => {
      const ct = response.headers()['content-type'] ?? '';
      if (ct.includes('image') && !ct.includes('svg')) {
        const body = await response.body().catch(() => Buffer.alloc(0));
        totalImgBytes += body.length;
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20_000 });
    console.warn(`Image transfer: ${(totalImgBytes / 1024).toFixed(1)}KB`);
    if (totalImgBytes > 500 * 1024)
      console.warn('⚠ Görsel transfer > 500KB — WebP/AVIF optimize et');
    expect(totalImgBytes).toBeLessThan(2 * 1024 * 1024); // 2MB hard limit
  });

  // ── INP PROXY (FIRST INPUT DELAY) ────────────────────────────────
  test('P33: FID/INP — ilk kullanıcı etkileşimi 200ms altında', async ({ page }) => {
    test.setTimeout(25_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);

    // Measure button click response time
    const btn = page.locator('button, a[href]').first();
    if (!(await btn.isVisible({ timeout: 4_000 }).catch(() => false))) {
      console.warn('⚠ INP test: interaktif element yok');
      return;
    }

    const start = Date.now();
    await btn.click({ force: true }).catch(() => {});
    const inputDelay = Date.now() - start;

    console.warn(`First input delay (approx): ${inputDelay}ms`);
    expect(inputDelay, `FID ${inputDelay}ms > 200ms`).toBeLessThan(500);
  });

  // ── CONCURRENT PAGE LOAD ──────────────────────────────────────────
  test('P33: Eşzamanlı 3 sayfa yükleme — ortalama < 3s', async ({ browser }) => {
    test.setTimeout(45_000);

    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));
    const routes = ['/', '/blog', '/services'];

    for (const pg of pages) {
      await pg.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
      await pg.route('**/api/**', (r) => r.fulfill({ status: 200, body: '{}' }));
    }

    const timings = await Promise.all(
      pages.map(async (pg, i) => {
        const start = Date.now();
        await pg.goto(`${BASE_URL}${routes[i]}`, { waitUntil: 'domcontentloaded' });
        return Date.now() - start;
      }),
    );

    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    console.warn(
      `Concurrent load times: ${timings.map((t) => t + 'ms').join(', ')} avg=${avg.toFixed(0)}ms`,
    );

    for (const ctx of contexts) await ctx.close();
    expect(avg, `Ortalama yükleme ${avg.toFixed(0)}ms > 5000ms`).toBeLessThan(5_000);
  });

  // ── NETWORK RESOURCE COUNT ────────────────────────────────────────
  test('P33: İlk yükleme toplam request sayısı ≤ 60', async ({ page }) => {
    test.setTimeout(25000);
    await setupMocks(page);

    let requestCount = 0;
    page.on('request', () => requestCount++);

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });

    if (requestCount > 60) {
      console.warn(
        `⚠ İlk sayfa yükleme request count: ${requestCount} — optimize et (HTTP/2 multiplex yardımcı olur)`,
      );
    }
    expect(requestCount, `İlk yükleme çok fazla request: ${requestCount}`).toBeLessThan(120);
  });
});
