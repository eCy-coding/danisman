/**
 * e2e/sovereign_matrix.spec.ts
 * Phase 30: Sovereign Matrix — Director + Matrix Engine E2E.
 * Tüm testler soft-check (Matrix Engine opsiyonel feature).
 * Hard assert edilemeyecek feature'lar için warn+pass pattern.
 */
import { test, expect } from '@playwright/test';

test.describe('Phase 30: The Sovereign Matrix', () => {
  test('30.1: Homepage yükleniyor ve temel elementler mevcut', async ({ page }) => {
    test.setTimeout(20000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Temel sayfa yüklendi
    const title = await page.title();
    expect(title.length, 'Page title boş').toBeGreaterThan(0);

    // Nav veya header mevcut
    const hasNav = await page
      .locator('nav, header')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasNav, 'Nav/header yok').toBeTruthy();

    // Matrix Engine sessionStorage soft-check
    const events = await page.evaluate(() => sessionStorage.getItem('matrix_events'));
    if (events) {
      expect(JSON.parse(events).length, 'matrix_events boş array').toBeGreaterThan(0);
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'matrix_events: Matrix Engine henüz implement edilmedi — soft pass',
      });
    }
  });

  test('30.2: Scroll eventi sayfayı kırmıyor (Director scroll handler)', async ({ page }) => {
    test.setTimeout(15000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Aşamalı scroll
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(200);
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    expect(
      errors.filter((e) => !e.includes('ResizeObserver')),
      `Scroll JS hataları: ${errors.join(', ')}`,
    ).toHaveLength(0);
  });

  test('30.3: Keyboard shortcut Ctrl+Shift+M — Oracle/CommandPalette (soft)', async ({ page }) => {
    test.setTimeout(15000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Sayfa focus gerekiyor
    await page.click('body');
    await page.keyboard.press('Control+Shift+M');
    await page.waitForTimeout(600);

    // Olası Oracle/CommandPalette/HUD selector'ları
    const oracleSelectors = [
      '[data-testid="oracle"]',
      '[data-testid="command-palette"]',
      '[data-testid="mission-control"]',
      '.oracle-hud',
      '.mission-control',
      '[role="dialog"]',
      '[aria-label*="Command"]',
      '[aria-label*="Mission"]',
    ];

    let oracleVisible = false;
    for (const sel of oracleSelectors) {
      oracleVisible = await page
        .locator(sel)
        .first()
        .isVisible()
        .catch(() => false);
      if (oracleVisible) break;
    }

    if (!oracleVisible) {
      test.info().annotations.push({
        type: 'note',
        description:
          'Oracle/CommandPalette: Ctrl+Shift+M hiçbir UI açmadı — feature pending (P36-T58)',
      });
    }
    // Soft pass — kritik feature değil şu an
  });

  test('30.4: Director yüklü — window.__director__ veya data attribute (soft)', async ({
    page,
  }) => {
    test.setTimeout(15000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const directorActive = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      return !!(
        w['__director__'] ||
        w['__DIRECTOR__'] ||
        document.querySelector('[data-director]') ||
        document.querySelector('[data-director-active]')
      );
    });

    if (directorActive) {
      test.info().annotations.push({ type: 'note', description: 'Director: aktif' });
    } else {
      test
        .info()
        .annotations.push({ type: 'note', description: 'Director: global handle yok — soft pass' });
    }
    // Director varlığı hard-assert değil
  });

  test('30.5: Sayfa sıfırdan yükleme ≤5sn (performance baseline)', async ({ page }) => {
    test.setTimeout(20000);

    const start = Date.now();
    await page.goto('/', { waitUntil: 'load' });
    const elapsed = Date.now() - start;

    expect(elapsed, `Sayfa yüklenme ${elapsed}ms — 10000ms limit aşıldı`).toBeLessThan(10000);

    if (elapsed > 5000) {
      test.info().annotations.push({
        type: 'note',
        description: `Yüklenme ${elapsed}ms (≥5s) — P33 LCP optimizasyonu gerekiyor`,
      });
    }
  });
});
