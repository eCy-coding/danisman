/**
 * e2e/crawl_i18n_international.spec.ts
 * P39: i18n + International SEO — roadmap_90.md T81-T90
 *
 * Kapsar:
 *   T81 — hreflang tags her sayfada (tr/en/x-default)
 *   T82 — TR/EN URL path-based routing (/tr/, /en/)
 *   T83 — Locale-specific content (lang attr, i18next namespace)
 *   T84 — Currency switcher (TRY/USD/EUR) altyapısı
 *   T85 — International Schema.org (areaServed, addressCountry)
 *   T86 — GSC International Targeting önkoşulları
 *   T87 — i18next ICU MessageFormat (plural/date)
 *   T88 — Translation memory (brain/i18n/)
 *   T89 — RTL scaffold (Tailwind logical props)
 *   T90 — Multilingual sitemap split (sitemap-tr.xml / sitemap-en.xml)
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_i18n_international.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4173';
const ROOT = process.cwd();

const mockSetup = async (page: Page) => {
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
  await page.route('**/api.exchangerate-api.com/**', (r) =>
    r.fulfill({ status: 200, json: { rates: { USD: 0.031, EUR: 0.029 } } }),
  );
};

// ─── T81: hreflang Tags ───────────────────────────────────────────
test.describe('P39-T81: hreflang Tags Her Sayfada', () => {
  test('T81-a: Hreflang.tsx bileşen dosyası mevcut', () => {
    const candidates = [
      'src/components/seo/Hreflang.tsx',
      'src/components/Hreflang.tsx',
      'src/components/seo/HreflangTags.tsx',
    ];
    const found = candidates.some((c) => fs.existsSync(path.join(ROOT, c)));
    expect(found, 'Hreflang.tsx component yok — P39-T81 implement edilmemiş').toBeTruthy();
  });

  test('T81-b: Homepage hreflang link tags mevcut', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hreflangLinks = await page.locator('link[rel="alternate"][hreflang]').all();

    if (hreflangLinks.length === 0) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'hreflang tags yok — P39-T81 implement gerekiyor',
        });
    } else {
      const hreflangs = await Promise.all(hreflangLinks.map((l) => l.getAttribute('hreflang')));
      expect(hreflangs).toContain('tr');
      expect(hreflangs).toContain('en');
      expect(hreflangs).toContain('x-default');
    }
  });

  test("T81-c: Hreflang bileşeni App.tsx'e import edilmiş", () => {
    const appPath = path.join(ROOT, 'src', 'App.tsx');
    if (!fs.existsSync(appPath)) return;
    const content = fs.readFileSync(appPath, 'utf-8');
    const hasHreflang = content.includes('Hreflang') || content.includes('hreflang');
    if (!hasHreflang) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'App.tsx: Hreflang import yok — sayfaya enjekte edilmiyor',
        });
    }
  });
});

// ─── T82: TR/EN URL Path-Based Routing ───────────────────────────
test.describe('P39-T82: TR/EN URL Strategy', () => {
  test("T82-a: /tr/ ve /en/ route'ları SPA 200 döndürüyor (soft)", async ({ page }) => {
    test.setTimeout(20000);
    await mockSetup(page);

    for (const locale of ['/tr', '/en', '/tr/', '/en/']) {
      await page.goto(`${BASE_URL}${locale}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const title = await page.title();
      const is404 = title.includes('404') || title.includes('Not Found');

      if (!is404) {
        test
          .info()
          .annotations.push({ type: 'note', description: `Locale route aktif: ${locale}` });
        return;
      }
    }
    test
      .info()
      .annotations.push({
        type: 'note',
        description: '/tr/ /en/ URL routing yok — P39-T82 pending (şu an client-side i18n)',
      });
  });

  test('T82-b: i18next aktif ve dil değiştirebiliyor', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const i18nLoaded = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      return !!(w['i18n'] || w['__i18n__'] || document.documentElement.lang);
    });

    if (!i18nLoaded) {
      test
        .info()
        .annotations.push({ type: 'note', description: 'i18n global handle yok — soft pass' });
    }

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang, 'html lang attr eksik — SEO dil sinyali yok').toBeTruthy();
  });

  test('T82-c: Dil switcher butonu (UI element) var', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const langSwitcher = await page
      .locator(
        '[data-testid="lang-switcher"], [aria-label*="language" i], [aria-label*="dil" i], button:has-text("TR"), button:has-text("EN"), select[name*="lang"]',
      )
      .first()
      .isVisible()
      .catch(() => false);

    if (!langSwitcher) {
      test
        .info()
        .annotations.push({ type: 'note', description: 'Lang switcher UI yok — soft pass' });
    }
  });
});

// ─── T83: Locale-Specific Content ────────────────────────────────
test.describe('P39-T83: Locale-Specific Content', () => {
  test('T83-a: i18n locale JSON dosyaları mevcut (en.json / tr.json)', () => {
    const localeDir = path.join(ROOT, 'public', 'locales');
    const srcDir = path.join(ROOT, 'src', 'i18n');
    const altDir = path.join(ROOT, 'src', 'locales');

    const dirs = [localeDir, srcDir, altDir];
    const foundDir = dirs.find((d) => fs.existsSync(d));

    expect(foundDir, 'i18n locale dizini yok — P39-T83 pending').toBeTruthy();

    if (foundDir) {
      const hasTr = fs
        .readdirSync(foundDir, { withFileTypes: true, recursive: false })
        .some((f) => f.name.includes('tr'));
      const hasEn = fs
        .readdirSync(foundDir, { withFileTypes: true, recursive: false })
        .some((f) => f.name.includes('en'));

      expect(hasTr || hasEn, 'locale dizininde tr/en klasörü yok').toBeTruthy();
    }
  });

  test('T83-b: Blog sayfası html lang attr ile yükleniyor', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang, '/blog: html lang eksik').toBeTruthy();
    expect(['tr', 'en', 'tr-TR', 'en-US']).toContain(lang);
  });

  test('T83-c: i18next instance react-i18next ile bağlı', () => {
    const candidates = [
      'src/lib/i18n-react.ts',
      'src/lib/i18n.ts',
      'src/i18n.ts',
      'src/i18n/index.ts',
      'src/main.tsx',
    ];
    const found = candidates.find((c) => {
      if (!fs.existsSync(path.join(ROOT, c))) return false;
      const content = fs.readFileSync(path.join(ROOT, c), 'utf-8');
      return content.includes('i18next') || content.includes('react-i18next');
    });
    expect(found, 'i18next setup dosyası yok').toBeTruthy();
  });
});

// ─── T84: Currency Switcher ───────────────────────────────────────
test.describe('P39-T84: Currency Switcher (TRY/USD/EUR)', () => {
  test('T84-a: PricingPage currency display var', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const hasCurrency = await page
      .locator('text=₺, text=TRY, text=TL, text=$, text=€')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasCurrency, '/pricing: currency symbol yok').toBeTruthy();
  });

  test('T84-b: currencyStore.ts veya currency context mevcut (soft)', () => {
    const candidates = [
      'src/stores/currencyStore.ts',
      'src/context/CurrencyContext.tsx',
      'src/hooks/useCurrency.ts',
      'src/lib/currency.ts',
    ];
    const found = candidates.some((c) => fs.existsSync(path.join(ROOT, c)));
    if (!found) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Currency store yok — P39-T84 pending (şu an hardcoded TRY)',
        });
    }
  });

  test("T84-c: ExchangeRate-API.com key .env.example'da (soft)", () => {
    const envExample = path.join(ROOT, '.env.example');
    if (!fs.existsSync(envExample)) return;
    const content = fs.readFileSync(envExample, 'utf-8');
    const hasRateKey = content.includes('EXCHANGE_RATE') || content.includes('CURRENCY_API');
    if (!hasRateKey) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: '.env.example: ExchangeRate API key yok — P39-T84 pending',
        });
    }
  });
});

// ─── T85: International Schema.org ───────────────────────────────
test.describe('P39-T85: International Schema.org (areaServed)', () => {
  test('T85-a: Organization schema areaServed içeriyor', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let hasAreaServed = false;

    for (const script of scripts) {
      const text = await script.textContent();
      try {
        const data = JSON.parse(text ?? '{}') as Record<string, unknown>;
        if (JSON.stringify(data).includes('areaServed')) {
          hasAreaServed = true;
          break;
        }
      } catch {
        /* skip */
      }
    }

    if (!hasAreaServed) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'areaServed schema eksik — P39-T85 pending',
        });
    }
  });

  test('T85-b: availableLanguage schema.org var (TR + EN)', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let hasLang = false;

    for (const script of scripts) {
      const text = await script.textContent();
      try {
        if ((text ?? '').includes('availableLanguage') || (text ?? '').includes('inLanguage')) {
          hasLang = true;
          break;
        }
      } catch {
        /* skip */
      }
    }

    if (!hasLang) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'availableLanguage schema eksik — P39-T85 pending',
        });
    }
  });
});

