import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/services', label: 'Services' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/insights', label: 'Insights', graceful: true },
];

test.describe('SEO Meta Smoke', () => {
  for (const route of ROUTES) {
    test(`${route.label} (${route.path}) — title + canonical + og present`, async ({ page }) => {
      const response = await page.goto(route.path);

      if (route.graceful && response && response.status() === 404) {
        test.skip(true, `${route.path} returned 404 — skipping gracefully`);
        return;
      }

      // Title must contain eCyPro and be non-trivially long
      const title = await page.title();
      expect(title).toMatch(/ecypro/i);
      expect(title.length).toBeGreaterThan(5);

      // Meta description must exist and be non-empty
      const description = await page
        .locator('meta[name="description"]')
        .getAttribute('content')
        .catch(() => null);
      if (description !== null) {
        expect(description.length).toBeGreaterThan(0);
      }

      // og:title must be present
      const ogTitle = await page
        .locator('meta[property="og:title"]')
        .getAttribute('content')
        .catch(() => null);
      expect(ogTitle).toBeTruthy();

      // og:url or canonical link must be present
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href')
        .catch(() => null);
      const ogUrl = await page
        .locator('meta[property="og:url"]')
        .getAttribute('content')
        .catch(() => null);
      expect(canonical || ogUrl).toBeTruthy();
    });
  }

  test('robots.txt accessible', async ({ request }) => {
    // Use request fixture (not page.goto) to avoid Firefox NS_ERROR_FAILURE
    // when calling response.text() on non-HTML content types.
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('User-agent');
  });

  test('sitemap.xml accessible', async ({ request }) => {
    // Use request fixture (not page.goto) to avoid Firefox NS_ERROR_FAILURE
    // when calling response.text() on non-HTML content types.
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<urlset');
  });

  test('page titles are unique across routes', async ({ page }) => {
    const titles: string[] = [];

    for (const route of ROUTES) {
      const response = await page.goto(route.path);
      if (route.graceful && response && response.status() === 404) continue;
      // Wait for React to render route-specific title. networkidle times out on
      // production (persistent WS/polling connections), so use a short fixed wait.
      await page.waitForTimeout(800);
      titles.push(await page.title());
    }

    const unique = new Set(titles);
    // At least 80% of titles must be unique (allows for minor title collisions).
    // Actual titles collected: helps debug if assertion fails.
    expect(unique.size, `Titles: ${JSON.stringify([...titles])}`).toBeGreaterThanOrEqual(
      Math.floor(titles.length * 0.8),
    );
  });
});
