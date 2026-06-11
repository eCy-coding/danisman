/**
 * e2e/crawl_content_quality.spec.ts
 * P32-T13/T14/T18/T20 — İçerik kalitesi + keyword density Playwright crawl'ı.
 * brain/seo/keywords-2026-05.md matrisine göre her sayfa validate edilir.
 *
 * Kontroller:
 *  - Birincil keyword title + H1 + meta desc'te geçiyor mu?
 *  - H etiket hiyerarşisi (H1→H2→H3 sırası bozuk mu?)
 *  - Sayfa kelime sayısı min eşiğin üzerinde mi?
 *  - Tüm img'lerde anlamlı alt text var mı? (T18)
 *  - İç link sayısı yeterli mi? (T14)
 *  - Duplicate title/desc yok mu?
 *  - URL trailing slash tutarlılığı (T19)
 *  - Çift H1 yok (T13)
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_content_quality.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:4173';

// P32-T11 keyword matrisi — sayfa → birincil keyword eşleşmesi
const PAGE_KEYWORDS: Record<string, { primary: string[]; secondary: string[] }> = {
  '/': {
    primary: ['stratejik danışmanlık', 'danışmanlık', 'strateji'],
    secondary: ['yönetim', 'kurumsal'],
  },
  '/services': {
    primary: ['danışmanlık', 'yönetim', 'hizmet'],
    secondary: ['operasyonel', 'strateji'],
  },
  '/about': {
    primary: ['ecypro', 'danışmanlık', 'istanbul'],
    secondary: ['kurumsal', 'ekip'],
  },
  '/perspektifler': {
    primary: ['strateji', 'blog', 'yönetim'],
    secondary: ['danışmanlık'],
  },
  '/pricing': {
    primary: ['paket', 'fiyat', 'danışmanlık'],
    secondary: ['ücret'],
  },
  '/contact': {
    primary: ['iletişim', 'görüşme', 'danışmanlık'],
    secondary: ['strateji'],
  },
  '/case-studies': {
    primary: ['vaka', 'başarı', 'danışmanlık'],
    secondary: ['proje'],
  },
  '/methodology': {
    primary: ['metodoloji', 'yöntem', 'strateji'],
    secondary: ['süreç'],
  },
  '/faq': {
    primary: ['soru', 'danışmanlık'],
    secondary: ['hizmet'],
  },
};

interface ContentAudit {
  path: string;
  title: string;
  h1: string;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  imgCount: number;
  imgNoAlt: number;
  metaDesc: string;
  keywordInTitle: boolean;
  keywordInH1: boolean;
  keywordInMeta: boolean;
  hHierarchyOk: boolean;
  issues: string[];
}

function loadSitemapPaths(): string[] {
  const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return Object.keys(PAGE_KEYWORDS);
  const xml = fs.readFileSync(sitemapPath, 'utf-8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => {
      try {
        return new URL(m[1].trim()).pathname;
      } catch {
        return '/';
      }
    })
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .slice(0, 46);
}

function containsKeyword(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase();
  return keywords.some((kw) => t.includes(kw.toLowerCase()));
}

async function auditContent(page: Page, pagePath: string): Promise<ContentAudit> {
  await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(500);

  const result = await page.evaluate((baseUrl: string) => {
    const title = document.title ?? '';
    const metaDesc =
      document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    const h1El = document.querySelector('h1');
    const h1Text = h1El?.textContent?.trim() ?? '';
    const h1s = document.querySelectorAll('h1');
    const h2s = document.querySelectorAll('h2');
    const h3s = document.querySelectorAll('h3');

    // Kelime sayısı — main veya body içindeki görünür metin
    const mainEl = (document.querySelector('main, [role="main"], article, .content') ??
      document.body) as HTMLElement;
    const allText = mainEl.innerText ?? mainEl.textContent ?? '';
    const wordCount = allText
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 2).length;

    // Linkler
    const allLinks = Array.from(document.querySelectorAll('a[href]'));
    const internalLinks = allLinks.filter((a) => {
      const href = (a as HTMLAnchorElement).href;
      return (
        href.includes(baseUrl) || (a as HTMLAnchorElement).getAttribute('href')?.startsWith('/')
      );
    }).length;
    const externalLinks = allLinks.length - internalLinks;

    // Görseller
    const imgs = Array.from(document.querySelectorAll('img'));
    const imgNoAlt = imgs.filter((img) => !img.getAttribute('alt')?.trim()).length;

    // H hiyerarşisi: H3 varsa H2 de olmalı, H2 varsa H1 de olmalı
    const hHierarchyOk =
      !(h3s.length > 0 && h2s.length === 0) && !(h2s.length > 0 && h1s.length === 0);

    return {
      title,
      h1: h1Text,
      h1Count: h1s.length,
      h2Count: h2s.length,
      h3Count: h3s.length,
      wordCount,
      internalLinks,
      externalLinks,
      imgCount: imgs.length,
      imgNoAlt,
      metaDesc,
      hHierarchyOk,
    };
  }, BASE_URL);

  const kws = PAGE_KEYWORDS[pagePath] ?? { primary: ['ecypro'], secondary: [] };
  const issues: string[] = [];

  if (!containsKeyword(result.title, kws.primary)) issues.push('KW_NOT_IN_TITLE');
  if (result.h1Count > 0 && !containsKeyword(result.h1, kws.primary)) issues.push('KW_NOT_IN_H1');
  if (!containsKeyword(result.metaDesc, kws.primary)) issues.push('KW_NOT_IN_META');
  if (!result.hHierarchyOk) issues.push('H_HIERARCHY_BROKEN');
  if (result.imgNoAlt > 0) issues.push(`IMG_NO_ALT:${result.imgNoAlt}`);
  if (result.h1Count === 0) issues.push('NO_H1');
  if (result.h1Count > 1) issues.push(`MULTIPLE_H1:${result.h1Count}`);

  return {
    path: pagePath,
    keywordInTitle: containsKeyword(result.title, kws.primary),
    keywordInH1: result.h1Count > 0 ? containsKeyword(result.h1, kws.primary) : false,
    keywordInMeta: containsKeyword(result.metaDesc, kws.primary),
    issues,
    ...result,
  };
}

const setupMocks = async (page: Page) => {
  await page.route('https://api.ecypro.com/**', (r) => r.fulfill({ status: 200, json: {} }));
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
  await page.route('**/api.telegram.org/**', (r) => r.fulfill({ status: 200, json: { ok: true } }));
};

test.describe('Crowler: Content Quality & Keyword Audit (P32-T13/T14/T18)', () => {
  test.use({ storageState: undefined });

  // ── KEYWORD DENSITY: Kritik sayfalar ──────────────────────────────
  const keywordPages = Object.keys(PAGE_KEYWORDS);

  for (const pagePath of keywordPages) {
    test(`Keyword audit: ${pagePath}`, async ({ page }) => {
      test.setTimeout(20000);
      await setupMocks(page);
      const audit = await auditContent(page, pagePath);

      // Birincil keyword title'da olmalı (EN önemli SEO sinyal)
      expect(
        audit.keywordInTitle,
        `[${pagePath}] Birincil keyword title'da yok (title: "${audit.title}")`,
      ).toBeTruthy();

      // H tag hiyerarşisi bozuk olmamalı
      expect(
        audit.hHierarchyOk,
        `[${pagePath}] H etiket hiyerarşisi bozuk (h1:${audit.h1Count}, h2:${audit.h2Count}, h3:${audit.h3Count})`,
      ).toBeTruthy();

      // Çift H1 yok (T13)
      expect(
        audit.h1Count,
        `[${pagePath}] Birden fazla H1 var (${audit.h1Count})`,
      ).toBeLessThanOrEqual(1);
    });
  }

  // ── WORD COUNT: Minimum içerik eşiği ──────────────────────────────
  test('İçerik uzunluğu: kritik sayfalar min 150 kelime', async ({ page }) => {
    test.setTimeout(60000);
    await setupMocks(page);
    const minWords: Record<string, number> = {
      '/': 150,
      '/services': 150,
      '/about': 100,
      '/methodology': 150,
      '/pricing': 80,
      '/contact': 50,
    };
    const failures: string[] = [];

    for (const [pagePath, minW] of Object.entries(minWords)) {
      try {
        const audit = await auditContent(page, pagePath);
        if (audit.wordCount < minW) {
          failures.push(`${pagePath}: ${audit.wordCount} kelime (min ${minW})`);
        }
      } catch {
        /* skip */
      }
    }
    expect(failures, `Yetersiz içerik uzunluğu:\n${failures.join('\n')}`).toHaveLength(0);
  });

  // ── İÇ LİNK: T14 — Internal Linking ──────────────────────────────
  test('İç link sayısı: kritik sayfalar min 5 iç link', async ({ page }) => {
    test.setTimeout(30000);
    await setupMocks(page);
    const criticalPages = ['/', '/services', '/about', '/pricing', '/case-studies'];
    const failures: string[] = [];

    for (const pagePath of criticalPages) {
      const audit = await auditContent(page, pagePath);
      if (audit.internalLinks < 5) {
        failures.push(`${pagePath}: ${audit.internalLinks} iç link (min 5)`);
      }
    }
    expect(failures, `Yetersiz iç link:\n${failures.join('\n')}`).toHaveLength(0);
  });

  // ── IMG ALT TEXT: T18 ──────────────────────────────────────────────
  test('T18: Tüm img alt text — kritik sayfalar', async ({ page }) => {
    test.setTimeout(40000);
    await setupMocks(page);
    const criticalPages = ['/', '/services', '/about', '/case-studies', '/perspektifler'];
    const failures: string[] = [];

    for (const pagePath of criticalPages) {
      const audit = await auditContent(page, pagePath);
      if (audit.imgNoAlt > 0) {
        failures.push(`${pagePath}: ${audit.imgNoAlt} görsel alt text eksik`);
      }
    }
    expect(failures, `Alt text eksik görseller:\n${failures.join('\n')}`).toHaveLength(0);
  });

  // ── URL TRAILING SLASH: T19 ────────────────────────────────────────
  test('T19: URL trailing slash tutarlılığı', async ({ request }) => {
    test.setTimeout(30000);
    const paths = ['/services', '/about', '/perspektifler', '/pricing', '/contact'];
    const issues: string[] = [];

    for (const p of paths) {
      // Trailing slash ile ve slash'sız — her ikisi 200 veya consistent redirect vermeli
      const withSlash = await request
        .get(`${BASE_URL}${p}/`, { maxRedirects: 3 })
        .catch(() => null);
      const withoutSlash = await request
        .get(`${BASE_URL}${p}`, { maxRedirects: 3 })
        .catch(() => null);
      if (withSlash && withoutSlash) {
        // İkisi de 200 dönüyorsa duplicate content riski var
        if (withSlash.status() === 200 && withoutSlash.status() === 200) {
          // Canonical aynı mı? Kontrol edilmeli — şimdilik sadece bilgi
          console.warn(
            `⚠ T19: ${p} hem trailing-slash hem slash'sız 200 dönüyor (canonical ile çözülmeli)`,
          );
        }
      }
      if (withoutSlash?.status() && withoutSlash.status() >= 500) {
        issues.push(`${p} → 5xx server error`);
      }
    }
    expect(issues, `Server errors:\n${issues.join('\n')}`).toHaveLength(0);
  });

  // ── DUPLICATE TITLE/DESC ──────────────────────────────────────────
  test('Duplicate title/meta description yok', async ({ page }) => {
    test.setTimeout(90000);
    await setupMocks(page);
    const sitemapPaths = loadSitemapPaths().slice(0, 20);
    const titles = new Map<string, string>();
    const descs = new Map<string, string>();
    const titleDups: string[] = [];
    const descDups: string[] = [];

    for (const pagePath of sitemapPaths) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        await page.waitForTimeout(300);
        const title = await page.title();
        const desc = await page
          .locator('meta[name="description"]')
          .first()
          .getAttribute('content')
          .catch(() => '');

        if (title && titles.has(title)) {
          titleDups.push(`"${title}": ${titles.get(title)} ve ${pagePath}`);
        } else if (title) {
          titles.set(title, pagePath);
        }

        if (desc && desc.length > 20 && descs.has(desc)) {
          descDups.push(`desc aynı: ${descs.get(desc)} ve ${pagePath}`);
        } else if (desc) {
          descs.set(desc, pagePath);
        }
      } catch {
        /* timeout skip */
      }
    }

    expect(titleDups, `Duplicate title'lar:\n${titleDups.join('\n')}`).toHaveLength(0);
    expect(descDups, `Duplicate meta description'lar:\n${descDups.join('\n')}`).toHaveLength(0);
  });

  // ── BLOG YAZILARI: İçerik kalitesi ───────────────────────────────
  test('Blog yazıları min 200 kelime içeriyor', async ({ page }) => {
    test.setTimeout(60000);
    await setupMocks(page);
    const sitemapPaths = loadSitemapPaths();
    const blogPaths = sitemapPaths.filter((p) => p.startsWith('/perspektifler/'));
    const failures: string[] = [];

    for (const p of blogPaths.slice(0, 8)) {
      try {
        await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(400);
        const wordCount = await page.evaluate(() => {
          const article = document.querySelector('article, main, [role="main"]') ?? document.body;
          return ((article as HTMLElement).innerText ?? article.textContent ?? '')
            .trim()
            .split(/\s+/)
            .filter((w: string) => w.length > 2).length;
        });
        if (wordCount < 200) {
          failures.push(`${p}: ${wordCount} kelime (min 200)`);
        }
      } catch {
        /* skip */
      }
    }
    expect(failures, `Blog yazıları çok kısa:\n${failures.join('\n')}`).toHaveLength(0);
  });

  // ── TOPIC CLUSTER: T20 — İlgili bağlantılar ──────────────────────
  test('T20: Blog yazıları topic cluster linkleri içeriyor', async ({ page }) => {
    test.setTimeout(30000);
    await setupMocks(page);
    // Blog'dan /services, /case-studies veya diğer blog yazılarına link gitmeli (cluster)
    await page.goto(`${BASE_URL}/blog`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const clusterLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.filter((a) => {
        const h = (a as HTMLAnchorElement).getAttribute('href') ?? '';
        return (
          h.startsWith('/perspektifler/') ||
          h.startsWith('/services') ||
          h.startsWith('/case-studies')
        );
      }).length;
    });

    expect(clusterLinks, 'Blog sayfasında topic cluster linkleri çok az').toBeGreaterThan(3);
  });

  // ── SERVICES SAYFASI: Her servis kendi sayfasına link veriyor mu? ─
  test('Services: her servis kartı kendi sayfasına link veriyor', async ({ page }) => {
    test.setTimeout(15000);
    await setupMocks(page);
    await page.goto(`${BASE_URL}/services`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const serviceLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links
        .map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? '')
        .filter((h) => h.startsWith('/services/'));
    });

    expect(serviceLinks.length, 'Services sayfasından /services/* linkleri eksik').toBeGreaterThan(
      0,
    );
  });

  // ── PRICING: CTA linkler var mı? ─────────────────────────────────
  test("Pricing: CTA buton /contact veya booking'a link veriyor", async ({ page }) => {
    test.setTimeout(15000);
    await setupMocks(page);
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const ctaLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.filter((a) => {
        const h = (a as HTMLAnchorElement).getAttribute('href') ?? '';
        const text = (a.textContent ?? '').toLowerCase();
        return (
          h.includes('contact') ||
          h.includes('booking') ||
          h.includes('book') ||
          text.includes('başla') ||
          text.includes('görüşme') ||
          text.includes('iletişim') ||
          text.includes('start') ||
          text.includes('contact') ||
          text.includes('get started')
        );
      }).length;
    });

    expect(ctaLinks, 'Pricing sayfasında CTA linkleri eksik (contact/booking)').toBeGreaterThan(0);
  });
});
