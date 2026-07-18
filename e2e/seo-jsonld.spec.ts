import { test, expect } from '@playwright/test';

/**
 * M9 regression (brain/MISTAKES_LOG.md): template + route double-injection
 * used to leave duplicate JSON-LD <script> blocks in <head> — live
 * /perspektifler had 12 blocks, the homepage carried Person ×2. The fix
 * (8064662 / 5090e0d) keyed every block on `data-seo-id` and made
 * SEO.tsx/SchemaOrg.tsx/JsonLd.tsx upsert (adopt-or-create) instead of
 * blindly appending. This spec exercises the exact repro path — landing
 * page, a genuine client-side route change (no full reload), then back —
 * and asserts the dedup key actually holds across that lifecycle.
 */
test.describe('SEO & GEO — JSON-LD duplicate regression (M9)', () => {
  test('/ → client-side nav to /perspektifler → back to / never duplicates JSON-LD', async ({
    page,
  }) => {
    // Mirrors e2e-perspektifler.spec.ts: suppress the exit-intent modal so it
    // can't intercept the click/scroll below.
    await page.addInitScript(() => localStorage.setItem('exit_intent_shown', '1'));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Client-side navigation: the homepage "Insights" section renders a real
    // react-router <Link to="/perspektifler"> (src/components/sections/Insights.tsx),
    // not a plain <a href> full-page load. Clicking it is an SPA route change.
    const viewAllLink = page.getByRole('link', { name: /Tüm Yazılar|All Articles/ }).first();
    await viewAllLink.scrollIntoViewIfNeeded();
    await viewAllLink.click();
    await page.waitForURL('**/perspektifler');
    await expect(page.locator('h1')).toContainText('Perspektifler');

    // Back to / via SPA history (browser back), not a fresh page.goto — this
    // is what previously re-triggered the double-injection in M9.
    await page.goBack();
    await page.waitForURL((url) => url.pathname === '/');
    await page.waitForLoadState('networkidle');

    const { duplicateSeoIds, personCount, totalBlocks } = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const seoIdCounts = new Map<string, number>();
      let personCount = 0;

      for (const el of scripts) {
        const id = el.getAttribute('data-seo-id');
        if (id) seoIdCounts.set(id, (seoIdCounts.get(id) ?? 0) + 1);

        try {
          const data = JSON.parse(el.textContent ?? '{}') as { '@type'?: unknown };
          const types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
          if (types.includes('Person')) personCount += 1;
        } catch {
          // Malformed JSON-LD is not this test's concern (covered by audit-jsonld.ts).
        }
      }

      return {
        duplicateSeoIds: [...seoIdCounts.entries()].filter(([, count]) => count > 1),
        personCount,
        totalBlocks: scripts.length,
      };
    });

    expect(
      duplicateSeoIds,
      `duplicate data-seo-id groups found: ${JSON.stringify(duplicateSeoIds)} (of ${totalBlocks} total JSON-LD blocks)`,
    ).toEqual([]);
    expect(
      personCount,
      `expected at most one Person schema, found ${personCount}`,
    ).toBeLessThanOrEqual(1);
  });
});
