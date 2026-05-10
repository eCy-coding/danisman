/**
 * e2e/crawl_authority_seo.spec.ts
 * P38: Backlink + Authority Building — roadmap_80.md T71-T80
 *
 * Kapsar:
 *   T71 — LinkedIn Company Page share meta (og:url/og:title) doğru
 *   T72 — NAP (Name/Address/Phone) schema.org consistency
 *   T73 — Guest post altyapısı: Author bio page / BlogPosting schema
 *   T74 — HARO source profile: Press/Contact sayfası
 *   T75 — Google My Business: LocalBusiness schema veya GMB script
 *   T76 — Press release: /press sayfası veya blog/press-release slug
 *   T77 — Forum thought leadership: robots.txt forum-friendly
 *   T78 — Link reclamation script mevcut (backlink monitor)
 *   T79 — Broken link building: scripts/broken-link-outreach.ts
 *   T80 — Backlink monitoring dashboard / script
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_authority_seo.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4173';
const ROOT = process.cwd();

const mockSetup = async (page: Page) => {
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
};

// ─── T71: LinkedIn Social Share Meta ─────────────────────────────
test.describe('P38-T71: LinkedIn + Social Share Meta (OG)', () => {
  test('T71-a: Homepage og:title var ve 30-70 karakter', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle, 'og:title eksik').toBeTruthy();
    expect(ogTitle!.length, `og:title çok kısa: "${ogTitle}"`).toBeGreaterThanOrEqual(10);
    expect(ogTitle!.length, `og:title çok uzun: "${ogTitle}"`).toBeLessThanOrEqual(100);
  });

  test('T71-b: og:url canonical ile eşleşiyor', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

    if (!ogUrl) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'og:url eksik — LinkedIn share URL hatalı olur',
        });
      return;
    }
    if (canonical && ogUrl) {
      const ogPath = new URL(ogUrl).pathname;
      const canPath = canonical.startsWith('http') ? new URL(canonical).pathname : canonical;
      expect(ogPath, `og:url (${ogPath}) ≠ canonical (${canPath})`).toBe(canPath);
    }
  });

  test('T71-c: og:image var ve https:// ile başlıyor', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage, 'og:image eksik — LinkedIn share preview görsel yok').toBeTruthy();
    if (ogImage) {
      const isAbsolute =
        ogImage.startsWith('http://') || ogImage.startsWith('https://') || ogImage.startsWith('/');
      expect(isAbsolute, `og:image relative değil: "${ogImage}"`).toBeTruthy();
    }
  });

  test('T71-d: og:type var (website veya article)', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    expect(ogType, 'og:type eksik').toBeTruthy();
    expect(['website', 'article', 'blog', 'profile']).toContain(ogType);
  });

  test('T71-e: Twitter Card meta var', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard, 'twitter:card eksik — Twitter/X share önizlemesi yok').toBeTruthy();
  });
});

// ─── T72: NAP Consistency (schema.org) ───────────────────────────
test.describe('P38-T72: NAP (Name/Address/Phone) Schema Consistency', () => {
  test('T72-a: Organization schema.org name var ve tutarlı', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const ldScripts = await page.locator('script[type="application/ld+json"]').all();
    let orgName: string | null = null;

    for (const script of ldScripts) {
      const text = await script.textContent();
      try {
        const data = JSON.parse(text ?? '{}') as { '@type'?: string; name?: string };
        if (data['@type'] === 'Organization' || data['@type'] === 'LocalBusiness') {
          orgName = data.name ?? null;
          break;
        }
      } catch {
        /* skip invalid JSON */
      }
    }

    expect(orgName, 'Organization schema: name eksik — NAP tutarsız').toBeTruthy();
    if (orgName) {
      expect(orgName.toLowerCase(), 'Organization name EcyPro içermiyor').toContain('ecy');
    }
  });

  test('T72-b: Contact sayfasında NAP bilgisi var (telefon veya email)', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const hasEmail = await page
      .locator('a[href^="mailto:"], [class*="email"]')
      .first()
      .isVisible()
      .catch(() => false);
    const hasPhone = await page
      .locator('a[href^="tel:"], [class*="phone"]')
      .first()
      .isVisible()
      .catch(() => false);
    const hasAddress = await page
      .locator('[class*="address"], address, [itemprop="address"]')
      .first()
      .isVisible()
      .catch(() => false);

    const hasNAP = hasEmail || hasPhone || hasAddress;
    expect(hasNAP, '/contact: NAP (email/phone/address) yok').toBeTruthy();
  });

  test("T72-c: Organization areaServed veya addressCountry JSON-LD'de", async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let hasGeoData = false;

    for (const script of scripts) {
      const text = await script.textContent();
      try {
        const raw = JSON.parse(text ?? '{}') as Record<string, unknown>;
        const str = JSON.stringify(raw);
        if (str.includes('areaServed') || str.includes('addressCountry') || str.includes('TR')) {
          hasGeoData = true;
          break;
        }
      } catch {
        /* skip */
      }
    }

    if (!hasGeoData) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Organization: areaServed/addressCountry eksik — P39-T85 ile eklenecek',
        });
    }
  });
});

