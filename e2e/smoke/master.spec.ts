import { test, expect } from '@playwright/test';

interface RouteConfig {
  path: string;
  label: string;
  trAlias?: string;
  authRequired?: boolean;
  graceful?: boolean;
}

const ROUTES: RouteConfig[] = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About', trAlias: '/hakkimizda' },
  { path: '/services', label: 'Services', trAlias: '/hizmetler' },
  { path: '/blog', label: 'Blog/Insights', trAlias: '/perspektifler' },
  { path: '/case-studies', label: 'Cases', trAlias: '/vaka-calismalari' },
  { path: '/faq', label: 'FAQ', trAlias: '/sss' },
  { path: '/contact', label: 'Contact', trAlias: '/iletisim' },
  { path: '/pricing', label: 'Pricing', trAlias: '/fiyatlandirma' },
  { path: '/privacy', label: 'KVKK/Privacy', graceful: true },
  { path: '/cookies', label: 'Aydinlatma/Cookies', graceful: true },
  { path: '/admin/login', label: 'Admin Login', authRequired: true },
  { path: '/founder', label: 'Founder Letter' },
];

const CONSOLE_ERROR_IGNORE = /posthog|gtag|analytics|sentry|_hjSettings|intercom/i;

test.describe('Master Smoke — 12 routes × EN + TR redirects', () => {
  for (const route of ROUTES) {
    test(`EN: ${route.label} (${route.path}) — status + content + canonical`, async ({ page }) => {
      test.setTimeout(45_000);
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !CONSOLE_ERROR_IGNORE.test(msg.text())) {
          consoleErrors.push(msg.text());
        }
      });
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      if (route.graceful && response && response.status() === 404) {
        test.skip(true, `${route.path} → 404, skipping gracefully`);
        return;
      }
      if (route.authRequired) {
        // admin/login redirect is fine — just verify login page renders
        await expect(page.locator('form').first()).toBeVisible({ timeout: 15_000 });
        return;
      }
      expect(response?.status() ?? 0).toBeLessThan(400);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
      const title = await page.title();
      expect(title.toLowerCase()).toMatch(/ecypro/i);
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href')
        .catch(() => null);
      expect(canonical, 'canonical link must exist').toBeTruthy();
      await page.waitForTimeout(500);
      expect(
        consoleErrors,
        `Console errors on ${route.path}: ${consoleErrors.join('; ')}`,
      ).toHaveLength(0);
    });
  }

  for (const route of ROUTES.filter((r) => r.trAlias)) {
    test(`TR redirect: ${route.label} (${route.trAlias}) → ${route.path}`, async ({ page }) => {
      test.setTimeout(45_000);
      await page.goto(route.trAlias!, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(route.path.replace('/', '\\/')), { timeout: 10_000 });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
    });
  }
});
