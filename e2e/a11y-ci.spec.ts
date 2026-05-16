/**
 * e2e/a11y-ci.spec.ts — P18 FE Track 1, Aşama 2.
 *
 * Critical-route WCAG 2.1 AA gate for the publish pipeline.
 *
 * Mevcut `e2e/a11y.spec.ts` sadece `/` + `/services` üzerinde AAA seviyesinde
 * çok katı bir denetim çalıştırıyor; o suite uzun (animation/scroll trigger
 * adımlarıyla rota başına ~120 s) ve "release blocker" düzeyinde sıkı.
 *
 * Bu spec dar bir CI gate: 6 kritik public rota × WCAG 2.1 AA. Critical violation
 * (`impact === 'critical'`) tek başına fail eder; serious/moderate informational
 * olarak loglanır ama gate'i kırmaz. Böylece her PR'da hızlı, deterministic bir
 * baseline koruyabiliyoruz; deeper denetim için `a11y.spec.ts` ve
 * `crawl_a11y_wcag.spec.ts` mevcut.
 *
 * Çalıştır:
 *   npx playwright test e2e/a11y-ci.spec.ts --project=chromium
 */

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES: ReadonlyArray<{ path: string; label: string }> = [
  { path: '/', label: 'Landing' },
  { path: '/services', label: 'Services' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/blog', label: 'Blog list' },
];

// External image hosts that occasionally hang under WebKit's networkidle —
// stubbed out to keep CI deterministic.
async function stubExternalImages(page: Page): Promise<void> {
  await page.route(/images\.unsplash\.com|via\.placeholder|pexels\.com|picsum\.photos/, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    }),
  );
}

for (const route of ROUTES) {
  test(`A11y CI — ${route.label} (${route.path}) — no critical WCAG violations`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await stubExternalImages(page);
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    // Allow lazy/whileInView animations to settle without scrolling the
    // entire page (already covered by the AAA suite).
    await page.waitForTimeout(800);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Third-party Sonner toast container — landmark-unique false positive.
      .exclude('section[aria-label*="Notifications"]')
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    const serious = results.violations.filter((v) => v.impact === 'serious');

    if (serious.length > 0) {
      // Surface serious findings in the CI log without failing the build.
      // Promote to `expect(...)` when the team is ready to flip the gate.
      // eslint-disable-next-line no-console
      console.warn(
        `[a11y-ci] ${route.label}: ${serious.length} serious violation(s) (informational)`,
        serious.map((v) => `${v.id} — ${v.help}`),
      );
    }

    if (critical.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        `[a11y-ci] ${route.label}: critical violation(s)`,
        JSON.stringify(critical, null, 2),
      );
    }

    expect(critical, `Critical WCAG violations on ${route.path}`).toEqual([]);
  });
}