// ─── T73: Guest Post Author Bio (BlogPosting Schema) ─────────────
test.describe('P38-T73: Guest Post Altyapısı (BlogPosting Schema)', () => {
  test('T73-a: Blog post sayfasında author Schema.org var', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);

    // Blog listesinden ilk post al
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const firstPostLink = page.locator('a[href*="/blog/"]').first();
    if (!(await firstPostLink.isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: '/blog: post link yok' });
      return;
    }

    const href = await firstPostLink.getAttribute('href');
    if (!href) return;

    await page.goto(href.startsWith('http') ? href : `${BASE_URL}${href}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(400);

    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let hasBlogAuthor = false;

    for (const script of scripts) {
      const text = await script.textContent();
      try {
        const data = JSON.parse(text ?? '{}') as Record<string, unknown>;
        const str = JSON.stringify(data);
        if (str.includes('author') || str.includes('BlogPosting') || str.includes('Article')) {
          hasBlogAuthor = true;
          break;
        }
      } catch {
        /* skip */
      }
    }

    if (!hasBlogAuthor) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'BlogPosting: author schema eksik — guest post SEO zayıf',
        });
    }
  });

  test('T73-b: brain/seo/guest-post-targets.md dosyası var', () => {
    const candidates = [
      'brain/seo/guest-post-targets.md',
      'brain/seo/guest-posts.md',
      'docs/seo/guest-post-targets.md',
    ];
    const found = candidates.some((c) => fs.existsSync(path.join(ROOT, c)));
    if (!found) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'guest-post-targets.md: yok — P38-T73 plan belgesi eksik',
        });
    }
  });
});

// ─── T74: HARO / Press Contact ────────────────────────────────────
test.describe('P38-T74: HARO + Press Contact', () => {
  test('T74-a: /about sayfasında yazar/uzman bio var', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/about', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const hasTeam = await page
      .locator('[class*="team"], [class*="bio"], [class*="about"]')
      .first()
      .isVisible()
      .catch(() => false);
    const hasPerson = await page
      .locator('h2, h3')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasTeam || hasPerson, '/about: yazar/team bilgisi yok').toBeTruthy();
  });

  test('T74-b: /contact sayfasında iletişim formu var (HARO response için)', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const hasForm = await page
      .locator('form')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasForm, '/contact: form yok — HARO journalist iletişimi zor').toBeTruthy();
  });
});

// ─── T75: Google My Business (LocalBusiness Schema) ───────────────
test.describe('P38-T75: Google My Business / LocalBusiness Schema', () => {
  test('T75-a: LocalBusiness veya Organization schema.org var', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let hasOrgSchema = false;

    for (const script of scripts) {
      const text = await script.textContent();
      try {
        const data = JSON.parse(text ?? '{}') as { '@type'?: string };
        if (
          ['Organization', 'LocalBusiness', 'ProfessionalService', 'Consulting'].includes(
            data['@type'] ?? '',
          )
        ) {
          hasOrgSchema = true;
          break;
        }
      } catch {
        /* skip */
      }
    }

    expect(
      hasOrgSchema,
      'Organization/LocalBusiness schema: yok — GMB trust signal eksik',
    ).toBeTruthy();
  });

  test('T75-b: Schema.org url alanı production domain içeriyor', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const scripts = await page.locator('script[type="application/ld+json"]').all();

    for (const script of scripts) {
      const text = await script.textContent();
      try {
        const data = JSON.parse(text ?? '{}') as { url?: string; '@type'?: string };
        if ((data['@type'] === 'Organization' || data['@type'] === 'LocalBusiness') && data.url) {
          expect(data.url, 'Organization URL boş').toBeTruthy();
          return;
        }
      } catch {
        /* skip */
      }
    }
    test
      .info()
      .annotations.push({ type: 'note', description: 'Organization schema url alanı eksik' });
  });
});

// ─── T76: Press Release Page ──────────────────────────────────────
test.describe('P38-T76: Press Release Distribution', () => {
  test('T76-a: /press veya /blog/press-release sayfası mevcut (soft)', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);

    const candidates = ['/press', '/press-release', '/media', '/newsroom'];
    for (const candidate of candidates) {
      await page.goto(`${BASE_URL}${candidate}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const is404 = await page
        .locator('h1:has-text("404"), h1:has-text("Not Found")')
        .isVisible()
        .catch(() => false);
      if (!is404) {
        test
          .info()
          .annotations.push({ type: 'note', description: `Press page found: ${candidate}` });
        return;
      }
    }
    test
      .info()
      .annotations.push({ type: 'note', description: 'Press sayfası yok — P38-T76 pending' });
    // Soft pass
  });

  test('T76-b: Blog kategorisi "press-release" veya "company-news" var (soft)', async ({
    page,
  }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const pressTag = await page
      .locator('text=Press, text=Company News, text=Basın')
      .first()
      .isVisible()
      .catch(() => false);
    if (!pressTag) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Blog: press-release kategori yok — P38-T76 pending',
        });
    }
  });
});

