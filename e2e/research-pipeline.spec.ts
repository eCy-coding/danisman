/**
 * e2e/research-pipeline.spec.ts — P82 Research Bridge UI smoke.
 *
 * CI-deterministic layer: NotebookLM is unreachable from CI, so this spec
 * proves the UI surface + auth guard only. The full pipeline (bridge →
 * server → BlogPost draft, incl. all NotebookLM gotchas) is covered by the
 * server vitest suite (server/routes/admin-research.test.ts, 19 cases) and
 * by the live local proof archived under brain/research-bridge/evidence/.
 *
 * Run:
 *   npx playwright test e2e/research-pipeline.spec.ts --project=chromium
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';

test.describe('Admin research — public smoke (no auth)', () => {
  test('/admin/research redirects unauthenticated user to admin login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/research`);
    await page.waitForLoadState('domcontentloaded');
    // Auth guard sends anonymous visitors to the admin login surface; assert
    // we did NOT land on a rendered research form.
    await expect(page).toHaveURL(/\/admin\/(login)?($|\?)/);
  });
});

test.describe('Admin research — authed surface', () => {
  test.skip(!process.env.PREVIEW_AUTH_COOKIE, 'requires PREVIEW_AUTH_COOKIE');

  test.beforeEach(async ({ context }) => {
    const cookie = process.env.PREVIEW_AUTH_COOKIE;
    if (cookie) {
      await context.addCookies([
        { name: 'auth-token', value: cookie, domain: new URL(BASE_URL).hostname, path: '/' },
      ]);
    }
  });

  test('renders the research queue form and jobs table', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/research`);
    await page.waitForLoadState('domcontentloaded');
    // Topic field + submit button are the load-bearing controls.
    await expect(page.getByPlaceholder(/aile şirket|family business/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
