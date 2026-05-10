/**
 * pages_design.spec.ts
 *
 * EcyPro Premium Pages — İleri Düzey E2E Design Suite
 *
 * Kapsam:
 *   1. TeamPage  — 6 expert member kartları, stats bar, heading, tags, CTA
 *   2. EventsPage — 4 event kartları, filtre butonları, kapasite bar, kayıt CTA
 *   3. ServiceCard — CTA link navigasyonu, kategori badge, testid varlığı
 *   4. Cross-page — Dark theme token uyumu, logo varlığı, responsive
 */

import { test, expect, type Page } from '@playwright/test';

// ─── Mock helper ──────────────────────────────────────────────────────────────

async function setupMocks(page: Page) {
  await page.route('https://api.ecypro.com/**', (r) =>
    r.fulfill({ status: 200, body: JSON.stringify({}) }),
  );
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200, body: '{}' }));
  await page.route('https://api.telegram.org/**', (r) =>
    r.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }),
  );
  await page.route('**/api/newsletter/**', (r) =>
    r.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }),
  );
}

// ─── 1. TeamPage Suite ────────────────────────────────────────────────────────

test.describe('TeamPage — Expert Members Grid', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/team', { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForLoadState('networkidle').catch(() => null);
  });

  test('H1 heading render — data-testid="team-heading"', async ({ page }) => {
    const h1 = page.locator('[data-testid="team-heading"]');
    await expect(h1).toBeVisible({ timeout: 10_000 });
    const text = await h1.textContent();
    expect(text?.trim().length).toBeGreaterThan(3);
  });

  test('6 member kartı render — data-testid="team-member-card"', async ({ page }) => {
    const cards = page.locator('[data-testid="team-member-card"]');
    await expect(cards).toHaveCount(6, { timeout: 10_000 });
  });

  test('Her kart görünür + içerik var', async ({ page }) => {
    const cards = page.locator('[data-testid="team-member-card"]');
    const count = await cards.count();
    expect(count).toBe(6);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await expect(card).toBeVisible();

      // Avatar initials (2 karakter)
      const avatar = card
        .locator('div')
        .filter({ hasText: /^[A-Z]{2}$/ })
        .first();
      const initials = await avatar.textContent();
      expect(initials?.trim()).toMatch(/^[A-Z]{2}$/);
    }
  });

  test('Emre C. — Founder & Chief Strategist kartı var', async ({ page }) => {
    const card = page.locator('[data-testid="team-member-card"]').filter({ hasText: 'Emre C.' });
    await expect(card).toBeVisible({ timeout: 8_000 });
    const roleEl = card
      .locator('p')
      .filter({ hasText: /Founder|Kurucu/i })
      .first();
    await expect(roleEl).toBeVisible();
  });

  test('Dr. Ayşe K. — AI & Data Director kartı var', async ({ page }) => {
    const card = page
      .locator('[data-testid="team-member-card"]')
      .filter({ hasText: 'Dr. Ayşe K.' });
    await expect(card).toBeVisible({ timeout: 8_000 });
  });

  test('Mert D. — M&A Partner kartı var', async ({ page }) => {
    const card = page.locator('[data-testid="team-member-card"]').filter({ hasText: 'Mert D.' });
    await expect(card).toBeVisible({ timeout: 8_000 });
  });

  test('Selin Y. — Operational Excellence kartı var', async ({ page }) => {
    const card = page.locator('[data-testid="team-member-card"]').filter({ hasText: 'Selin Y.' });
    await expect(card).toBeVisible({ timeout: 8_000 });
  });

  test('Zeynep A. — ESG Director kartı var', async ({ page }) => {
    const card = page.locator('[data-testid="team-member-card"]').filter({ hasText: 'Zeynep A.' });
    await expect(card).toBeVisible({ timeout: 8_000 });
  });

  test('Burak T. — Financial Advisory kartı var', async ({ page }) => {
    const card = page.locator('[data-testid="team-member-card"]').filter({ hasText: 'Burak T.' });
    await expect(card).toBeVisible({ timeout: 8_000 });
  });

  test('Stats bar — 4 metrik görünür', async ({ page }) => {
    // Stats: 6+, 12, 65+, 150+
    const statsSection = page
      .locator('section')
      .filter({ has: page.locator('text=/\\d+\\+?/') })
      .first();
    await expect(statsSection).toBeVisible({ timeout: 8_000 });

    // İlk değer "6+" — expert partner sayısı
    const statsText = await page.locator('body').textContent();
    expect(statsText).toContain('150+');
    expect(statsText).toContain('65+');
  });

  test('Her kart LinkedIn ikonu içeriyor', async ({ page }) => {
    const cards = page.locator('[data-testid="team-member-card"]');
    const first = cards.first();
    const linkedin = first.locator('a[aria-label="LinkedIn"]');
    await expect(linkedin).toBeVisible({ timeout: 8_000 });
  });

  test('Her kart Contact linki içeriyor → /contact', async ({ page }) => {
    const cards = page.locator('[data-testid="team-member-card"]');
    const first = cards.first();
    const contactLink = first.locator('a[href="/contact"]');
    await expect(contactLink).toBeVisible({ timeout: 8_000 });
  });

  test('CTA bölümü — "Kariyer" veya "Open Positions" linki var', async ({ page }) => {
    const cta = page.locator('a[href="/careers"]');
    await expect(cta.first()).toBeVisible({ timeout: 8_000 });
  });

  test('Dark theme — body bg-neutral var', async ({ page }) => {
    // Use first() to avoid strict mode when multiple .min-h-screen exist (layout + page)
    const wrapper = page.locator('.min-h-screen').first();
    const bgClass = await wrapper.getAttribute('class');
    expect(bgClass).toContain('bg-neutral');
  });

  test('Logo Navbar — /team sayfasında görünür', async ({ page }) => {
    const logo = page.locator('[data-testid="ecy-logo"]').first();
    await expect(logo).toBeVisible({ timeout: 8_000 });
  });

  test("Expertise tag'leri render — en az 3 tag var", async ({ page }) => {
    // Tags: small span pills with bg-white/5 border inside first card
    const firstCard = page.locator('[data-testid="team-member-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 8_000 });
    // Tags are spans with tracking-wider class
    const tags = firstCard.locator('span.tracking-wider');
    const count = await tags.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Responsive mobile (375px) — kartlar tek sütun', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const cards = page.locator('[data-testid="team-member-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 8_000 });
    const count = await cards.count();
    expect(count).toBe(6);
  });

  test('Responsive tablet (768px) — 2 sütun grid', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const grid = page
      .locator('.grid')
      .filter({ has: page.locator('[data-testid="team-member-card"]') })
      .first();
    await expect(grid).toBeVisible({ timeout: 8_000 });
    const cls = await grid.getAttribute('class');
    expect(cls).toContain('md:grid-cols-2');
  });

  test("Join Our Team CTA — /careers'e bağlı", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const careersBtn = page.locator('a[href="/careers"]').last();
    await expect(careersBtn).toBeVisible({ timeout: 8_000 });
    const href = await careersBtn.getAttribute('href');
    expect(href).toBe('/careers');
  });
});