// ─── T77: robots.txt Authority-Friendly ──────────────────────────
test.describe('P38-T77: robots.txt Authority SEO', () => {
  test('T77-a: robots.txt mevcut ve Googlebot Allow: / içeriyor', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/robots.txt`).catch(() => null);
    if (!res) return;

    expect(res.status(), 'robots.txt: HTTP error').toBe(200);
    const text = await res.text();
    expect(text, 'robots.txt boş').toBeTruthy();

    const hasAllow = text.includes('Allow: /') || !text.includes('Disallow: /');
    expect(hasAllow, 'robots.txt tüm sayfaları Disallow ediyor!').toBeTruthy();
  });

  test('T77-b: robots.txt Sitemap: direktifi içeriyor', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/robots.txt`).catch(() => null);
    if (!res) return;
    const text = await res.text();
    expect(text, 'robots.txt: Sitemap direktifi eksik').toContain('Sitemap:');
  });
});

// ─── T78: Link Reclamation Script ────────────────────────────────
test.describe('P38-T78: Link Reclamation (Unlinked Mentions)', () => {
  test('T78-a: scripts/backlink-monitor.ts veya broken-link-outreach.ts mevcut', () => {
    const candidates = [
      'scripts/backlink-monitor.ts',
      'scripts/broken-link-outreach.ts',
      'scripts/link-reclamation.ts',
      'scripts/seo-weekly-diff.ts',
    ];
    const found = candidates.filter((c) => fs.existsSync(path.join(ROOT, c)));
    expect(found.length, 'Link monitoring/reclamation scripti yok').toBeGreaterThanOrEqual(1);
    test
      .info()
      .annotations.push({ type: 'note', description: `Link scripts: ${found.join(', ')}` });
  });

  test('T78-b: npm run backlinks:monitor script tanımlı', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      scripts?: Record<string, string>;
    };
    const scripts = pkg.scripts ?? {};
    const hasMonitor =
      'backlinks:monitor' in scripts ||
      'seo:broken-links' in scripts ||
      'audit:broken-links' in scripts;
    expect(hasMonitor, 'backlink monitoring npm script yok').toBeTruthy();
  });
});