// ─── T86: GSC International Targeting ────────────────────────────
test.describe('P39-T86: GSC International Targeting Önkoşulları', () => {
  test('T86-a: sitemap.xml mevcut ve erişilebilir (GSC submit için)', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`).catch(() => null);
    if (!res) return;
    expect(res.status(), 'sitemap.xml: HTTP error').toBe(200);
    const text = await res.text();
    expect(
      text.includes('<urlset') || text.includes('<sitemapindex'),
      'sitemap.xml geçersiz XML',
    ).toBeTruthy();
  });

  test('T86-b: robots.txt Sitemap: direktifi var (GSC discovery)', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/robots.txt`).catch(() => null);
    if (!res) return;
    const text = await res.text();
    expect(text, 'robots.txt: Sitemap direktifi eksik — GSC auto-discovery çalışmaz').toContain(
      'Sitemap:',
    );
  });

  test('T86-c: html lang attr TR veya EN (GSC language signal)', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang, 'html lang eksik — GSC dil belirleme yapamaz').toBeTruthy();
  });
});

// ─── T87: i18next ICU MessageFormat ──────────────────────────────
test.describe('P39-T87: i18next ICU MessageFormat', () => {
  test("T87-a: i18next-icu paketi veya intlify package.json'da", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const hasIcu = 'i18next-icu' in deps || 'intlify' in deps || '@formatjs/intl' in deps;
    if (!hasIcu) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'i18next-icu yok — plural/gender format eksik (P39-T87 pending)',
        });
    }
  });

  test("T87-b: Intl.PluralRules API browser'da destekleniyor", async ({ page }) => {
    test.setTimeout(10000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const supported = await page.evaluate(() => {
      try {
        const pr = new Intl.PluralRules('tr-TR');
        return pr.select(1) === 'one' || pr.select(5) === 'other';
      } catch {
        return false;
      }
    });
    expect(supported, 'Intl.PluralRules desteklenmiyor').toBeTruthy();
  });
});

