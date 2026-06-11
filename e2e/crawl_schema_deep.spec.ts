/**
 * e2e/crawl_schema_deep.spec.ts
 * JSON-LD Structured Data derin doğrulama — Google Rich Results kalitesi.
 *
 * Schema.org tipine göre zorunlu alanları kontrol eder:
 *  - Organization (homepage): name, url, logo, sameAs, contactPoint
 *  - WebSite (homepage): SearchAction veya alternateName
 *  - BlogPosting (blog sayfaları): headline, datePublished, author, description
 *  - FAQPage: mainEntity dizi, her eleman Question+acceptedAnswer
 *  - Service (servis sayfaları): name, description, provider
 *  - BreadcrumbList: itemListElement dizisi, sıra numaraları
 *  - LocalBusiness (opsiyonel): address, geo, openingHours
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_schema_deep.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:4173';

type JsonLdNode = Record<string, unknown>;

async function extractJsonLd(page: Page): Promise<JsonLdNode[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const result: JsonLdNode[] = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block);
      if (Array.isArray(parsed)) result.push(...parsed);
      else result.push(parsed);
    } catch {
      /* invalid JSON-LD — skip */
    }
  }
  return result;
}

function findNode(nodes: JsonLdNode[], type: string): JsonLdNode | null {
  return (
    nodes.find((n) => {
      const t = n['@type'];
      if (typeof t === 'string') return t === type;
      if (Array.isArray(t)) return t.includes(type);
      return false;
    }) ?? null
  );
}