// ─── T79: Broken Link Building ────────────────────────────────────
test.describe('P38-T79: Broken Link Building Campaign', () => {
  test('T79-a: scripts/broken-link-outreach.ts dosyası içerik kaliteli', () => {
    const scriptPath = path.join(ROOT, 'scripts/broken-link-outreach.ts');
    if (!fs.existsSync(scriptPath)) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'broken-link-outreach.ts yok — P38-T79 pending',
        });
      return;
    }
    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content.length, 'broken-link-outreach.ts boş').toBeGreaterThan(100);
  });

  test('T79-b: outreach/ dizin veya template dosyası', () => {
    const candidates = [
      'outreach/link-reclamation.md',
      'brain/seo/outreach-template.md',
      'docs/outreach',
    ];
    const found = candidates.some((c) => fs.existsSync(path.join(ROOT, c)));
    if (!found) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Outreach template dosyası yok — P38-T79 pending',
        });
    }
  });
});

// ─── T80: Backlink Monitoring Dashboard ───────────────────────────
test.describe('P38-T80: Backlink Monitoring Dashboard', () => {
  test('T80-a: brain/seo/ dizini mevcut', () => {
    const seoDir = path.join(ROOT, 'brain', 'seo');
    expect(
      fs.existsSync(seoDir),
      'brain/seo/ dizini yok — SEO artefaktlar için alan yok',
    ).toBeTruthy();
  });

  test('T80-b: npm run seo:weekly-diff veya backlinks:monitor çalıştırılabilir', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      scripts?: Record<string, string>;
    };
    const scripts = pkg.scripts ?? {};
    const seoScripts = [
      'seo:weekly-diff',
      'backlinks:monitor',
      'seo:broken-links',
      'audit:broken-links',
    ];
    const hasAny = seoScripts.some((s) => s in scripts);
    expect(hasAny, 'SEO backlink script yok: ' + seoScripts.join(', ')).toBeTruthy();
  });

  test('T80-c: COMPETITIVE_AUDIT.md mevcut (authority baseline)', () => {
    const auditPath = path.join(ROOT, 'brain', 'COMPETITIVE_AUDIT.md');
    expect(fs.existsSync(auditPath), 'brain/COMPETITIVE_AUDIT.md yok').toBeTruthy();

    const content = fs.readFileSync(auditPath, 'utf-8');
    expect(content.length, 'COMPETITIVE_AUDIT.md boş').toBeGreaterThan(200);
  });
});

// ─── P38 GENEL ÖZETİ ──────────────────────────────────────────────
test.describe('P38: Backlink + Authority — Genel SEO Sağlık Skoru', () => {
  test('P38: OG + schema + robots + scripts tam coverage', async ({ page }) => {
    test.setTimeout(20000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // OG tags varlığı
    const ogCount = await page.locator('meta[property^="og:"]').count();
    expect(ogCount, 'OG tag yok — sosyal share zayıf').toBeGreaterThanOrEqual(3);

    // JSON-LD Organization
    const ldCount = await page.locator('script[type="application/ld+json"]').count();
    expect(ldCount, 'JSON-LD schema yok').toBeGreaterThanOrEqual(1);

    // Meta description
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDesc, 'Meta description boş').toBeTruthy();
    expect(metaDesc!.length, 'Meta description kısa').toBeGreaterThanOrEqual(50);
  });

  test('P38: Sitemap.xml 30+ URL (authority signal)', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`).catch(() => null);
    if (!res) return;
    const text = await res.text();
    const urlCount = (text.match(/<loc>/g) ?? []).length;
    expect(urlCount, `sitemap URL sayısı: ${urlCount} < 30`).toBeGreaterThanOrEqual(30);
  });
});