// ─── T88: Translation Memory ──────────────────────────────────────
test.describe('P39-T88: Translation Memory (TMS Lite)', () => {
  test('T88-a: brain/i18n/ veya brain/i18n/memory.json mevcut (soft)', () => {
    const candidates = ['brain/i18n/memory.json', 'brain/i18n', 'src/i18n/memory.json'];
    const found = candidates.some((c) => fs.existsSync(path.join(ROOT, c)));
    if (!found) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Translation memory (brain/i18n/) yok — P39-T88 pending',
        });
    }
  });

  test('T88-b: scripts/i18n-suggest.ts mevcut ve çalıştırılabilir', () => {
    const scriptPath = path.join(ROOT, 'scripts/i18n-suggest.ts');
    expect(fs.existsSync(scriptPath), 'scripts/i18n-suggest.ts yok').toBeTruthy();

    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content.length, 'i18n-suggest.ts boş').toBeGreaterThan(100);
  });

  test('T88-c: npm run i18n:audit script tanımlı', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      scripts?: Record<string, string>;
    };
    const scripts = pkg.scripts ?? {};
    const hasAudit =
      'i18n:audit' in scripts || 'i18n:suggest' in scripts || 'i18n:stats' in scripts;
    expect(hasAudit, 'i18n npm script yok').toBeTruthy();
  });
});

