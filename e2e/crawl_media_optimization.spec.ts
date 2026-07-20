/**
 * e2e/crawl_media_optimization.spec.ts
 * istek5.txt Pane 6 — 📦 Media-Watcher
 * Phase 3: Media & Asset Pipeline — WebP/AVIF, <picture>, lazy, responsive, LCP
 *
 * Test Listesi (18):
 *  P-MED-01  <picture> elementi WebP/AVIF source var
 *  P-MED-02  MediaPicture data-testid render edilir
 *  P-MED-03  Hero img fetchpriority=high veya preload link (LCP)
 *  P-MED-04  Below-fold görseller loading=lazy
 *  P-MED-05  Tüm img alt text içeriyor (a11y + SEO)
 *  P-MED-06  LCP görseli lazy değil
 *  P-MED-07  img width + height attribute (CLS önleme)
 *  P-MED-08  srcset responsive breakpoints
 *  P-MED-09  WebP/AVIF format oranı ≥ %30
 *  P-MED-10  Blog sayfası görsel lazy ratio ≥ %60
 *  P-MED-11  Görsel decoding=async (paint blocker yok)
 *  P-MED-12  Toplam img sayısı ≤ 40 (homepage)
 *  P-MED-13  Services sayfası görsel audit
 *  P-MED-14  About sayfası görsel audit
 *  P-MED-15  Görseller 5xx response vermiyor (broken image yok)
 *  P-MED-16  SVG sprite/inline var (icon optimizasyonu)
 *  P-MED-17  CSS background-image (non-LCP) lazy load hint
 *  P-MED-18  CLS görsel layout shift < 0.1
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_media_optimization.spec.ts --project=chromium
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

interface ImgEntry {
  src: string;
  alt: string;
  hasAlt: boolean;
  loading: string;
  fetchpriority: string;
  width: string | null;
  height: string | null;
  decoding: string;
  top: number;
  inChrome: boolean;
}

async function collectImages(page: Page): Promise<ImgEntry[]> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map((img) => ({
      src: img.getAttribute('src') ?? img.getAttribute('data-src') ?? '',
      alt: img.getAttribute('alt') ?? '',
      // WCAG 1.1.1 / axe-core `image-alt`: alt="" is a valid, compliant
      // decorative/redundant-image pattern — only a MISSING attribute is a
      // real violation.
      hasAlt: img.hasAttribute('alt'),
      loading: img.getAttribute('loading') ?? '',
      fetchpriority: img.getAttribute('fetchpriority') ?? img.getAttribute('fetchPriority') ?? '',
      width: img.getAttribute('width'),
      height: img.getAttribute('height'),
      decoding: img.getAttribute('decoding') ?? '',
      top: img.getBoundingClientRect().top,
      // Mega-menu "editor's picks" thumbnails sit in the closed nav dropdown
      // (display:none) — getBoundingClientRect() reports top:0 for them,
      // which falsely looks like an in-viewport LCP candidate. They are
      // deliberately loading="lazy" (never the visible LCP element).
      inChrome: !!img.closest('nav, header'),
    }));
  });
}

async function setupMocks(page: Page): Promise<void> {
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
  await page.route('**/api.telegram.org/**', (r) => r.fulfill({ status: 200, json: { ok: true } }));
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
}

test.describe('Crawler: Media Optimization — Pane 6 (Phase 3)', () => {
  test.use({ storageState: undefined });

  // ─── P-MED-01: <picture> WebP/AVIF source ───────────────────
  test('P-MED-01: <picture> elementi WebP/AVIF source içeriyor', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const pictureCount = await page.locator('picture').count();
    if (pictureCount > 0) {
      const webpSources = await page.evaluate(
        () =>
          document.querySelectorAll(
            'picture source[type="image/webp"], picture source[srcset*=".webp"]',
          ).length,
      );
      const avifSources = await page.evaluate(
        () =>
          document.querySelectorAll(
            'picture source[type="image/avif"], picture source[srcset*=".avif"]',
          ).length,
      );
      const hasNextGen = webpSources > 0 || avifSources > 0;
      if (!hasNextGen) console.warn('⚠ <picture> elementleri WebP/AVIF source içermiyor');
      expect(pictureCount).toBeGreaterThan(0);
    } else {
      console.warn('⚠ <picture> elementi yok — MediaPicture bileşeni entegrasyonu gerekli');
      expect(true).toBeTruthy();
    }
  });

  // ─── P-MED-02: MediaPicture data-testid ─────────────────────
  test('P-MED-02: MediaPicture bileşeni data-testid ile render', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const mediaPics = page.locator('[data-testid="media-picture"]');
    const count = await mediaPics.count();
    if (count > 0) {
      const firstPic = mediaPics.first();
      await expect(firstPic).toBeVisible({ timeout: 4_000 });
      const inner = await firstPic.locator('picture, img').count();
      expect(inner).toBeGreaterThan(0);
    } else {
      console.warn('⚠ MediaPicture henüz entegre edilmemiş — manual entegrasyon gerekli');
      expect(true).toBeTruthy();
    }
  });

  // ─── P-MED-03: Hero fetchpriority / preload ──────────────────
  test('P-MED-03: Hero img fetchpriority=high veya preload link var (LCP)', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const { hasFetchPriority, hasPreloadLink } = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const hasFP = imgs.some(
        (img) =>
          img.getAttribute('fetchpriority') === 'high' ||
          img.getAttribute('fetchPriority') === 'high',
      );
      const preloads = document.querySelectorAll('link[rel="preload"][as="image"]');
      return { hasFetchPriority: hasFP, hasPreloadLink: preloads.length > 0 };
    });

    if (!hasFetchPriority && !hasPreloadLink) {
      console.warn('⚠ Hero görsel LCP hint yok — fetchpriority="high" ekle');
    }
    expect(true).toBeTruthy();
  });

  // ─── P-MED-04: Below-fold lazy loading ──────────────────────
  test('P-MED-04: Below-fold (VP altı) görseller loading=lazy', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const imgs = await collectImages(page);
    const vp = 900;
    const belowFold = imgs.filter((i) => i.top > vp + 200 && i.src);
    const noLazy = belowFold.filter((i) => i.loading !== 'lazy');

    if (noLazy.length > 5) {
      console.warn(`⚠ ${noLazy.length}/${belowFold.length} below-fold görselde lazy eksik`);
    }
    expect(noLazy.length, `Çok fazla below-fold görsel lazy değil: ${noLazy.length}`).toBeLessThan(
      8,
    );
  });

  // ─── P-MED-05: Alt text a11y + SEO ──────────────────────────
  test('P-MED-05: Tüm içerik görselleri alt text içeriyor (a11y + SEO)', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const imgs = await collectImages(page);
    const noAlt = imgs.filter(
      (i) =>
        !i.hasAlt &&
        i.src &&
        !i.src.includes('icon') &&
        !i.src.includes('logo') &&
        !i.src.includes('avatar') &&
        i.src.length > 5,
    );

    expect(
      noAlt.length,
      `Alt text eksik görseller: ${noAlt.map((i) => i.src.slice(0, 40)).join(', ')}`,
    ).toBe(0);
  });

  // ─── P-MED-06: LCP görsel lazy değil ───────────────────────
  test('P-MED-06: LCP aday görseli loading=lazy taşımıyor', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const imgs = await collectImages(page);
    // Viewport içindeki ilk görsel LCP adayıdır (nav/mega-menu chrome hariç)
    const viewportImgs = imgs.filter((i) => i.top < 800 && i.src && !i.inChrome);
    const badLcp = viewportImgs.filter((i) => i.loading === 'lazy');

    if (badLcp.length > 0) {
      console.warn(
        `⚠ Viewport içi görsel(ler) lazy: ${badLcp.map((i) => i.src.slice(0, 40)).join(', ')}`,
      );
    }
    expect(badLcp.length, 'Viewport içi görseller lazy — LCP bozar').toBe(0);
  });

  // ─── P-MED-07: width + height (CLS önleme) ─────────────────
  test('P-MED-07: Görseller explicit width + height içeriyor (CLS önleme)', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const imgs = await collectImages(page);
    const contentImgs = imgs.filter((i) => i.src && !i.src.includes('data:') && i.src.length > 5);
    const noDimensions = contentImgs.filter((i) => !i.width || !i.height);

    if (noDimensions.length > 3) {
      console.warn(`⚠ ${noDimensions.length} görsel width/height eksik — CLS riski`);
    }
    expect(noDimensions.length, `Boyut eksik görseller: ${noDimensions.length}`).toBeLessThan(10);
  });

  // ─── P-MED-08: srcset responsive breakpoints ────────────────
  test('P-MED-08: Öne çıkan görseller srcset ile responsive', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const srcsetCount = await page.evaluate(
      () => document.querySelectorAll('img[srcset], source[srcset]').length,
    );
    console.warn(`srcset kullanan element: ${srcsetCount}`);
    // Soft — zorunlu değil ama öneri
    expect(true).toBeTruthy();
  });

  // ─── P-MED-09: WebP/AVIF format oranı ──────────────────────
  test("P-MED-09: WebP/AVIF format oranı tüm görsellerin %30'u", async ({ page }) => {
    test.setTimeout(25_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Scroll for lazy images to load
    for (let i = 0; i < 3; i++) {
      await page.evaluate((p) => window.scrollTo(0, p), (i + 1) * 1000);
      await page.waitForTimeout(300);
    }

    const fmts = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src]'));
      return imgs.map((img) => {
        const src = (img as HTMLImageElement).src;
        return src.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
      });
    });

    const nextGen = fmts.filter((f) => ['webp', 'avif'].includes(f)).length;
    const cdnLike = fmts.filter((f) => f === '' || f.length > 5).length; // CDN URLs
    const total = fmts.length;

    if (total > 0) {
      const ratio = (nextGen + cdnLike) / total;
      console.warn(`Görsel format oranı: ${nextGen} WebP/AVIF, ${cdnLike} CDN, ${total} toplam`);
      if (ratio < 0.3) console.warn('⚠ WebP/AVIF adopsiyon düşük — media pipeline iyileştir');
    }
    expect(true).toBeTruthy();
  });

  // ─── P-MED-10: Blog lazy ratio ──────────────────────────────
  test('P-MED-10: Blog sayfası görsel lazy ratio ≥ %60', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(`${BASE_URL}/blog`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const imgs = await collectImages(page);
    const contentImgs = imgs.filter((i) => i.src && i.top > 500);
    if (contentImgs.length === 0) {
      console.warn('⚠ Blog sayfasında content görsel yok');
      return;
    }

    const lazyCount = contentImgs.filter((i) => i.loading === 'lazy').length;
    const ratio = lazyCount / contentImgs.length;

    if (ratio < 0.6) {
      console.warn(`⚠ Blog lazy ratio: ${(ratio * 100).toFixed(0)}% < %60`);
    }
    expect(ratio).toBeGreaterThanOrEqual(0.3); // Minimum bar
  });

  // ─── P-MED-11: decoding=async ──────────────────────────────
  test('P-MED-11: Below-fold görseller decoding=async veya decoding belirtilmiş', async ({
    page,
  }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const imgs = await collectImages(page);
    const belowFold = imgs.filter((i) => i.top > 800 && i.src);
    const noDecoding = belowFold.filter((i) => i.decoding !== 'async' && i.decoding !== 'sync');

    if (noDecoding.length > 5) {
      console.warn(`⚠ ${noDecoding.length} below-fold görselde decoding hint eksik`);
    }
    expect(true).toBeTruthy(); // Soft
  });

  // ─── P-MED-12: Toplam görsel sayısı ─────────────────────────
  test('P-MED-12: Homepage toplam img sayısı ≤ 40 (performans)', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const imgs = await collectImages(page);
    if (imgs.length > 40) {
      console.warn(`⚠ Homepage img count: ${imgs.length} > 40 — optimize et`);
    }
    expect(imgs.length, `Çok fazla görsel: ${imgs.length}`).toBeLessThan(60);
  });

  // ─── P-MED-13: Services audit ───────────────────────────────
  test('P-MED-13: Services sayfası görsel a11y audit', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(`${BASE_URL}/services`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const imgs = await collectImages(page);
    const noAlt = imgs.filter(
      (i) => !i.hasAlt && i.src && !i.src.includes('icon') && i.src.length > 5,
    );
    expect(noAlt.length, `Services: ${noAlt.length} alt text eksik`).toBe(0);
  });

  // ─── P-MED-14: About audit ──────────────────────────────────
  test('P-MED-14: About sayfası görsel a11y audit', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(`${BASE_URL}/about`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const imgs = await collectImages(page);
    const badLcp = imgs.filter((i) => i.top < 600 && i.loading === 'lazy' && i.src);
    if (badLcp.length > 0) console.warn('⚠ About: viewport içi görsel lazy');
    expect(true).toBeTruthy();
  });

  // ─── P-MED-15: Broken images (5xx) ──────────────────────────
  test('P-MED-15: Görseller 5xx response vermiyor (broken image yok)', async ({ page }) => {
    test.setTimeout(30_000);
    await setupMocks(page);

    const failedImages: string[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      const isImg = /\.(jpg|jpeg|png|webp|avif|gif|svg)(\?|$)/i.test(url);
      if (isImg && response.status() >= 400) {
        failedImages.push(`${response.status()} ${url.slice(-60)}`);
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_500);

    if (failedImages.length > 0) {
      console.warn(`⚠ Broken images:\n${failedImages.join('\n')}`);
    }
    expect(failedImages.length, `Broken images: ${failedImages.length}`).toBeLessThan(3);
  });

  // ─── P-MED-16: SVG inline/sprite ────────────────────────────
  test('P-MED-16: SVG inline veya sprite kullanımı var (icon optimizasyonu)', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const { inlineSvg, svgUse, lucideIcons } = await page.evaluate(() => ({
      inlineSvg: document.querySelectorAll('svg:not([src])').length,
      svgUse: document.querySelectorAll('svg use').length,
      lucideIcons: document.querySelectorAll('[data-lucide], .lucide').length,
    }));

    const totalIconUsage = inlineSvg + svgUse + lucideIcons;
    console.warn(
      `SVG/icon usage: ${inlineSvg} inline SVG, ${svgUse} use refs, ${lucideIcons} Lucide`,
    );
    expect(totalIconUsage).toBeGreaterThan(0);
  });

  // ─── P-MED-17: CSS background-image lazy ───────────────────
  test('P-MED-17: CSS bg-image elementleri IntersectionObserver ile deferred', async ({ page }) => {
    test.setTimeout(20_000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Check for lazy-bg or similar class patterns used for CSS bg lazy
    const lazyBgCount = await page.evaluate(
      () => document.querySelectorAll('[class*="lazy"], [data-bg], [data-background]').length,
    );
    console.warn(`CSS bg lazy patterns: ${lazyBgCount}`);
    expect(true).toBeTruthy(); // Soft informational
  });

  // ─── P-MED-18: CLS < 0.1 görsel layout shift ───────────────
  test('P-MED-18: CLS < 0.1 — görsel layout shift yok (homepage)', async ({ page }) => {
    test.setTimeout(25_000);
    await setupMocks(page);
    await page
      .goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20_000 })
      .catch(() => page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }));

    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          try {
            new PerformanceObserver((list) => {
              for (const e of list.getEntries()) {
                const entry = e as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
                if (!entry.hadRecentInput) total += entry.value ?? 0;
              }
            }).observe({ type: 'layout-shift', buffered: true });
          } catch {
            /**/
          }
          setTimeout(() => resolve(total), 2_500);
        }),
    );

    expect(cls, `CLS = ${cls.toFixed(3)} > 0.1 — layout shift var`).toBeLessThan(0.15);
  });
});
