/**
 * e2e/homepage-r8.spec.ts — Sprint 13 R8 homepage hardening verification.
 *
 * Five surgical e2e probes for the public landing page:
 *
 *   R8-C1: Hero primary CTA is wired to Calendly with `target="_blank"`.
 *   R8-C2: Homepage Contact section form fill + submit attempt actually
 *          invokes the FE handler (state transitions out of `idle`).
 *   R8-C3: FAQ accordion expands the first question on click.
 *   R8-C4: Navbar mega-menu opens on hover and closes on Escape.
 *   R8-C5: SuccessStories carousel honors ArrowRight (R5-D1 keyboard nav).
 *
 * Pattern mirrors `e2e/a11y-ci.spec.ts` and `e2e/sanity_check.spec.ts`:
 *   - `baseURL` from `playwright.config.ts` (defaults to localhost:4173,
 *     overridable via the env-driven config or BASE_URL when running ad-hoc).
 *   - External-dep stubs (api.ecypro.com, mock api server) so the FE handler
 *     under test runs deterministically regardless of backend availability.
 *   - Each test is independent — no shared `test.beforeAll` state.
 *
 * Run:
 *   npx playwright test e2e/homepage-r8.spec.ts --project=chromium
 */

import { test, expect, type Page } from '@playwright/test';
import { MOCK_URL } from './mock-url';

const HOME_PATH = '/';

/** Stub backend + tracking endpoints so the FE handler runs in isolation. */
async function stubBackends(page: Page): Promise<void> {
  // Local mock-server (booking, geo, health) — see playwright.config.ts.
  await page.route('http://localhost:3001/**', (route) => route.fulfill({ status: 200, json: {} }));
  await page.route(`${MOCK_URL}/**`, (route) => route.fulfill({ status: 200, json: {} }));
  // Production API host — never hit from CI.
  await page.route('https://api.ecypro.com/**', (route) =>
    route.fulfill({ status: 200, json: { success: true } }),
  );
  // Contact form POST — accept generic JSON success so handler resolves
  // along the success branch. The FE only needs `result.success` truthy.
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 200, json: { success: true, message: 'ok' } }),
  );
  // Sentry / analytics noise — drop silently.
  await page.route(
    /ingest\.sentry\.io|posthog\.com|google-analytics\.com|googletagmanager/,
    (route) => route.fulfill({ status: 200, json: {} }),
  );
}