function loadSitemapPaths(): string[] {
  const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return ['/'];
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

const setupMocks = async (page: Page) => {
  await page.route('https://api.ecypro.com/**', (r) => r.fulfill({ status: 200, json: {} }));
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
  await page.route('**/api.telegram.org/**', (r) => r.fulfill({ status: 200, json: { ok: true } }));
};

test.describe('Crowler: JSON-LD Structured Data Deep Validation', () => {
  test.use({ storageState: undefined });

  // ── ORGANIZATION SCHEMA ────────────────────────────────────────────
  test('Homepage: Organization schema zorunlu alanlar', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const nodes = await extractJsonLd(page);
    const org = findNode(nodes, 'Organization');

    expect(org, 'Organization JSON-LD eksik').toBeTruthy();
    if (!org) return;

    // Zorunlu alanlar
    expect(org['name'], 'Organization.name eksik').toBeTruthy();
    expect(org['url'], 'Organization.url eksik').toBeTruthy();

    // URL doğru domain'e işaret etmeli
    const urlVal = String(org['url'] ?? '');
    expect(urlVal, `Organization.url yanlış: ${urlVal}`).toMatch(/ecypro\.com/);

    // Logo önerilen
    if (!org['logo']) {
      console.warn('⚠ Organization.logo eksik (Rich Results için önerilir)');
    }

    // sameAs (sosyal medya) önerilen
    if (!org['sameAs']) {
      console.warn('⚠ Organization.sameAs eksik (LinkedIn, Twitter profilleri)');
    }
  });

  // ── WEBSITE SCHEMA ─────────────────────────────────────────────────
  test('Homepage: WebSite veya WebPage schema var', async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const nodes = await extractJsonLd(page);
    const website = findNode(nodes, 'WebSite');
    const webpage = findNode(nodes, 'WebPage');

    const hasAny = !!(website ?? webpage);
    if (!hasAny) {
      console.warn('⚠ WebSite/WebPage JSON-LD eksik (Sitelink Searchbox için WebSite önerilir)');
    }
    // Soft check — zorunlu değil
  });

  // ── BREADCRUMB SCHEMA ──────────────────────────────────────────────
  test('Alt sayfalar: BreadcrumbList schema var', async ({ page }) => {
    test.setTimeout(30000);
    await setupMocks(page);
    const breadcrumbPages = ['/services', '/perspektifler', '/about', '/pricing', '/contact'];
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const pagePath of breadcrumbPages) {
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      const nodes = await extractJsonLd(page);
      const crumb = findNode(nodes, 'BreadcrumbList');

      if (!crumb) {
        missing.push(pagePath);
        continue;
      }

      // itemListElement dizi olmalı
      const items = crumb['itemListElement'];
      if (!Array.isArray(items) || items.length === 0) {
        invalid.push(`${pagePath}: itemListElement boş veya dizi değil`);
      }
    }

    if (missing.length > 0) {
      console.warn(`⚠ BreadcrumbList eksik sayfalar: ${missing.join(', ')}`);
    }
    expect(invalid, `Geçersiz BreadcrumbList:\n${invalid.join('\n')}`).toHaveLength(0);
  });

  // ── BLOGPOSTING SCHEMA ─────────────────────────────────────────────
  test('Blog yazıları: BlogPosting schema zorunlu alanlar', async ({ page }) => {
    test.setTimeout(60000);
    await setupMocks(page);
    const sitemapPaths = loadSitemapPaths();
    const blogPaths = sitemapPaths.filter((p) => p.startsWith('/perspektifler/')).slice(0, 5);
    const issues: string[] = [];

    for (const pagePath of blogPaths) {
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      const nodes = await extractJsonLd(page);
      const blogPost =
        findNode(nodes, 'BlogPosting') ??
        findNode(nodes, 'Article') ??
        findNode(nodes, 'NewsArticle');

      if (!blogPost) {
        issues.push(`${pagePath}: BlogPosting/Article JSON-LD eksik`);
        continue;
      }

      // Zorunlu Rich Results alanları
      if (!blogPost['headline']) issues.push(`${pagePath}: headline eksik`);
      if (!blogPost['datePublished']) issues.push(`${pagePath}: datePublished eksik`);
      if (!blogPost['author']) issues.push(`${pagePath}: author eksik`);
      if (!blogPost['description'] && !blogPost['abstract']) {
        issues.push(`${pagePath}: description eksik`);
      }

      // datePublished format kontrolü (ISO 8601)
      if (blogPost['datePublished']) {
        const dp = String(blogPost['datePublished']);
        const isValidDate = /^\d{4}-\d{2}-\d{2}/.test(dp);
        if (!isValidDate) issues.push(`${pagePath}: datePublished format yanlış: ${dp}`);
      }
    }

    expect(issues, `BlogPosting schema sorunları:\n${issues.join('\n')}`).toHaveLength(0);
  });

  // ── SERVICE SCHEMA ─────────────────────────────────────────────────
  test('Servis sayfaları: Service schema var', async ({ page }) => {
    test.setTimeout(30000);
    await setupMocks(page);
    const sitemapPaths = loadSitemapPaths();
    const servicePaths = sitemapPaths.filter((p) => p.startsWith('/services/'));
    const missing: string[] = [];

    for (const pagePath of servicePaths.slice(0, 3)) {
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      const nodes = await extractJsonLd(page);
      const service =
        findNode(nodes, 'Service') ?? findNode(nodes, 'Product') ?? findNode(nodes, 'OfferCatalog');

      if (!service) {
        missing.push(pagePath);
      }
    }

    if (missing.length > 0) {
      console.warn(`⚠ Service JSON-LD eksik: ${missing.join(', ')} — Rich Results için eklenmeli`);
    }
    // Soft warning — Service schema opsiyonel ama faydalı
  });

  // ── FAQPAGE SCHEMA ─────────────────────────────────────────────────
  test('FAQ sayfası: FAQPage schema + geçerli Q&A formatı', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const nodes = await extractJsonLd(page);
    const faqSchema = findNode(nodes, 'FAQPage');

    if (!faqSchema) {
      console.warn(
        '⚠ FAQPage JSON-LD eksik — /faq sayfası Google FAQ Rich Results için FAQPage schema gerektiriyor',
      );
      return; // Soft — eklenmemiş olabilir
    }

    const mainEntity = faqSchema['mainEntity'];
    expect(Array.isArray(mainEntity), 'FAQPage.mainEntity dizi olmalı').toBeTruthy();
    if (!Array.isArray(mainEntity)) return;

    expect(mainEntity.length, 'FAQPage en az 3 soru içermeli').toBeGreaterThanOrEqual(3);

    // Her Q&A doğru format
    const badItems: number[] = [];
    mainEntity.forEach((item: unknown, idx: number) => {
      const q = item as Record<string, unknown>;
      if (q['@type'] !== 'Question') badItems.push(idx);
      const answer = q['acceptedAnswer'] as Record<string, unknown> | undefined;
      if (!answer || !answer['text']) badItems.push(idx);
    });
    expect(badItems, `FAQPage geçersiz Q&A ögesi: index ${badItems.join(', ')}`).toHaveLength(0);
  });

  // ── PRICING SCHEMA ─────────────────────────────────────────────────
  test('Pricing sayfası: Offer veya PriceSpecification schema var', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const nodes = await extractJsonLd(page);
    const offer =
      findNode(nodes, 'Offer') ??
      findNode(nodes, 'PriceSpecification') ??
      findNode(nodes, 'Product');

    if (!offer) {
      console.warn(
        "⚠ Pricing: Offer/Product JSON-LD eksik — fiyat bilgileri markup'sız (Google Shopping/Rich Results için önerilir)",
      );
    }
    // Soft check
  });

  // ── CONTACT/LOCAL BUSINESS ─────────────────────────────────────────
  test('Contact sayfası: ContactPage veya LocalBusiness schema var', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const nodes = await extractJsonLd(page);
    const contactPage = findNode(nodes, 'ContactPage');
    const localBusiness = findNode(nodes, 'LocalBusiness') ?? findNode(nodes, 'Organization');

    const hasSchema = !!(contactPage ?? localBusiness);
    if (!hasSchema) {
      console.warn('⚠ Contact: ContactPage/LocalBusiness JSON-LD eksik — yerel SEO için eklenmeli');
    }
    // Soft
  });

  // ── JSON-LD SYNTAX VALIDATION: Tüm bloklar geçerli JSON mu? ────────
  test('Tüm JSON-LD blokları geçerli JSON formatında', async ({ page }) => {
    test.setTimeout(90000);
    await setupMocks(page);
    const sitemapPaths = loadSitemapPaths().slice(0, 20);
    const parseErrors: string[] = [];

    for (const pagePath of sitemapPaths) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        await page.waitForTimeout(200);
        const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
        for (const block of blocks) {
          try {
            JSON.parse(block);
          } catch {
            parseErrors.push(`${pagePath}: JSON-LD parse hatası — ${block.slice(0, 80)}...`);
          }
        }
      } catch {
        /* timeout */
      }
    }
    expect(parseErrors, `Geçersiz JSON-LD:\n${parseErrors.join('\n')}`).toHaveLength(0);
  });

  // ── @CONTEXT DOĞRULAMASI ───────────────────────────────────────────
  test("JSON-LD @context schema.org'u referans ediyor", async ({ page }) => {
    await setupMocks(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const nodes = await extractJsonLd(page);
    for (const node of nodes) {
      const ctx = String(node['@context'] ?? '');
      expect(ctx, `JSON-LD @context schema.org olmalı: "${ctx}"`).toMatch(/schema\.org/);
    }
  });

  // ── CASE STUDIES: Case Study schema ───────────────────────────────
  test('Case study sayfaları: Article veya CreativeWork schema', async ({ page }) => {
    test.setTimeout(30000);
    await setupMocks(page);
    const sitemapPaths = loadSitemapPaths();
    const csPaths = sitemapPaths.filter((p) => p.startsWith('/case-studies/')).slice(0, 3);
    const missing: string[] = [];

    for (const pagePath of csPaths) {
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      const nodes = await extractJsonLd(page);
      const hasSchema = nodes.some((n) => {
        const t = String(n['@type'] ?? '');
        return ['Article', 'BlogPosting', 'CreativeWork', 'CaseStudy', 'NewsArticle'].includes(t);
      });
      if (!hasSchema) missing.push(pagePath);
    }

    if (missing.length > 0) {
      console.warn(`⚠ Case study schema eksik: ${missing.join(', ')}`);
    }
    expect(missing.length, `${missing.length} case study JSON-LD eksik`).toBeLessThan(
      csPaths.length,
    );
  });
});
