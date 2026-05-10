/**
 * e2e/helpers/mocks.ts
 * Merkezi Mock Yöneticisi — tüm spec'ler için ortak
 * istek5.txt 15-Pane E2E altyapısı
 *
 * Kullanım:
 *   import { setupMocks, setupSlowAPI, setupNetworkError } from './helpers/mocks';
 *   await setupMocks(page);
 */

import type { Page, Route } from '@playwright/test';

// ─── Sabit mock response'lar ─────────────────────────────────────────────────

const GEO_RESPONSE = {
  status: 'success',
  data: { country: 'TR', flag: '🇹🇷', currency: 'TRY', suggestedLang: 'tr', city: 'Istanbul' },
};

const STATUS_RESPONSE = {
  status: { indicator: 'operational' },
  components: [],
  updatedAt: new Date().toISOString(),
};

const CONTACT_OK = { ok: true, message: 'Form başarıyla gönderildi.' };
const NEWSLETTER_OK = { ok: true, subscribed: true };

// ─── Temel mock kurulumu ──────────────────────────────────────────────────────

/** Tüm dış servisleri mock'la (standart) */
export async function setupMocks(
  page: Page,
  opts?: {
    geoCountry?: string;
    contactStatus?: number;
    statusIndicator?: string;
  },
): Promise<void> {
  const geo = { ...GEO_RESPONSE };
  if (opts?.geoCountry) geo.data.country = opts.geoCountry;
  if (opts?.statusIndicator) STATUS_RESPONSE.status.indicator = opts.statusIndicator;

  await Promise.all([
    // Geo API
    page.route('**/api/geo/**', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(geo) }),
    ),
    // Status API
    page.route('**/api/status', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(STATUS_RESPONSE),
      }),
    ),
    // Contact form
    page.route('**/api/contact', (r) =>
      r.fulfill({
        status: opts?.contactStatus ?? 200,
        contentType: 'application/json',
        body: JSON.stringify(
          opts?.contactStatus === 200 || !opts?.contactStatus ? CONTACT_OK : { ok: false },
        ),
      }),
    ),
    // Newsletter
    page.route('**/api/newsletter/**', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(NEWSLETTER_OK),
      }),
    ),
    // Analytics / Tracking (block)
    page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 })),
    page.route('**/api.telegram.org/**', (r) => r.fulfill({ status: 200, json: { ok: true } })),
    page.route('**/googletagmanager.com/**', (r) => r.fulfill({ status: 200 })),
    page.route('**/google-analytics.com/**', (r) => r.fulfill({ status: 200 })),
    page.route('**/hotjar.com/**', (r) => r.fulfill({ status: 200 })),
    page.route('**/localhost:4001/**', (r) => r.fulfill({ status: 200, body: '[]' })),
  ]);
}

/** Yavaş API — loading state testi için */
export async function setupSlowAPI(page: Page, delayMs = 1_500): Promise<void> {
  await setupMocks(page);
  await page.route('**/api/contact', async (r) => {
    await new Promise((res) => setTimeout(res, delayMs));
    await r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(CONTACT_OK),
    });
  });
}

/** Network error — form hata state testi için */
export async function setupNetworkError(page: Page, endpoint = '**/api/contact'): Promise<void> {
  await setupMocks(page);
  await page.route(endpoint, (r: Route) => r.abort('failed'));
}

/** 5xx server error — graceful degradation testi için */
export async function setupServerError(
  page: Page,
  endpoint = '**/api/contact',
  status = 500,
): Promise<void> {
  await setupMocks(page);
  await page.route(endpoint, (r) =>
    r.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'Internal Server Error' }),
    }),
  );
}

/** Rate limit (429) mock */
export async function setupRateLimit(page: Page, endpoint = '**/api/contact'): Promise<void> {
  await setupMocks(page);
  let count = 0;
  await page.route(endpoint, (r) => {
    count++;
    if (count > 2) {
      return r.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too Many Requests' }),
      });
    }
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(CONTACT_OK),
    });
  });
}

/** CORS mock — güvenlik testleri için */
export async function setupCORSHeaders(page: Page): Promise<void> {
  await setupMocks(page);
  await page.route('**/api/**', async (r) => {
    const res = await r.fetch();
    await r.fulfill({
      response: res,
      headers: {
        ...res.headers(),
        'Access-Control-Allow-Origin': 'http://localhost:4173',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  });
}

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

/** Contact bölümüne scroll et */
export async function scrollToContact(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
}

/** Sayfayı kademeli scroll et (lazy load tetikle) */
export async function fullPageScroll(page: Page, steps = 6, stepDelay = 250): Promise<void> {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((h) => window.scrollTo(0, h), Math.floor((height / steps) * i));
    await page.waitForTimeout(stepDelay);
  }
}

/** Modal/dialog açık mı? */
export async function isModalOpen(page: Page): Promise<boolean> {
  return page
    .locator('[role="dialog"], [data-state="open"]')
    .isVisible({ timeout: 2_000 })
    .catch(() => false);
}

/** Form field doldur */
export async function fillContactForm(
  page: Page,
  data?: {
    name?: string;
    email?: string;
    message?: string;
  },
): Promise<void> {
  const nameInput = page.locator('#contact input[type="text"]').first();
  const emailInput = page.locator('#contact input[type="email"]').first();
  const textarea = page.locator('#contact textarea').first();

  if (await nameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await nameInput.fill(data?.name ?? 'Test Kullanıcı');
  }
  if (await emailInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await emailInput.fill(data?.email ?? 'test@corporate.com');
  }
  if (await textarea.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await textarea.fill(data?.message ?? 'E2E test mesajı — otomatik gönderim');
  }
}

/** JSON-LD şemalarını çıkar */
export async function extractSchemas(page: Page): Promise<unknown[]> {
  return page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    return scripts
      .map((s) => {
        try {
          return JSON.parse(s.textContent ?? '');
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  });
}

/** Meta content değerini al */
export async function getMeta(page: Page, selector: string): Promise<string | null> {
  return page
    .locator(selector)
    .getAttribute('content')
    .catch(() => null);
}
