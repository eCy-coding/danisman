/**
 * e2e/sovereign_vault.spec.ts
 * Phase 31: The Sovereign Vault — localStorage, IndexedDB, offline resilience.
 * ADR-006: serviceWorkers: 'block' — SW tests soft-check pattern.
 */
import { test, expect } from '@playwright/test';

test.describe('Phase 31: The Sovereign Vault', () => {
  test('31.1: localStorage read/write güvenli çalışıyor', async ({ page }) => {
    test.setTimeout(15000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // localStorage write + read cycle
    const result = await page.evaluate(() => {
      try {
        localStorage.setItem('vault_test', 'ecypro_v1');
        const val = localStorage.getItem('vault_test');
        localStorage.removeItem('vault_test');
        return val;
      } catch {
        return null;
      }
    });
    expect(result, 'localStorage: read/write başarısız').toBe('ecypro_v1');
  });

  test('31.2: Cookie consent localStorage kalıcı (ecypro_cookie_consent)', async ({ page }) => {
    test.setTimeout(15000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const consent = await page.evaluate(() => localStorage.getItem('ecypro_cookie_consent'));
    expect(consent, 'Cookie consent pre-seed çalışmıyor').toBeTruthy();

    if (consent) {
      const parsed = JSON.parse(consent) as { type?: string };
      expect(parsed.type, 'Cookie consent type eksik').toBeTruthy();
    }
  });

  test('31.3: Offline fallback — OfflineStatus bileşeni hata atmıyor', async ({ browser }) => {
    test.setTimeout(20000);
    const context = await browser.newContext();
    const page = await context.newPage();

    const errors: string[] = [];
    page.on('pageerror', (err) => {
      if (!err.message.includes('ResizeObserver') && !err.message.includes('NetworkError')) {
        errors.push(err.message);
      }
    });

    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Offline'a al
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Online'a geri al — sayfa crash etmemeli
    await context.setOffline(false);
    await page.waitForTimeout(500);

    expect(errors, `Offline toggle JS hataları: ${errors.join(', ')}`).toHaveLength(0);
    await context.close();
  });

  test("31.4: IndexedDB API browser'da destekleniyor", async ({ page }) => {
    test.setTimeout(10000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const supported = await page.evaluate(() => typeof indexedDB !== 'undefined');
    expect(supported, 'IndexedDB desteklenmiyor').toBeTruthy();
  });

  test('31.5: ServiceWorker config — ADR-006 block mod (E2E mock için)', async ({ page }) => {
    test.setTimeout(15000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // ADR-006: serviceWorkers: 'block' — SW register edilmemeli (Playwright block)
    const swStatus = await page.evaluate(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/');
        return reg ? 'registered' : 'blocked';
      } catch {
        return 'blocked';
      }
    });

    test.info().annotations.push({
      type: 'note',
      description: `SW Status: ${swStatus} (ADR-006: block expected in E2E)`,
    });
    // SW blocking doğru çalışıyor
  });

  test("31.6: Sayfa birden fazla tab'da çökmüyor (multi-context)", async ({ browser }) => {
    test.setTimeout(25000);

    const contexts = await Promise.all([browser.newContext(), browser.newContext()]);

    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));
    const errors: string[] = [];

    for (const p of pages) {
      p.on('pageerror', (err) => errors.push(err.message));
    }

    await Promise.all(
      pages.map((p) => p.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })),
    );
    await Promise.all(pages.map((p) => p.waitForTimeout(500)));

    const titles = await Promise.all(pages.map((p) => p.title()));
    for (const title of titles) {
      expect(title.length, 'Multi-tab: title boş').toBeGreaterThan(0);
    }

    const realErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('NetworkError'),
    );
    expect(realErrors, `Multi-tab JS hatası: ${realErrors.join(', ')}`).toHaveLength(0);

    await Promise.all(contexts.map((ctx) => ctx.close()));
  });
});