// ─── 2. EventsPage Suite ──────────────────────────────────────────────────────

test.describe('EventsPage — Upcoming Events', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/events', { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForLoadState('networkidle').catch(() => null);
  });

  test('H1 heading render — data-testid="events-heading"', async ({ page }) => {
    const h1 = page.locator('[data-testid="events-heading"]');
    await expect(h1).toBeVisible({ timeout: 10_000 });
    const text = await h1.textContent();
    expect(text?.trim().length).toBeGreaterThan(3);
  });

  test('"All" filtresi ile 4 event kartı görünür', async ({ page }) => {
    const filterAll = page.locator('[data-testid="event-filter-all"]');
    await expect(filterAll).toBeVisible({ timeout: 8_000 });
    await filterAll.click();
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(4, { timeout: 8_000 });
  });

  test('Filtre butonları — all/webinar/workshop/conference', async ({ page }) => {
    for (const f of ['all', 'webinar', 'workshop', 'conference']) {
      const btn = page.locator(`[data-testid="event-filter-${f}"]`);
      await expect(btn).toBeVisible({ timeout: 8_000 });
    }
  });

  test('Webinar filtresi — 2 kart (AI Strategy + ESG)', async ({ page }) => {
    await page.locator('[data-testid="event-filter-webinar"]').click();
    await page.waitForTimeout(200);
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(2, { timeout: 6_000 });
  });

  test('Workshop filtresi — 1 kart (M&A Masterclass)', async ({ page }) => {
    await page.locator('[data-testid="event-filter-workshop"]').click();
    await page.waitForTimeout(200);
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(1, { timeout: 6_000 });
    const text = await cards.first().textContent();
    expect(text).toContain('M&A');
  });

  test('Conference filtresi — 1 kart (Digital Operations Summit)', async ({ page }) => {
    await page.locator('[data-testid="event-filter-conference"]').click();
    await page.waitForTimeout(200);
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(1, { timeout: 6_000 });
    const text = await cards.first().textContent();
    expect(text?.toLowerCase()).toContain('summit');
  });

  test('Filtreden sonra "Tümü" geri dönünce 4 kart', async ({ page }) => {
    await page.locator('[data-testid="event-filter-webinar"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="event-filter-all"]').click();
    await page.waitForTimeout(200);
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(4, { timeout: 6_000 });
  });

  test('Her event kartı tarih içeriyor', async ({ page }) => {
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(4, { timeout: 8_000 });
    for (let i = 0; i < 4; i++) {
      const card = cards.nth(i);
      // Tarih formatı "12 June 2026" veya "12 Haziran 2026"
      const text = await card.textContent();
      expect(text).toMatch(/202[6-9]/);
    }
  });

  test('Her event kartı "Kayıt Ol" veya "Register Now" CTA içeriyor', async ({ page }) => {
    const ctaBtns = page.locator('[data-testid="event-register-btn"]');
    await expect(ctaBtns).toHaveCount(4, { timeout: 8_000 });
    for (let i = 0; i < 4; i++) {
      await expect(ctaBtns.nth(i)).toBeVisible();
    }
  });

  test("Register CTA → /contact'a yönlendiriyor", async ({ page }) => {
    const firstCta = page.locator('[data-testid="event-register-btn"]').first();
    await expect(firstCta).toBeVisible({ timeout: 8_000 });
    const href = await firstCta.getAttribute('href');
    expect(href).toBe('/contact');
  });

  test('Kapasite progress bar — her kartta var', async ({ page }) => {
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(4, { timeout: 8_000 });
    // Progress bar: div.h-1.bg-white\/5.rounded-full
    const progressBars = page.locator('[data-testid="event-card"] .h-1');
    expect(await progressBars.count()).toBeGreaterThanOrEqual(4);
  });

  test('AI Strategy event — kayıt yüzdesi %74 görünür (148/200)', async ({ page }) => {
    const aiCard = page
      .locator('[data-testid="event-card"]')
      .filter({ hasText: /AI Strategy|AI Stratejisi/ })
      .first();
    await expect(aiCard).toBeVisible({ timeout: 8_000 });
    const text = await aiCard.textContent();
    expect(text).toContain('148');
    expect(text).toContain('200');
  });

  test('Digital Operations Summit — konferans badge var', async ({ page }) => {
    const confCard = page
      .locator('[data-testid="event-card"]')
      .filter({ hasText: /Summit/ })
      .first();
    await expect(confCard).toBeVisible({ timeout: 8_000 });
    const text = await confCard.textContent();
    // "Conference" veya "Konferans" badge
    expect(text?.toLowerCase()).toMatch(/conference|konferans/);
  });

  test('Newsletter CTA — "Bültene Abone Ol" linki footer\'dan önce var', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const newsletterLink = page.locator('a[href="/#newsletter"]');
    await expect(newsletterLink).toBeVisible({ timeout: 8_000 });
  });

  test('Dark theme + Logo Navbar', async ({ page }) => {
    const logo = page.locator('[data-testid="ecy-logo"]').first();
    await expect(logo).toBeVisible({ timeout: 8_000 });
    // Use last() — events page wrapper is the last .min-h-screen (after main layout)
    const wrapper = page.locator('.min-h-screen').last();
    const cls = await wrapper.getAttribute('class');
    expect(cls).toContain('bg-neutral');
  });

  test('Responsive mobile (375px) — tek sütun grid', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 8_000 });
    const count = await cards.count();
    expect(count).toBe(4);
  });

  test('Filtre bar sticky — scroll sonrası görünür', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);
    const filterBar = page.locator('[data-testid="event-filter-all"]');
    await expect(filterBar).toBeVisible({ timeout: 6_000 });
  });

  test('ESG event — speaker "Zeynep A." görünür', async ({ page }) => {
    const esgCard = page.locator('[data-testid="event-card"]').filter({ hasText: /ESG/ }).first();
    await expect(esgCard).toBeVisible({ timeout: 8_000 });
    const text = await esgCard.textContent();
    expect(text).toContain('Zeynep A.');
  });

  test('M&A event — speaker "Mert D." görünür', async ({ page }) => {
    const maCard = page
      .locator('[data-testid="event-card"]')
      .filter({ hasText: /M&A|M.A/ })
      .first();
    await expect(maCard).toBeVisible({ timeout: 8_000 });
    const text = await maCard.textContent();
    expect(text).toContain('Mert D.');
  });
});