test.describe('Homepage R8 hardening', () => {
  test('R8-C1 — Hero primary CTA points to Calendly with target=_blank', async ({ page }) => {
    // Hero CTA is rendered with `data-testid="hero-cta-primary"`. The `book`
    // variant (default) wires `href` to the Calendly funnel via
    // `getCalendlyCta('hero-primary')`; explore variant falls back to
    // `#contact`. We assert the default ship-state.
    await stubBackends(page);
    await page.goto(HOME_PATH, { waitUntil: 'domcontentloaded' });

    const cta = page.getByTestId('hero-cta-primary');
    await expect(cta).toBeVisible({ timeout: 10_000 });

    const href = await cta.getAttribute('href');
    expect(href, 'Hero primary CTA href').toContain('calendly.com/ecypro');

    const target = await cta.getAttribute('target');
    expect(target, 'Hero primary CTA target').toBe('_blank');
  });

  test('R8-C2 — Contact form submit transitions out of idle state', async ({ page }) => {
    // Contact section uses local React state (`status: idle|submitting|success|error`).
    // We can't guarantee any specific terminal state in CI (backend stub returns
    // ok, but FE may surface success or validation error depending on env). We
    // assert ONLY that the click invoked the handler: submit button enters
    // disabled / "Gönderiliyor..." state OR the success panel OR the error alert
    // becomes visible within 5s.
    await stubBackends(page);
    await page.goto(HOME_PATH, { waitUntil: 'domcontentloaded' });

    const contact = page.locator('#contact');
    await contact.scrollIntoViewIfNeeded();
    await expect(contact).toBeVisible({ timeout: 10_000 });

    // The InputField wrapper uses dynamic React-generated ids; we target by
    // accessible name (aria-label === label text).
    await contact.getByLabel('Ad Soyad').fill('Test User');
    await contact.getByLabel('E-posta').fill('test@example.com');
    await contact.getByLabel('Mesajınız').fill('Playwright e2e test message');

    const submit = contact.getByRole('button', { name: /Mesajı Gönder|Gönderiliyor/ });
    await expect(submit).toBeEnabled();
    await submit.click();

    // Assert any post-submit state: button disabled (submitting), success
    // panel ("Mesajınız Alındı"), or error alert (role="alert"). One of these
    // MUST appear if the React handler ran.
    const submittingButton = contact.getByRole('button', { name: /Gönderiliyor/ });
    const successPanel = contact.getByText('Mesajınız Alındı');
    const errorAlert = contact.getByRole('alert');

    await expect(async () => {
      const submittingVisible = await submittingButton.isVisible().catch(() => false);
      const successVisible = await successPanel.isVisible().catch(() => false);
      const errorVisible = await errorAlert.isVisible().catch(() => false);
      expect(submittingVisible || successVisible || errorVisible).toBe(true);
    }).toPass({ timeout: 5_000 });
  });

  test('R8-C3 — FAQ accordion expands the first question on click', async ({ page }) => {
    // FAQSection emits 8 questions with `aria-expanded` / `aria-controls`
    // wired through ids `faq-btn-f{N}` / `faq-answer-f{N}`. Question f1 is the
    // "Danışmanlık süreci ne kadar sürer?" entry — we target it by id rather
    // than text to stay i18n-agnostic.
    await stubBackends(page);
    await page.goto(HOME_PATH, { waitUntil: 'domcontentloaded' });

    const faqSection = page.getByTestId('faq-section');
    await faqSection.scrollIntoViewIfNeeded();
    await expect(faqSection).toBeVisible({ timeout: 10_000 });

    const firstBtn = page.locator('#faq-btn-f1');
    await expect(firstBtn).toBeVisible();
    await expect(firstBtn).toHaveAttribute('aria-expanded', 'false');

    await firstBtn.click();
    await expect(firstBtn).toHaveAttribute('aria-expanded', 'true');

    // Answer panel mounted via AnimatePresence; id matches aria-controls target.
    const answer = page.locator('#faq-answer-f1');
    await expect(answer).toBeVisible({ timeout: 5_000 });
  });

  test('R8-C4 — Navbar mega-menu opens on hover and Escape closes it', async ({ page }) => {
    // Desktop nav opens the Services mega-menu on hover; useKeyPress('Escape')
    // clears `activeDropdown`, which flips `aria-expanded` on the trigger back
    // to "false" and toggles the MegaMenu visibility class.
    // Run in a viewport wide enough for the `lg:flex` desktop nav.
    await page.setViewportSize({ width: 1280, height: 800 });
    await stubBackends(page);
    await page.goto(HOME_PATH, { waitUntil: 'domcontentloaded' });

    const servicesTrigger = page.getByTestId('navbar-link-services');
    await expect(servicesTrigger).toBeVisible({ timeout: 10_000 });

    // Hover to open. The trigger sets `aria-expanded="true"` when active.
    await servicesTrigger.hover();
    await expect(servicesTrigger).toHaveAttribute('aria-expanded', 'true', { timeout: 3_000 });

    // Press Escape — global key handler closes the dropdown.
    await page.keyboard.press('Escape');
    await expect(servicesTrigger).toHaveAttribute('aria-expanded', 'false', { timeout: 3_000 });
  });

  test('R8-C5 — SuccessStories ArrowRight advances active card', async ({ page }) => {
    // SuccessStories (R5-D1) wires ArrowLeft/ArrowRight on the section root
    // (`role="region"`, `tabIndex={0}`). ArrowRight calls `goNext()`, which
    // bumps `currentIndex` and focuses the next card via `el.focus()`. We
    // assert the focused element changes from card[0] to card[1].
    // Run in a viewport wide enough to render the desktop horizontal carousel
    // (the `hidden lg:block` branch wires the keyboard handler we're testing).
    await page.setViewportSize({ width: 1440, height: 900 });
    await stubBackends(page);
    await page.goto(HOME_PATH, { waitUntil: 'domcontentloaded' });

    const carousel = page.getByRole('region', {
      name: /Başarı hikayeleri karuseli|Success stories carousel/,
    });
    await carousel.scrollIntoViewIfNeeded();
    await expect(carousel).toBeVisible({ timeout: 10_000 });

    // Focus the section root so the keydown handler fires there.
    await carousel.focus();

    // Capture the href of the first card link before navigating.
    const firstCardHref = await carousel
      .locator('a[href^="/case-studies/"]')
      .first()
      .getAttribute('href');
    expect(firstCardHref, 'First case-study card href').toBeTruthy();

    await page.keyboard.press('ArrowRight');

    // After ArrowRight, goNext() calls `el.focus()` on cards[1]; the active
    // element should now be a different case-study link than the first.
    await expect(async () => {
      const focusedHref = await page.evaluate(() => {
        const el = document.activeElement as HTMLAnchorElement | null;
        return el?.getAttribute('href') ?? null;
      });
      expect(focusedHref, 'document.activeElement href after ArrowRight').not.toBe(firstCardHref);
      expect(focusedHref).toMatch(/^\/case-studies\//);
    }).toPass({ timeout: 3_000 });
  });
});
