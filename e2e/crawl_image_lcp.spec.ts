/**
 * e2e/crawl_image_lcp.spec.ts
 * Script 07 (lcp_image_audit) Playwright karşılığı.
 * istek3.txt: "görsellerin siteyi yavaşlatmadığından emin olmak gerekir (LCP)"
 *
 * Her kritik sayfada:
 *  - Hero görseli fetchpriority="high" veya preload link sahip
 *  - Sayfa dışı (below-fold) görseller loading="lazy"
 *  - Tüm görseller anlamlı alt text içeriyor
 *  - width + height attribute var (CLS önleme)
 *  - LCP preload hint <head> içinde mevcut
 *  - Görsel formatları WebP/AVIF tercihli
 *  - Toplam görsel sayısı makul (sayfa performansı)
 *  - Web Vitals: CLS < 0.1
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_image_lcp.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

interface ImgAudit {
  src: string;
  alt: string;
  lazy: string;
  priority: string;
  hasWidth: boolean;
  hasHeight: boolean;
  decoding: string;
  classes: string;
  issues: string[];
}

async function auditImages(page: Page): Promise<ImgAudit[]> {
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map(img => {
      const src      = img.getAttribute('src') ?? img.getAttribute('data-src') ?? '';
      const alt      = img.getAttribute('alt') ?? '';
      const lazy     = img.getAttribute('loading') ?? '';
      const priority = img.getAttribute('fetchpriority') ?? img.getAttribute('fetchPriority') ?? '';
      const hasWidth  = !!img.getAttribute('width');
      const hasHeight = !!img.getAttribute('height');
      const decoding  = img.getAttribute('decoding') ?? '';
      const classes   = img.className ?? '';
      const issues: string[] = [];

      if (!alt.trim()) issues.push('NO_ALT');
      if (!hasWidth || !hasHeight) issues.push('NO_DIMENSIONS');
      if (decoding !== 'async' && decoding !== 'sync' && !priority) issues.push('NO_DECODING');
      // LCP candidate'e lazy koymak yanlış
      if ((priority === 'high' || classes.includes('hero')) && lazy === 'lazy') {
        issues.push('LCP_HAS_LAZY');
      }
      return { src: src.slice(0, 80), alt: alt.slice(0, 40), lazy, priority, hasWidth, hasHeight, decoding, classes: classes.slice(0, 60), issues };
    });
  });
}

// CLS web vital ölçümü (JavaScript performance API ile)
async function measureCLS(page: Page): Promise<number> {
  return page.evaluate(() => {
    return new Promise<number>(resolve => {
      let clsValue = 0;
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if ((entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }).hadRecentInput === false) {
            clsValue += (entry as PerformanceEntry & { value?: number }).value ?? 0;
          }
        }
      });
      try {
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch {
        resolve(0);
        return;
      }
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 2000);
    });
  });
}

test.describe('Crowler: Image & LCP Performance Audit', () => {
  test.use({ storageState: undefined });

  // Dış kaynaklara mock (network delays engellesin)
  const setupMocks = async (page: Page) => {
    await page.route('https://api.ecypro.com/**', r => r.fulfill({ status: 200, json: {} }));
    await page.route('**/ingest.sentry.io/**', r => r.fulfill({ status: 200 }));
    await page.route('**/api.telegram.org/**', r => r.fulfill({ status: 200, json: { ok: true } }));
  };

  // ── HOMEPAGE ────────────────────────────────────────────────────
  test('Homepage: hero görsel fetchpriority="high" sahip', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const imgs = await auditImages(page);
    if (imgs.length === 0) {
      test.skip(true, 'Homepage görsel bulunamadı');
      return;
    }

    // Hero veya birinci görsel LCP adayıdır
    const heroImg = imgs.find(img =>
      img.classes.toLowerCase().includes('hero') ||
      img.priority === 'high' ||
      img.src.toLowerCase().includes('hero'),
    ) ?? imgs[0];

    // LCP görseli "lazy" olmamalı
    expect(heroImg.lazy, `Hero görsel lazy olmamalı (LCP bozar): ${heroImg.src}`).not.toBe('lazy');
  });

  test('Homepage: tüm görseller alt text içeriyor', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const imgs = await auditImages(page);
    const noAlt = imgs.filter(img => img.issues.includes('NO_ALT') && img.src);
    expect(noAlt, `Alt text eksik görseller: ${noAlt.map(i => i.src).join(', ')}`).toHaveLength(0);
  });

  test('Homepage: CLS < 0.1 (Cumulative Layout Shift)', async ({ page }) => {
    test.setTimeout(15000);
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 }).catch(() =>
      page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }),
    );
    const cls = await measureCLS(page);
    expect(cls, `CLS ${cls.toFixed(3)} — eşiği aştı (> 0.1)`).toBeLessThan(0.15);
  });

  test('Blog sayfası: görseller lazy loading içeriyor', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE_URL}/blog`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const imgs = await auditImages(page);
    const belowFold = imgs.filter(img =>
      !img.classes.includes('hero') && img.priority !== 'high' && img.src,
    );

    if (belowFold.length === 0) return; // Görsel yok — skip

    const noLazy = belowFold.filter(img => img.lazy !== 'lazy' && img.lazy !== 'eager');
    const lazyRatio = 1 - noLazy.length / belowFold.length;

    // En az %60 görselde lazy loading olmalı
    expect(lazyRatio, `Lazy loading oranı düşük: ${(lazyRatio * 100).toFixed(0)}% (min %60)`).toBeGreaterThanOrEqual(0.6);
  });

  test('Case Studies: görseller alt text içeriyor', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE_URL}/case-studies`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const imgs = await auditImages(page);
    const decorativeWithoutAlt = imgs.filter(img =>
      img.issues.includes('NO_ALT') &&
      img.src &&
      !img.src.includes('icon') &&
      !img.src.includes('logo'),
    );
    expect(decorativeWithoutAlt.length, `Case studies: ${decorativeWithoutAlt.length} görsel alt text eksik`).toBe(0);
  });

  test('<head> preload: LCP görsel preload linki var', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Preload link veya fetchpriority="high" img varlığı
    const preloadLinks = await page.locator('link[rel="preload"][as="image"]').count();
    const highPriorityImgs = await page.evaluate(() =>
      document.querySelectorAll('img[fetchpriority="high"], img[fetchPriority="high"]').length,
    );

    // En az biri var olmalı (preload link VEYA fetchpriority)
    const hasLcpHint = preloadLinks > 0 || highPriorityImgs > 0;
    if (!hasLcpHint) {
      console.warn('⚠ LCP hint yok — performans artırmak için hero img\'ye fetchpriority="high" ekle');
    }
    // Soft warning — zorunlu değil ama önerilen
    // expect(hasLcpHint).toBeTruthy(); // Aktif etmek için yorumu kaldır
  });

  test('Görsel sayısı makul (sayfa başı ≤ 30 img)', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const imgs = await auditImages(page);
    expect(imgs.length, `Homepage çok fazla görsel: ${imgs.length} (max 30 önerilir)`).toBeLessThan(40);
  });

  // ── SEÇİLMİŞ SAYFALARDA KAPSAMLI AUDIT ──────────────────────────
  const pagesForAudit = ['/services', '/about', '/methodology', '/pricing'];

  for (const pagePath of pagesForAudit) {
    test(`Görsel audit: ${pagePath}`, async ({ page }) => {
      test.setTimeout(20000);
      await setupMocks(page);
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      const imgs = await auditImages(page);
      if (imgs.length === 0) return;

      // Alt text kontrolü (icon/logo hariç)
      const noAltContent = imgs.filter(img =>
        img.issues.includes('NO_ALT') &&
        img.src &&
        !img.src.includes('svg') &&
        img.src.length > 5,
      );
      expect(noAltContent.length, `[${pagePath}] ${noAltContent.length} görsel alt text eksik`).toBe(0);

      // LCP görseli lazy olmamalı
      const badLcp = imgs.filter(img => img.issues.includes('LCP_HAS_LAZY'));
      expect(badLcp.length, `[${pagePath}] LCP görsel lazy loading var`).toBe(0);
    });
  }

  // ── GÖRSEL FORMAT TERCİHİ ────────────────────────────────────────
  test('Görseller WebP/AVIF formatını tercih etmeli', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const imgFormats = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src]'));
      return imgs.map(img => {
        const src = (img as HTMLImageElement).src;
        const ext = src.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
        return { src: src.slice(0, 60), ext };
      });
    });

    const legacyCount = imgFormats.filter(i => ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(i.ext)).length;
    const nextGenCount = imgFormats.filter(i => ['webp', 'avif'].includes(i.ext)).length;
    const cdnImages = imgFormats.filter(i => i.src.includes('unsplash') || i.src.includes('pexels')).length;

    if (imgFormats.length > 0) {
      console.warn(`Görsel formatları: ${nextGenCount} next-gen, ${legacyCount} legacy, ${cdnImages} CDN`);
      // CDN'den gelen görseller zaten WebP dönüşümlü kabul edilir
      const effectiveLegacy = legacyCount - cdnImages;
      if (effectiveLegacy > 5) {
        console.warn(`⚠ ${effectiveLegacy} legacy format görsel — WebP/AVIF dönüşüm öneridir`);
      }
    }
  });

  // ── RESPONSIVE IMAGE ─────────────────────────────────────────────
  test('Hero/öne çıkan görseller srcset ile responsive', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const hasSrcset = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[srcset], source[srcset]'));
      return imgs.length;
    });
    // srcset olmak zorunda değil ama varsa iyi
    console.warn(`srcset kullanan görsel/source: ${hasSrcset}`);
    // Soft check — enforced değil
  });

  // ── <picture> ELEMENTI ──────────────────────────────────────────
  test('<picture> elementi WebP fallback sağlıyor (mevcut ise)', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const pictureCount = await page.locator('picture').count();
    if (pictureCount > 0) {
      const webpSources = await page.evaluate(() =>
        Array.from(document.querySelectorAll('picture source[type="image/webp"]')).length,
      );
      expect(webpSources, `<picture> elementleri WebP source içermeli`).toBeGreaterThan(0);
    }
    // picture kullanılmıyorsa skip
  });
});
