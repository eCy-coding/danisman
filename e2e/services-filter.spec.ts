import { test, expect } from '@playwright/test';

/**
 * SVC GATE-6 — /services index v2 (taxonomy v2 alignment).
 *
 * The original spec asserted an "economics"-era catalog that never shipped
 * (the long-standing pre-existing service_hub failure). v2 asserts the real
 * registry: 8 chips, 7 lifecycle clusters, debounced search, empty state.
 */
test.describe('Services Ecosystem', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services');
  });

  test('Loads the services index page', async ({ page }) => {
    // i18n-agnostic: hero h1 reads "Stratejik Danışmanlık Hizmetleri" (TR) or
    // "Management Consulting Services" (EN). (The old /Entegre Danışmanlık/
    // assertion referenced an i18n key the page never rendered — historical
    // pre-existing failure.)
    await expect(page.locator('h1').first()).toHaveText(/Danışmanlık|Consulting/);
    await expect(page.getByTestId('services-filter-all')).toBeVisible();
  });

  test('renders all 8 registry chips and 7 grouped clusters', async ({ page }) => {
    for (const id of ['all', 'ma', 'esg', 'fintech', 'aile', 'insan', 'risk', 'buyume']) {
      await expect(page.getByTestId(`services-filter-${id}`)).toBeVisible();
    }
    for (const id of ['ma', 'esg', 'fintech', 'aile', 'insan', 'risk', 'buyume']) {
      await expect(page.getByTestId(`cluster-heading-${id}`)).toBeAttached();
    }
    await expect(page.getByTestId('services-result-count')).toHaveAttribute('data-count', '35');
  });

  test('Department filters work', async ({ page }) => {
    // Default grouped view: cards from both old and adopted departments render.
    await expect(
      page.locator('[data-testid="service-card"][data-service-id="ma-valuation"]'),
    ).toBeVisible();
    await expect(page.getByText(/Makroekonomik Risk/).first()).toBeVisible();

    // Filter to the new risk department.
    await page.getByTestId('services-filter-risk').click();
    await expect(page.locator('[data-testid="service-card"][data-category="risk"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="service-card"][data-category="ma"]')).toHaveCount(0);
    await expect(page.getByTestId('services-result-count')).toHaveAttribute('data-count', '6');
  });

  test('Search functionality works (debounced)', async ({ page }) => {
    const searchInput = page.getByTestId('services-search-input');
    await searchInput.fill('İnsan');
    await page.waitForTimeout(300);

    await expect(page.getByText(/İnsan Kaynakları/).first()).toBeVisible();
    await expect(
      page.locator('[data-testid="service-card"][data-service-id="ma-valuation"]'),
    ).toHaveCount(0);

    // Empty/No Results Search
    await searchInput.fill('NonExistentService12345XYZ');
    await page.waitForTimeout(1200);
    await expect(page.getByTestId('services-no-results')).toBeVisible({ timeout: 8000 });

    // Clear restores the grouped lifecycle view.
    await page.getByTestId('services-filter-clear').click();
    await expect(page.getByTestId('cluster-heading-ma')).toBeAttached();
  });

  test('lifecycle visualizer renders 7 numbered workflows with live links', async ({ page }) => {
    const section = page.getByTestId('services-cluster-section');
    await section.scrollIntoViewIfNeeded();
    for (const id of ['ma', 'esg', 'fintech', 'aile', 'insan', 'risk', 'buyume']) {
      await expect(section.getByTestId(`lifecycle-cluster-${id}`)).toBeAttached();
    }
    // Spot-check a step link end-to-end (insan step 1 → hr-transformation).
    await section
      .getByTestId('lifecycle-cluster-insan')
      .locator('a[href="/services/hr-transformation"]')
      .click();
    await expect(page).toHaveURL(/\/services\/hr-transformation$/);
    await expect(page.locator('h1').first()).toHaveText(/İnsan Kaynakları/);
  });
});
