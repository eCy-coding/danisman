 

import { test, expect } from '@playwright/test';

test.describe('Lead Generation Flow', () => {

  test('User can submit contact form successfully', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    // ContactForm scoped via data-testid (avoids strict-mode collision with newsletter form in footer)
    const form = page.getByTestId('contact-form');
    await expect(form).toBeVisible();

    await form.locator('input[name="name"]').fill('QA Test User');
    await form.locator('input[name="email"]').fill('qa@test.com');
    await form.locator('textarea[name="message"]').fill('This is an automated E2E test message for validation.');

    const submitBtn = form.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Success banner: component falls back to 'Mesajınız İletildi!' when i18n key
    // contact.form.success_title is missing; otherwise the key itself renders verbatim.
    await expect(
      page.getByText(/Mesajınız İletildi|Message Received|contact\.form\.success_title/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test('Form shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const form = page.getByTestId('contact-form');
    await form.locator('button[type="submit"]').click();

    // Scope assertions to the form to avoid label collision. Zod messages pass
    // through i18next; partial substrings are unique to the error path only.
    await expect(form.getByText(/must be at least 2 characters/i)).toBeVisible({ timeout: 5000 });
    await expect(form.getByText(/valid email address/i)).toBeVisible({ timeout: 5000 });
    await expect(form.getByText(/must be at least 10 characters/i)).toBeVisible({ timeout: 5000 });
  });

});
