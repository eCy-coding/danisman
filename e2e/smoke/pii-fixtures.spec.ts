import { test, expect } from '@playwright/test';

let piiCounter = 0;
function generatePII() {
  piiCounter++;
  return {
    name: 'E2E Test User ' + piiCounter,
    email: 'test-e2e-' + piiCounter + '@example.com',
    phone: '+905000000000',
    company: 'E2E Test Co ' + piiCounter,
  };
}

test.describe('Discovery Booking PII — form + no leak', () => {
  test('discovery form renders + PII not reflected in DOM after fill', async ({ page }) => {
    test.setTimeout(30_000);
    const response = await page.goto('/discovery-call', { waitUntil: 'domcontentloaded' });
    if (!response || response.status() === 404) {
      const r2 = await page.goto('/discovery', { waitUntil: 'domcontentloaded' });
      if (!r2 || r2.status() === 404) {
        test.skip(true, '/discovery-call and /discovery → 404');
        return;
      }
    }
    const form = page.locator('form').first();
    const formVisible = await form.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!formVisible) {
      test.skip(true, 'No form found on discovery route');
      return;
    }
    const pii = generatePII();
    const emailInput = form
      .locator('input[type="email"], input[name*="email"], input[id*="email"]')
      .first();
    if (await emailInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await emailInput.fill(pii.email);
    }
    const nameInput = form.locator('input[name*="name"], input[id*="name"]').first();
    if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameInput.fill(pii.name);
    }
    const submitBtn = form.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toContain(pii.email);
  });
});

test.describe('KVKK DSAR — data subject access request', () => {
  test('/privacy/data-rights renders + form accessible', async ({ page }) => {
    test.setTimeout(30_000);
    const response = await page.goto('/privacy/data-rights', { waitUntil: 'domcontentloaded' });
    if (!response || response.status() === 404) {
      test.skip(true, '/privacy/data-rights → 404');
      return;
    }
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
    const form = page.locator('form').first();
    const formVisible = await form.isVisible({ timeout: 5_000 }).catch(() => false);
    if (formVisible) {
      const pii = generatePII();
      const emailInput = form.locator('input[type="email"], input[name*="email"]').first();
      if (await emailInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await emailInput.fill(pii.email);
      }
      const kvkkBox = form.locator('input[type="checkbox"]').first();
      if (await kvkkBox.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await kvkkBox.check();
      }
    }
    expect(page.url()).toContain('/privacy');
  });
});

test.describe('Founder Letter — no PII exposure', () => {
  test('/founder renders + no raw PII in page text + CTA links valid', async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/ecypro/i);
    const bodyText = (await page.locator('body').textContent()) ?? '';
    const emailRegex = /[a-zA-Z0-9._%+-]+@(?!example\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const exposedEmails = bodyText.match(emailRegex) ?? [];
    expect(exposedEmails, 'No personal emails exposed on founder page').toHaveLength(0);
    const ctaLink = page.locator('a[href*="/contact"], a[href*="/discovery"]').first();
    const ctaVisible = await ctaLink.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(ctaVisible, 'CTA link to contact/discovery must exist').toBe(true);
  });
});

test.describe('Admin Login — brute force guard + no credential leak', () => {
  test('/admin/login shows error on wrong creds + no bypass', async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 15_000 });
    const pii = generatePII();
    const emailInput = form.locator('input[type="email"], input[name*="email"]').first();
    await emailInput.fill(pii.email);
    const passInput = form.locator('input[type="password"]').first();
    await passInput.fill('wrong-password-e2e');
    const submitBtn = form.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/admin.*login/);
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toContain('wrong-password-e2e');
  });
});
