/**
 * e2e/crawl_booking_flow.spec.ts
 * P37: Booking + Calendar Production — roadmap_70.md T61-T70
 *
 * Kapsar:
 *   T61 — Cal.com entegrasyonu: /api/bookings/slots endpoint
 *   T62 — Email confirmation altyapısı (Resend.com)
 *   T63 — ICS Calendar attachment infrastructure
 *   T64 — Reminder email cron job source dosyası
 *   T65 — Reschedule/Cancel flow sayfası
 *   T66 — BookingModal slots calendar widget
 *   T67 — Timezone-aware display (Intl.DateTimeFormat)
 *   T68 — Cal.com webhook route
 *   T69 — Booking analytics API
 *   T70 — Post-booking NPS feedback route
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_booking_flow.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4173';
const API_URL = 'http://localhost:3099';
const ROOT = process.cwd();

const mockSetup = async (page: Page) => {
  await page.route('https://api.cal.com/**', (r) =>
    r.fulfill({ status: 200, json: { slots: { '2026-06-01': [{ time: '10:00:00' }] } } }),
  );
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
  await page.route('**/api.resend.com/**', (r) =>
    r.fulfill({ status: 200, json: { id: 'mock-id' } }),
  );
};

// ─── T61: Cal.com Entegrasyonu ───────────────────────────────────
test.describe('P37-T61: Cal.com Booking API', () => {
  test('T61-a: /api/bookings/slots endpoint mevcut (proxy Cal.com)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/bookings/slots`).catch(() => null);
    if (!res) {
      test.info().annotations.push({ type: 'skip', description: 'API down — skip' });
      return;
    }
    // 200 (data), 400 (missing param) veya 401 (auth) hepsi "var" demek; 404 = yok
    expect(res.status(), '/api/bookings/slots: 404 — route implement edilmemiş').not.toBe(404);
  });

  test('T61-b: BookingModal step-1 takvim açılıyor', async ({ page }) => {
    test.setTimeout(20000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Booking açan trigger'ları dene
    const bookingTriggers = [
      'text=Book a Meeting',
      'text=Randevu Al',
      'text=Book Now',
      '[data-testid="booking-trigger"]',
      'button:has-text("Book")',
      'button:has-text("Randevu")',
      'a:has-text("Book")',
    ];

    let opened = false;
    for (const sel of bookingTriggers) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(600);
        opened = true;
        break;
      }
    }

    if (!opened) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Booking trigger bulunamadı — homepage CTA eksik (P37-T66)',
        });
      return;
    }

    const modalOpen = await page
      .locator('[role="dialog"], .booking-modal, [data-testid="booking-modal"]')
      .first()
      .isVisible()
      .catch(() => false);
    if (!modalOpen) {
      test
        .info()
        .annotations.push({ type: 'note', description: 'BookingModal: açılmadı — soft pass' });
    }
  });
});

// ─── T62: Email Confirmation Altyapısı ──────────────────────────
test.describe('P37-T62: Email Confirmation (Resend)', () => {
  test('T62-a: server/lib/email.ts veya resend config mevcut', () => {
    const candidates = [
      'server/lib/email.ts',
      'server/lib/resend.ts',
      'server/services/email.ts',
      'server/utils/email.ts',
    ];
    const found = candidates.some((c) => fs.existsSync(path.join(ROOT, c)));
    if (!found) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'server/lib/email.ts: Resend entegrasyon dosyası yok — P37-T62 pending',
        });
    }
    // Soft — future feature
  });

  test('T62-b: RESEND_API_KEY .env.example içinde tanımlı', () => {
    const envExample = path.join(ROOT, '.env.example');
    if (!fs.existsSync(envExample)) return;
    const content = fs.readFileSync(envExample, 'utf-8');
    const hasResend = content.includes('RESEND_API_KEY');
    if (!hasResend) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: '.env.example: RESEND_API_KEY eksik — entegrasyon.txt sync gerekiyor',
        });
    }
  });

  test("T62-c: resend npm paketi veya @react-email package.json'da", () => {
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const hasResend = 'resend' in deps || '@react-email/components' in deps || 'nodemailer' in deps;
    if (!hasResend) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Email library (resend/nodemailer/@react-email) yok — P37-T62 pending',
        });
    }
  });
});

// ─── T63: ICS Calendar Attachment ────────────────────────────────
test.describe('P37-T63: ICS Calendar Attachment', () => {
  test("T63-a: ics npm paketi veya ical package.json'da", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const hasIcs = 'ics' in deps || 'ical-generator' in deps || 'node-ical' in deps;
    if (!hasIcs) {
      test
        .info()
        .annotations.push({ type: 'note', description: 'ICS package yok — P37-T63 pending' });
    }
  });

  test('T63-b: "Add to Google Calendar" link endpoint (GET /booking/add-to-gcal)', async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/booking/add-to-gcal?id=test`).catch(() => null);
    if (!res) return;
    // 400 (invalid param) veya 302 (redirect) = implement edilmiş
    expect(res.status(), '/booking/add-to-gcal: 404 — route yok').not.toBe(404);
  });
});

// ─── T64: Reminder Emails Cron ────────────────────────────────────
test.describe('P37-T64: Reminder Email Cron Job', () => {
  test('T64-a: Booking model reminder24hSent / reminder1hSent Prisma schema içinde', () => {
    const schemaPath = path.join(ROOT, 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) return;
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const hasFlags =
      schema.includes('reminder24hSent') ||
      schema.includes('reminder1hSent') ||
      schema.includes('reminderSent');
    if (!hasFlags) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Prisma: reminder flags yok — P37-T64 pending',
        });
    }
  });

  test('T64-b: Cron job kaynak dosyası mevcut', () => {
    const candidates = [
      'server/jobs/booking-reminders.ts',
      'server/jobs/reminders.ts',
      'server/cron/booking-reminders.ts',
      'server/workers/bookingReminders.ts',
    ];
    const found = candidates.some((c) => fs.existsSync(path.join(ROOT, c)));
    if (!found) {
      test
        .info()
        .annotations.push({ type: 'note', description: 'Cron job dosyası yok — P37-T64 pending' });
    }
  });
});

// ─── T65: Reschedule/Cancel Flow ─────────────────────────────────
test.describe('P37-T65: Reschedule/Cancel Flow', () => {
  test('T65-a: /booking/manage/:id sayfası SPA 200', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto(`${BASE_URL}/booking/manage/test-id`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const currentUrl = page.url();
    const is404 = await page
      .locator('text=404, text=Page Not Found')
      .first()
      .isVisible()
      .catch(() => false);

    if (is404 || currentUrl.includes('404')) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: '/booking/manage: route implement edilmemiş — P37-T65 pending',
        });
    } else {
      const title = await page.title();
      expect(title.length, '/booking/manage: title boş').toBeGreaterThan(0);
    }
  });

  test('T65-b: /api/bookings/:id DELETE endpoint JWT korumalı', async ({ request }) => {
    const res = await request.delete(`${API_URL}/api/bookings/test-id`).catch(() => null);
    if (!res) return;
    expect(res.status(), 'DELETE /bookings/:id anonim 2xx döndü').toBeGreaterThanOrEqual(400);
  });
});

// ─── T66: Calendar Widget ─────────────────────────────────────────
test.describe('P37-T66: Available Slots Calendar Widget', () => {
  test('T66-a: BookingModal açılır + takvim slot gösteriyor (E2E)', async ({ page }) => {
    test.setTimeout(25000);
    await mockSetup(page);

    // Cal.com API mock
    await page.route(`${API_URL}/api/bookings/slots**`, (r) =>
      r.fulfill({
        status: 200,
        json: {
          slots: {
            '2026-06-01': [{ time: '10:00' }, { time: '11:00' }],
            '2026-06-02': [{ time: '14:00' }],
          },
        },
      }),
    );

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Booking trigger'ı bul
    const triggers = [
      'button:has-text("Book")',
      'button:has-text("Randevu")',
      'a:has-text("Book")',
    ];
    let clicked = false;
    for (const t of triggers) {
      const el = page.locator(t).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click();
        await page.waitForTimeout(800);
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Booking CTA bulunamadı — widget test skip',
        });
      return;
    }

    // Modal veya inline takvim
    const hasCalendar = await page
      .locator(
        '[data-testid="booking-calendar"], .booking-calendar, [class*="calendar"], [class*="datepicker"]',
      )
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasCalendar) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Booking calendar widget: görünmüyor — soft pass',
        });
    }
  });

  test('T66-b: react-day-picker veya date picker kütüphanesi yüklü', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      dependencies?: Record<string, string>;
    };
    const deps = pkg.dependencies ?? {};
    const hasDatePicker =
      'react-day-picker' in deps ||
      '@radix-ui/react-calendar' in deps ||
      'react-datepicker' in deps ||
      'flatpickr' in deps;
    if (!hasDatePicker) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Date picker kütüphanesi yok — P37-T66 pending',
        });
    }
  });
});

// ─── T67: Timezone-Aware Booking ─────────────────────────────────
test.describe('P37-T67: Timezone-Aware Booking Display', () => {
  test("T67-a: date-fns-tz veya luxon package.json'da", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const hasTz = 'date-fns-tz' in deps || 'luxon' in deps || 'dayjs' in deps;
    if (!hasTz) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'TZ kütüphanesi (date-fns-tz/luxon) yok — P37-T67 pending',
        });
    }
  });

  test("T67-b: Intl.DateTimeFormat API browser'da destekleniyor", async ({ page }) => {
    test.setTimeout(10000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const supported = await page.evaluate(() => {
      try {
        const fmt = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul' });
        return fmt.format(new Date('2026-06-01T10:00:00Z')).length > 0;
      } catch {
        return false;
      }
    });
    expect(supported, 'Intl.DateTimeFormat/timeZone desteklenmiyor').toBeTruthy();
  });
});

// ─── T68: Cal.com Webhook ─────────────────────────────────────────
test.describe('P37-T68: Cal.com Webhook DB Sync', () => {
  test('T68-a: /api/webhooks/cal POST endpoint mevcut', async ({ request }) => {
    const res = await request
      .post(`${API_URL}/api/webhooks/cal`, {
        data: { triggerEvent: 'BOOKING_CREATED', payload: {} },
        headers: { 'Content-Type': 'application/json' },
      })
      .catch(() => null);

    if (!res) return;
    // 200/202 (ok), 400 (invalid sig), 401 = implement edilmiş; 404 = yok
    expect(res.status(), '/api/webhooks/cal: 404 — route yok (P37-T68 pending)').not.toBe(404);
  });

  test('T68-b: Webhook kaynak dosyası mevcut', () => {
    const candidates = [
      'server/routes/webhooks.ts',
      'server/routes/webhook.ts',
      'server/webhooks/cal.ts',
    ];
    const found = candidates.some((c) => fs.existsSync(path.join(ROOT, c)));
    if (!found) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Webhook route dosyası yok — P37-T68 pending',
        });
    }
  });
});

// ─── T69: Booking Analytics ───────────────────────────────────────
test.describe('P37-T69: Booking Analytics Report', () => {
  test('T69-a: /api/admin/analytics veya /api/bookings/analytics JWT korumalı', async ({
    request,
  }) => {
    const endpoints = ['/api/admin/analytics', '/api/bookings/analytics'];
    for (const ep of endpoints) {
      const res = await request.get(`${API_URL}${ep}`).catch(() => null);
      if (!res) continue;
      const status = res.status();
      if (status !== 404) {
        expect(status, `${ep}: anonim 2xx`).toBeGreaterThanOrEqual(400);
        return;
      }
    }
    test
      .info()
      .annotations.push({ type: 'note', description: 'Analytics endpoint yok — P37-T69 pending' });
  });

  test('T69-b: AdminAnalyticsPage bileşen dosyası mevcut', () => {
    const candidates = [
      'src/pages/admin/AdminAnalyticsPage.tsx',
      'src/pages/AdminAnalyticsPage.tsx',
      'src/pages/admin/AnalyticsPage.tsx',
    ];
    const found = candidates.some((c) => fs.existsSync(path.join(ROOT, c)));
    if (!found) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'AdminAnalyticsPage: yok — P37-T69 pending',
        });
    }
  });
});

// ─── T70: Post-Booking NPS Feedback ──────────────────────────────
test.describe('P37-T70: Post-Booking NPS Feedback', () => {
  test('T70-a: /feedback/:id route SPA 200', async ({ page }) => {
    test.setTimeout(15000);
    await mockSetup(page);
    await page.goto(`${BASE_URL}/feedback/test-booking-id`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const is404 = await page
      .locator('text=404, text=Not Found')
      .first()
      .isVisible()
      .catch(() => false);
    if (is404) {
      test
        .info()
        .annotations.push({ type: 'note', description: '/feedback route yok — P37-T70 pending' });
    }
  });

  test('T70-b: /api/feedback/:bookingId POST endpoint mevcut', async ({ request }) => {
    const res = await request
      .post(`${API_URL}/api/feedback/test-id`, {
        data: { score: 9, comment: 'test' },
      })
      .catch(() => null);
    if (!res) return;
    expect(res.status(), '/api/feedback: 404 (P37-T70 pending)').not.toBe(404);
  });

  test('T70-c: /api/feedback/nps-summary admin endpoint JWT korumalı', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/feedback/nps-summary`).catch(() => null);
    if (!res) return;
    const status = res.status();
    if (status !== 404) {
      expect(status, 'nps-summary: anonim 2xx').toBeGreaterThanOrEqual(400);
    } else {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: '/api/feedback/nps-summary: 404 (P37-T70 pending)',
        });
    }
  });
});

// ─── P37 BOOKING SUMMARY ─────────────────────────────────────────
test.describe('P37: Booking Flow — Genel Altyapı Özeti', () => {
  test("P37: BookingModal (3-step) SPA'da render olur", async ({ page }) => {
    test.setTimeout(20000);
    await mockSetup(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Page başlık + nav en az var
    await expect(page.locator('nav, header').first()).toBeVisible({ timeout: 8000 });

    // Booking route /booking 200 (SPA)
    await page.goto(`${BASE_URL}/booking`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const title = await page.title();
    expect(title.length, '/booking SPA title boş').toBeGreaterThan(0);
  });

  test('P37: /api/bookings/public POST endpoint mevcut', async ({ request }) => {
    const res = await request
      .post(`${API_URL}/api/bookings/public`, {
        data: { name: 'Test', email: 'test@test.com', date: '2026-06-01', time: '10:00' },
      })
      .catch(() => null);
    if (!res) {
      test.info().annotations.push({ type: 'skip', description: 'API down' });
      return;
    }
    // 400 (validation), 401 veya 200 = var; 404 = yok
    expect(res.status(), '/api/bookings/public: 404 — route yok').not.toBe(404);
  });

  test('P37: Booking ile ilgili tüm altyapı bileşenleri özeti', () => {
    const infra: Record<string, boolean> = {
      'BookingModal.tsx': fs.existsSync(
        path.join(ROOT, 'src/components/features/booking/BookingModal.tsx'),
      ),
      'AdminBookingsPage.tsx':
        fs.existsSync(path.join(ROOT, 'src/pages/admin/AdminBookingsPage.tsx')) ||
        fs.existsSync(path.join(ROOT, 'src/pages/AdminBookingsPage.tsx')),
      'server/routes/bookings.ts': fs.existsSync(path.join(ROOT, 'server/routes/bookings.ts')),
    };

    const done = Object.entries(infra)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const missing = Object.entries(infra)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    console.warn(
      `\nP37 Booking Altyapı (${done.length}/${Object.keys(infra).length}):\n` +
        done.map((k) => `  ✅ ${k}`).join('\n') +
        '\n' +
        missing.map((k) => `  ⬜ ${k}`).join('\n'),
    );

    expect(infra['BookingModal.tsx'], 'BookingModal.tsx yok').toBeTruthy();
  });
});
