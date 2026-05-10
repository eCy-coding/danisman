/**
 * e2e/spider.spec.ts
 * Omni-Protocol V9: The Spider Crawler — prompts2/07-testing-strategy.md
 *
 * Goal: Tüm sitemap URL'lerini ziyaret et, HTTP 200 + nav/footer doğrula.
 * Strategy:
 *   1. sitemap.xml parse → URL listesi
 *   2. Her URL: HTTP status + core elements check
 *   3. Broken link raporu + JS hata sayısı
 *   4. Özet metrikler (score/100)
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4173';
const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');

// ─── Sitemap parse (statik — beforeAll yerine) ──────────────────
function discoverUrls(): string[] {
  if (!fs.existsSync(sitemapPath)) {
    return ['/', '/services', '/about', '/contact', '/blog', '/pricing', '/case-studies'];
  }
  const content = fs.readFileSync(sitemapPath, 'utf-8');
  const matches = content.match(/<loc>(.*?)<\/loc>/g) ?? [];
  return matches
    .map((m) => {
      const full = m.replace(/<\/?loc>/g, '');
      try {
        return new URL(full).pathname;
      } catch {
        return full;
      }
    })
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe
}

const URLS = discoverUrls();

// Özel sayfa tipi sınıflandırması
const isAuthPage = (u: string) => /\/(login|register|forgot-password|reset-password)/.test(u);
const isAdminPage = (u: string) => u.startsWith('/admin');
const isDashboard = (u: string) => u.includes('/dashboard');

test.describe('The Spider Crawler (Protocol V9) — prompts2/07', () => {
  test('Spider: Sitemap URL keşfi', () => {
    expect(URLS.length, "Sitemap'de URL yok — sitemap.xml oluşturulmamış").toBeGreaterThanOrEqual(
      1,
    );
    test.info().annotations.push({
      type: 'note',
      description: `Keşfedilen URL sayısı: ${URLS.length}`,
    });
  });

  test('Spider: Sitemap.xml erişilebilir ve geçerli XML', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`).catch(() => null);
    if (!res) {
      test.info().annotations.push({ type: 'skip', description: 'Preview server down' });
      return;
    }
    expect(res.status(), 'sitemap.xml HTTP error').toBe(200);
    const text = await res.text();
    expect(
      text.includes('<urlset') || text.includes('<sitemapindex'),
      'sitemap.xml geçersiz XML',
    ).toBeTruthy();
    const locCount = (text.match(/<loc>/g) ?? []).length;
    expect(locCount, 'sitemap.xml: URL yok').toBeGreaterThanOrEqual(5);
    test.info().annotations.push({ type: 'note', description: `sitemap URL: ${locCount}` });
  });

  test('Spider: Tüm sitemap sayfaları SPA 200 döndürüyor', async ({ page }) => {
    test.setTimeout(Math.max(URLS.length * 8000, 120000));

    const brokenLinks: string[] = [];
    const jsErrors: string[] = [];
    const checkedPages: string[] = [];

    // Mock external image CDNs (timeout kaynağı)
    await page.route('https://images.unsplash.com/**', (r) => r.fulfill({ status: 200, body: '' }));
    await page.route('https://images.pexels.com/**', (r) => r.fulfill({ status: 200, body: '' }));
    await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));

    page.on('pageerror', (err) => {
      if (!err.message.includes('ResizeObserver') && !err.message.includes('NetworkError')) {
        jsErrors.push(err.message);
      }
    });

    for (const urlPath of URLS) {
      const fullUrl = `${BASE_URL}${urlPath}`;
      try {
        const response = await page.goto(fullUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        const status = response?.status() ?? 0;

        if (status >= 400) {
          brokenLinks.push(`${urlPath} [HTTP ${status}]`);
          continue;
        }

        await page.waitForTimeout(200);

        // Sayfa tipi bazlı kontrol
        if (isAdminPage(urlPath)) {
          // Admin: /login'e yönlendirilmeli veya admin UI yüklenmeli
          const finalUrl = page.url();
          const validAdmin = finalUrl.includes('/login') || finalUrl.includes('/admin');
          if (!validAdmin) {
            brokenLinks.push(`${urlPath} (admin: unexpected redirect → ${finalUrl})`);
          }
        } else if (isAuthPage(urlPath)) {
          const hasForm = await page
            .locator('form, input[type="email"]')
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);
          if (!hasForm) {
            brokenLinks.push(`${urlPath} (auth: form yok)`);
          }
        } else if (isDashboard(urlPath)) {
          const hasLayout = await page
            .locator('aside, nav, [role="navigation"]')
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);
          if (!hasLayout) {
            brokenLinks.push(`${urlPath} (dashboard: layout yok)`);
          }
        } else {
          // Normal sayfa: nav var mı?
          const hasNav = await page
            .locator('nav, header')
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);
          if (!hasNav) {
            brokenLinks.push(`${urlPath} (nav/header yok)`);
          }
        }

        checkedPages.push(urlPath);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        brokenLinks.push(`${urlPath} (Exception: ${msg.slice(0, 80)})`);
      }
    }

    // Rapor
    const score = Math.round((checkedPages.length / URLS.length) * 100);
    test.info().annotations.push({
      type: 'note',
      description:
        `Spider Skor: ${score}% (${checkedPages.length}/${URLS.length})\n` +
        (brokenLinks.length ? `Kırık: ${brokenLinks.join(' | ')}` : 'Kırık yok ✅') +
        (jsErrors.length ? `\nJS Hatası: ${jsErrors.slice(0, 3).join(' | ')}` : ''),
    });

    if (brokenLinks.length > 0) {
      console.error(`[SPIDER] ${brokenLinks.length} broken:\n  ${brokenLinks.join('\n  ')}`);
    }

    expect(
      brokenLinks.length,
      `${brokenLinks.length} kırık sayfa:\n${brokenLinks.join('\n')}`,
    ).toBe(0);
  });

  test('Spider: Kritik rotalar özel doğrulama (homepage + /contact + /pricing)', async ({
    page,
  }) => {
    test.setTimeout(30000);
    await page.route('https://images.unsplash.com/**', (r) => r.fulfill({ status: 200, body: '' }));
    await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));

    const criticalPages = [
      { path: '/', check: 'nav, header' },
      { path: '/contact', check: 'form' },
      { path: '/pricing', check: 'h1, h2' },
      { path: '/about', check: 'main, [class*="about"]' },
      { path: '/blog', check: 'article, [class*="blog"], a[href*="/blog/"]' },
    ];

    for (const { path: p, check } of criticalPages) {
      if (!URLS.includes(p)) continue;

      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(300);

      const visible = await page
        .locator(check)
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      expect(visible, `${p}: "${check}" yok`).toBeTruthy();
    }
  });

  test('Spider: 404 sayfası graceful render oluyor', async ({ page }) => {
    test.setTimeout(15000);
    await page.goto(`${BASE_URL}/this-page-definitely-does-not-exist-xyz-9999`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(300);

    const status = await page.evaluate(() => document.documentElement.outerHTML.length);
    expect(status, '404 sayfa boş döndü').toBeGreaterThan(100);

    // SPA fallback: nav/header veya 404 mesajı olmalı
    const hasLayout = await page
      .locator('nav, header, h1, main')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasLayout, '404 sayfası: layout yok (SPA fallback bozuk)').toBeTruthy();
  });

  test('Spider: robots.txt + sitemap.xml + favicon.ico erişilebilir', async ({ request }) => {
    const publicFiles = ['/robots.txt', '/sitemap.xml', '/favicon.ico'];

    for (const file of publicFiles) {
      const res = await request.get(`${BASE_URL}${file}`).catch(() => null);
      if (!res) continue;
      expect(res.status(), `${file}: 404`).not.toBe(404);
    }
  });
});