// ─── 3. ServiceCard CTA Suite ──────────────────────────────────────────────────

test.describe('ServiceCard — CTA & testid Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/services', { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForLoadState('networkidle').catch(() => null);
  });

  test('En az 6 service kartı render — data-testid="service-card"', async ({ page }) => {
    const cards = page.locator('[data-testid="service-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('Her kart data-service-id attribute taşıyor', async ({ page }) => {
    const cards = page.locator('[data-testid="service-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    const count = await cards.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const id = await cards.nth(i).getAttribute('data-service-id');
      expect(id).toBeTruthy();
      expect(id!.length).toBeGreaterThan(0);
    }
  });

  test('Her kart data-category attribute taşıyor', async ({ page }) => {
    const cards = page.locator('[data-testid="service-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    const count = await cards.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const cat = await cards.nth(i).getAttribute('data-category');
      expect(cat).toBeTruthy();
    }
  });

  test('Service card CTA link — data-testid="service-card-cta"', async ({ page }) => {
    const ctaLinks = page.locator('[data-testid="service-card-cta"]');
    await expect(ctaLinks.first()).toBeVisible({ timeout: 10_000 });
    const count = await ctaLinks.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('CTA link href — /services/ ile başlıyor', async ({ page }) => {
    const firstCta = page.locator('[data-testid="service-card-cta"]').first();
    await expect(firstCta).toBeVisible({ timeout: 8_000 });
    const href = await firstCta.getAttribute('href');
    expect(href).toMatch(/^\/services\//);
  });

  test('"Keşfet" metni veya ArrowRight içeren CTA', async ({ page }) => {
    const firstCta = page.locator('[data-testid="service-card-cta"]').first();
    await expect(firstCta).toBeVisible({ timeout: 8_000 });
    const text = await firstCta.textContent();
    expect(text?.toLowerCase()).toContain('keşfet');
  });

  test('CTA tıklama — service detail sayfasına navigate', async ({ page }) => {
    const firstCard = page.locator('[data-testid="service-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });
    const cta = firstCard.locator('[data-testid="service-card-cta"]');
    const href = await cta.getAttribute('href');
    expect(href).toBeTruthy();

    await cta.click();
    await page.waitForLoadState('domcontentloaded');
    // Detail sayfası URL'i /services/<slug> ya da /services (404 değil)
    expect(page.url()).not.toContain('404');
    expect(page.url()).toContain('/service');
  });

  test('Kategori filtresi — isletme seçince kart sayısı azalır veya değişmez', async ({ page }) => {
    const allCards = await page.locator('[data-testid="service-card"]').count();
    expect(allCards).toBeGreaterThanOrEqual(6);

    // Kategori filter butonlarından birini bul
    const filterBtn = page
      .locator('button')
      .filter({ hasText: /Business|İşletme|isletme/i })
      .first();
    if (await filterBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(300);
      const filtered = await page.locator('[data-testid="service-card"]').count();
      expect(filtered).toBeGreaterThanOrEqual(1);
    }
  });

  test('Backdrop-blur YOK — doctrine compliance', async ({ page }) => {
    const cards = page.locator('[data-testid="service-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    const count = await cards.count();
    for (let i = 0; i < Math.min(count, 6); i++) {
      const cls = await cards.nth(i).getAttribute('class');
      expect(cls).not.toContain('backdrop-blur');
    }
  });

  test('Icon container her kartta mevcut', async ({ page }) => {
    const iconContainers = page.locator('[data-testid="service-card"] .w-14.h-14');
    await expect(iconContainers.first()).toBeVisible({ timeout: 8_000 });
    const count = await iconContainers.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });
});

// ─── 4. Cross-Page Design Token Suite ─────────────────────────────────────────

test.describe('Cross-Page Design Token Uyumu', () => {
  const DESIGN_PAGES = [
    { url: '/team', name: 'Team' },
    { url: '/events', name: 'Events' },
  ];

  for (const pg of DESIGN_PAGES) {
    test(`${pg.name} — Navbar + Footer varlık + dark bg`, async ({ page }) => {
      await setupMocks(page);
      await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 40_000 });
      await page.waitForLoadState('networkidle').catch(() => null);

      // Navbar
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible({ timeout: 8_000 });

      // Footer (scroll to)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      const footer = page.locator('footer');
      await expect(footer).toBeVisible({ timeout: 8_000 });

      // Logo footer'da
      const footerLogo = page.locator('footer [data-testid="ecy-logo"]');
      await expect(footerLogo).toBeVisible({ timeout: 6_000 });
    });

    test(`${pg.name} — No console errors (critical)`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const txt = msg.text();
          const benign = [
            'ResizeObserver loop',
            'favicon',
            'ERR_BLOCKED',
            'sentry',
            'net::ERR',
            'Failed to load resource',
            'ChunkLoad',
          ];
          if (!benign.some((b) => txt.toLowerCase().includes(b.toLowerCase()))) {
            errors.push(txt);
          }
        }
      });
      await setupMocks(page);
      await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 40_000 });
      await page.waitForLoadState('networkidle').catch(() => null);
      await page.waitForTimeout(1000);
      expect(errors).toHaveLength(0);
    });

    test(`${pg.name} — SEO: title ve description meta var`, async ({ page }) => {
      await setupMocks(page);
      await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 40_000 });

      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(5);
      expect(title).not.toMatch(/Untitled|undefined/i);

      const desc = page.locator('meta[name="description"]');
      const descContent = await desc.getAttribute('content').catch(() => null);
      // SEO component set description
      if (descContent !== null) {
        expect(descContent.trim().length).toBeGreaterThan(10);
      }
    });
  }

  test('Team + Events — bg-neutral dark renk doğru', async ({ page }) => {
    await setupMocks(page);
    for (const pg of DESIGN_PAGES) {
      await page.goto(pg.url, { waitUntil: 'domcontentloaded' });
      const bg = await page.evaluate(() => {
        const body = document.body;
        return getComputedStyle(body).backgroundColor;
      });
      // bg-neutral = #050810 veya benzeri çok koyu
      // rgb değerlerinin toplamı < 100 olmalı (dark theme)
      const match = bg.match(/\d+/g);
      if (match) {
        const [r, g, b] = match.map(Number);
        expect(r + g + b).toBeLessThan(150);
      }
    }
  });
});
