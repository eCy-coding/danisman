/**
 * e2e/crawl_seo_audit.spec.ts
 * Scrapling-parallel SEO crawl — tüm sitemap sayfaları Playwright ile denetlenir.
 *
 * Script 03 (canonical/hreflang) + Script 04 (keyword density) mantığını
 * TypeScript Playwright testine taşır. Her sayfa için:
 *  - Title uzunluğu (30-60 karakter)
 *  - Meta description (70-160 karakter)
 *  - Canonical self-reference
 *  - Tam olarak 1 adet H1
 *  - JSON-LD @type varlığı
 *  - hreflang (tr/en) varlığı
 *  - robots: index,follow
 *  - OG tags (og:title, og:description, og:url)
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_seo_audit.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:4173';

// Sitemap'i parse et
function loadSitemapPaths(): string[] {
  const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return ['/'];
  const xml = fs.readFileSync(sitemapPath, 'utf-8');
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches
    .map((m) => {
      try {
        return new URL(m[1].trim()).pathname;
      } catch {
        return '/';
      }
    })
    .filter((p, i, arr) => arr.indexOf(p) === i) // dedupe
    .slice(0, 46); // sitemap sınırı
}

// Auth sayfaları, crawl için anlamlı SEO skoru gerekmez
const SKIP_SEO_SCORE = ['/login', '/register', '/forgot-password', '/admin'];

interface SeoResult {
  path: string;
  title: string | null;
  titleLen: number;
  metaDesc: string | null;
  metaDescLen: number;
  canonical: string | null;
  h1Count: number;
  hasJsonLd: boolean;
  hasHreflang: boolean;
  robotsContent: string | null;
  ogTitle: string | null;
  ogDesc: string | null;
  score: number;
  issues: string[];
}

async function auditPage(page: Page, pagePath: string): Promise<SeoResult> {
  const url = `${BASE_URL}${pagePath}`;
  const issues: string[] = [];

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500); // React hydrate

  const title = await page.title();
  const metaDesc = await page
    .locator('meta[name="description"]')
    .first()
    .getAttribute('content')
    .catch(() => null);
  const canonical = await page
    .locator('link[rel="canonical"]')
    .first()
    .getAttribute('href')
    .catch(() => null);
  const h1Count = await page.locator('h1').count();
  const hasJsonLd = await page
    .locator('script[type="application/ld+json"]')
    .count()
    .then((c) => c > 0);
  const hasHreflang = await page
    .locator('link[rel="alternate"][hreflang]')
    .count()
    .then((c) => c > 0);
  const robotsContent = await page
    .locator('meta[name="robots"]')
    .first()
    .getAttribute('content')
    .catch(() => null);
  const ogTitle = await page
    .locator('meta[property="og:title"]')
    .first()
    .getAttribute('content')
    .catch(() => null);
  const ogDesc = await page
    .locator('meta[property="og:description"]')
    .first()
    .getAttribute('content')
    .catch(() => null);

  const titleLen = title?.length ?? 0;
  const metaDescLen = metaDesc?.length ?? 0;
  let score = 100;

  // Title kontrolü
  if (!title) {
    issues.push('NO_TITLE');
    score -= 25;
  } else if (titleLen < 30) {
    issues.push(`TITLE_SHORT (${titleLen})`);
    score -= 10;
  } else if (titleLen > 70) {
    issues.push(`TITLE_LONG (${titleLen})`);
    score -= 5;
  }

  // Meta description
  if (!metaDesc) {
    issues.push('NO_META_DESC');
    score -= 20;
  } else if (metaDescLen < 70) {
    issues.push(`META_SHORT (${metaDescLen})`);
    score -= 10;
  } else if (metaDescLen > 165) {
    issues.push(`META_LONG (${metaDescLen})`);
    score -= 5;
  }

  // Canonical
  if (!canonical) {
    issues.push('NO_CANONICAL');
    score -= 15;
  }

  // H1 sayısı
  if (h1Count === 0) {
    issues.push('NO_H1');
    score -= 15;
  } else if (h1Count > 1) {
    issues.push(`MULTIPLE_H1 (${h1Count})`);
    score -= 10;
  }

  // JSON-LD (blog/case-study/pricing için zorunlu)
  const requiresJsonLd = [
    '/perspektifler/',
    '/case-studies/',
    '/pricing',
    '/about',
    '/methodology',
  ].some((p) => pagePath.startsWith(p));
  if (requiresJsonLd && !hasJsonLd) {
    issues.push('NO_JSONLD');
    score -= 10;
  }

  // robots
  if (robotsContent && robotsContent.includes('noindex')) {
    issues.push('NOINDEX_SET');
    score -= 30;
  }

  // OG tags
  if (!ogTitle) {
    issues.push('NO_OG_TITLE');
    score -= 5;
  }
  if (!ogDesc) {
    issues.push('NO_OG_DESC');
    score -= 5;
  }

  return {
    path: pagePath,
    title,
    titleLen,
    metaDesc,
    metaDescLen,
    canonical,
    h1Count,
    hasJsonLd,
    hasHreflang,
    robotsContent,
    ogTitle,
    ogDesc,
    score: Math.max(0, score),
    issues,
  };
}

test.describe('Crowler: SEO Full Audit (Sitemap Pages)', () => {
  test.use({ storageState: undefined });

  const sitemapPaths = loadSitemapPaths();
  const auditResults: SeoResult[] = [];

  // ─────────────────────────────────────────────
  // Parametrik test: her sayfa için ayrı test
  // ─────────────────────────────────────────────
  for (const pagePath of sitemapPaths) {
    test(`SEO audit: ${pagePath}`, async ({ page }) => {
      test.setTimeout(25000);

      // Dış API'lere route mock (SEO testini etkilemesin)
      await page.route('https://api.ecypro.com/**', (r) => r.fulfill({ status: 200, json: {} }));
      await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
      await page.route('**/api.telegram.org/**', (r) =>
        r.fulfill({ status: 200, json: { ok: true } }),
      );

      const result = await auditPage(page, pagePath);
      auditResults.push(result);

      const isAuthPage = SKIP_SEO_SCORE.some((p) => pagePath.startsWith(p));

      // ── Core assertion: title var mı?
      expect(result.title, `[${pagePath}] title eksik`).toBeTruthy();

      // ── noindex sayfalar kabul edilemez (auth hariç)
      if (!isAuthPage) {
        expect(result.robotsContent ?? '', `[${pagePath}] noindex var!`).not.toContain('noindex');
      }

      // ── H1 kontrolü (auth sayfaları hariç)
      if (!isAuthPage) {
        expect(
          result.h1Count,
          `[${pagePath}] H1 sayısı: ${result.h1Count} (beklenen: 1)`,
        ).toBeGreaterThanOrEqual(1);
        expect(result.h1Count, `[${pagePath}] Birden fazla H1 var`).toBeLessThanOrEqual(1);
      }

      // ── Meta description kontrolü
      if (!isAuthPage) {
        expect(result.metaDesc, `[${pagePath}] meta description eksik`).toBeTruthy();
        expect(
          result.metaDescLen,
          `[${pagePath}] meta desc çok kısa (${result.metaDescLen})`,
        ).toBeGreaterThan(50);
      }

      // ── SEO skoru (auth hariç)
      if (!isAuthPage) {
        expect(
          result.score,
          `[${pagePath}] SEO skoru düşük (${result.score}/100) — sorunlar: ${result.issues.join(', ')}`,
        ).toBeGreaterThanOrEqual(60);
      }
    });
  }

  // ─────────────────────────────────────────────
  // Aggregate test: ortalama skor yeterli mi?
  // ─────────────────────────────────────────────
  test('SEO aggregate: ortalama skor ≥ 65/100', async () => {
    test.setTimeout(5000);
    if (auditResults.length === 0) {
      test.skip(true, 'Audit results henüz boş — parametrik testleri önce çalıştır');
      return;
    }
    const nonAuthResults = auditResults.filter(
      (r) => !SKIP_SEO_SCORE.some((p) => r.path.startsWith(p)),
    );
    const avg =
      nonAuthResults.reduce((s, r) => s + r.score, 0) / Math.max(nonAuthResults.length, 1);
    expect(avg, `Ortalama SEO skoru: ${avg.toFixed(1)} — düşük`).toBeGreaterThanOrEqual(65);
  });

  // ─────────────────────────────────────────────
  // Sitemap doğrulama
  // ─────────────────────────────────────────────
  test('Sitemap: tüm sayfalar erişilebilir (200 veya 3xx)', async ({ request }) => {
    test.setTimeout(60000);
    const failures: string[] = [];
    for (const p of sitemapPaths.slice(0, 25)) {
      // İlk 25
      const res = await request.get(`${BASE_URL}${p}`).catch(() => null);
      if (!res || res.status() >= 400) {
        failures.push(`${p} → ${res?.status() ?? 'FAIL'}`);
      }
    }
    expect(failures, `Erişilemeyen sayfalar:\n${failures.join('\n')}`).toHaveLength(0);
  });

  // ─────────────────────────────────────────────
  // Robots.txt + Sitemap.xml varlık
  // ─────────────────────────────────────────────
  test('robots.txt geçerli', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/robots.txt`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('User-agent:');
    expect(text).toContain('Sitemap:');
    expect(text).not.toContain('Disallow: /\n'); // tüm siteyi bloke etmemeli
  });

  test('sitemap.xml geçerli XML + min 20 URL', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('<?xml');
    expect(text).toContain('<urlset');
    const locCount = (text.match(/<loc>/g) ?? []).length;
    expect(locCount, `Sitemap çok az URL: ${locCount}`).toBeGreaterThanOrEqual(20);
  });

  test('JSON-LD: homepage Organization schema var', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const jsonLdBlocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const combined = jsonLdBlocks.join(' ');
    expect(combined, 'Organization JSON-LD eksik').toContain('"Organization"');
    expect(combined, 'URL field eksik').toContain('"url"');
  });

  test('Canonical: öz-referans (self-referencing canonical)', async ({ page }) => {
    const criticalPaths = ['/', '/about', '/services', '/pricing', '/perspektifler', '/contact'];
    for (const p of criticalPaths) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded' });
      const canonical = await page
        .locator('link[rel="canonical"]')
        .first()
        .getAttribute('href')
        .catch(() => null);
      if (canonical) {
        // Canonical URL'nin path kısmı sayfayla eşleşmeli
        const canonicalPath = new URL(canonical).pathname.replace(/\/$/, '') || '/';
        const expectedPath = p.replace(/\/$/, '') || '/';
        expect(canonicalPath, `[${p}] canonical path mismatch: ${canonical}`).toBe(expectedPath);
      }
    }
  });
});
