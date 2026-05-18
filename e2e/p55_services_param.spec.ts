/**
 * P55.C1 — Parametrized service detail E2E.
 *
 * Loops 21 service slugs; checks page loads + h1 visible + sticky CTA exists.
 * Reads slugs from a static list (mirrors src/data/service-content.ts entries).
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';

const SERVICE_SLUGS = [
  'strategic-transformation',
  'mergers-acquisitions',
  'family-business',
  'operational-excellence',
  'neuromarketing',
  'hr-transformation',
  'crisis-management',
  'ai-analytics',
  'digital-strategy',
  'data-governance',
  'esg-strategy',
  'investment-incentives',
  'macro-risk',
  'competition-economics',
  'industrial-relations',
  'payroll-audit',
  'employer-branding',
  'market-entry',
  'global-intelligence',
  'smart-cities',
  'government-relations',
];

for (const slug of SERVICE_SLUGS) {
  test(`service:${slug} loads + h1 + cta`, async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/services/${slug}`);
    expect(res?.status() ?? 200).toBeLessThan(400);
    await expect(page.locator('h1').first()).toBeVisible();
    // CTA / Discovery anchor or button present somewhere on page
    const cta = page.locator('a:has-text("Discovery"), a:has-text("Görüşme"), button:has-text("Discovery"), button:has-text("Görüşme")');
    expect(await cta.count()).toBeGreaterThan(0);
  });
}