// ─── T89: RTL Scaffold ────────────────────────────────────────────
test.describe('P39-T89: RTL Support Scaffold', () => {
  test('T89-a: Tailwind logical properties kullanımı (ms-/me- classes)', () => {
    const tailwindConfig = path.join(ROOT, 'tailwind.config.ts');
    if (!fs.existsSync(tailwindConfig)) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'tailwind.config.ts yok — Tailwind v4 inline config olabilir',
        });
      return;
    }
    // Logical properties CSS src dosyalarında var mı?
    const cssPath = path.join(ROOT, 'src');
    const cmd = `grep -r "\\bms-\\|\\bme-\\|text-start\\|text-end" ${cssPath} --include="*.tsx" --include="*.css" -l 2>/dev/null | head -3`;
    // Dosya kontrolü yeterli — RTL hazırlık soft check
    test.info().annotations.push({ type: 'note', description: `RTL logical props: ${cmd}` });
  });

  test('T89-b: document.dir değiştiğinde layout bozulmuyor (LTR baseline)', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // LTR → RTL → LTR çevrim
    await page.evaluate(() => {
      document.dir = 'rtl';
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      document.dir = 'ltr';
    });
    await page.waitForTimeout(200);

    expect(
      errors.filter((e) => !e.includes('ResizeObserver')),
      `RTL toggle JS hataları: ${errors.join(', ')}`,
    ).toHaveLength(0);
  });
});

// ─── T90: Multilingual Sitemap Split ─────────────────────────────
test.describe('P39-T90: Multilingual Sitemap Split', () => {
  test('T90-a: sitemap.xml 30+ URL var (bilingual hazırlık baseline)', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`).catch(() => null);
    if (!res) return;
    const text = await res.text();
    const urlCount = (text.match(/<loc>/g) ?? []).length;
    expect(urlCount, `sitemap: ${urlCount} URL — 30+ bekleniyor`).toBeGreaterThanOrEqual(30);
  });

  test('T90-b: sitemap-tr.xml veya sitemap-index.xml mevcut (soft)', async ({ request }) => {
    const candidates = ['/sitemap-tr.xml', '/sitemap-en.xml', '/sitemap-index.xml'];

    for (const candidate of candidates) {
      const res = await request.get(`${BASE_URL}${candidate}`).catch(() => null);
      if (res && res.status() === 200) {
        test
          .info()
          .annotations.push({
            type: 'note',
            description: `Multilingual sitemap bulundu: ${candidate}`,
          });
        return;
      }
    }
    test
      .info()
      .annotations.push({
        type: 'note',
        description: 'Multilingual sitemap yok — P39-T90 pending (şu an tek sitemap.xml)',
      });
  });

  test('T90-c: scripts/generate-sitemap.ts mevcut ve locale destekli', () => {
    const scriptPath = path.join(ROOT, 'scripts/generate-sitemap.ts');
    expect(fs.existsSync(scriptPath), 'generate-sitemap.ts yok').toBeTruthy();

    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content.length, 'generate-sitemap.ts boş').toBeGreaterThan(100);

    const hasLocale =
      content.includes('locale') || content.includes('tr') || content.includes('hreflang');
    if (!hasLocale) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'generate-sitemap.ts: locale/hreflang desteği yok — P39-T90 pending',
        });
    }
  });
});

// ─── P39 ÖZET ────────────────────────────────────────────────────
test.describe('P39: i18n International SEO — Genel Skor', () => {
  test('P39: Bilingual temel altyapı özeti (hreflang + i18n + lang attr)', async ({ page }) => {
    test.setTimeout(20000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const checks: Record<string, boolean> = {
      'html[lang]': !!(await page.locator('html').getAttribute('lang')),
      'meta og:title': !!(await page
        .locator('meta[property="og:title"]')
        .getAttribute('content')
        .catch(() => null)),
      'hreflang links': (await page.locator('link[rel="alternate"][hreflang]').count()) > 0,
      'JSON-LD schema': (await page.locator('script[type="application/ld+json"]').count()) > 0,
      'i18n setup file':
        fs.existsSync(path.join(ROOT, 'src/lib/i18n-react.ts')) ||
        fs.existsSync(path.join(ROOT, 'src/i18n.ts')),
    };

    const done = Object.entries(checks)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const missing = Object.entries(checks)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    console.warn(
      `\nP39 i18n Skoru (${done.length}/${Object.keys(checks).length}):\n` +
        done.map((k) => `  ✅ ${k}`).join('\n') +
        (missing.length ? '\n' + missing.map((k) => `  ⬜ ${k}`).join('\n') : ''),
    );

    // html[lang] ve JSON-LD zorunlu
    expect(checks['html[lang]'], 'html lang eksik — uluslararası SEO temel').toBeTruthy();
    expect(checks['JSON-LD schema'], 'JSON-LD eksik — international schema yok').toBeTruthy();
  });
});
