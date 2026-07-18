/**
 * e2e/global-setup.ts
 * Playwright Global Setup — Sunucu Isınma + Sağlık Kontrolü
 *
 * playwright.config.ts → globalSetup: './e2e/global-setup.ts'
 *
 * Görevler:
 * 1. Preview server (4173) hazır olana kadar bekle
 * 2. Mock server (3001) hazır olana kadar bekle
 * 3. Kritik endpoint'leri ön-ısıt (cache warming)
 * 4. Ortam değişkenlerini doğrula
 */

import { chromium, type FullConfig } from '@playwright/test';
import { MOCK_URL } from './mock-url';

const PREVIEW_URL = 'http://localhost:4173';
const MOCK_API_URL = `${MOCK_URL}/__health`;
const MAX_WAIT_MS = 60_000;
const POLL_MS = 1_000;

async function waitForServer(url: string, name: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  let lastError = '';

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3_000) });
      if (res.ok || res.status < 500) {
        console.warn(`[global-setup] ✅ ${name} hazır (${Date.now() - start}ms)`);
        return;
      }
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : String(e);
    }
    await new Promise((res) => setTimeout(res, POLL_MS));
  }

  console.warn(
    `[global-setup] ⚠️ ${name} ${timeoutMs}ms içinde hazır olmadı. Son hata: ${lastError}`,
  );
}

async function warmCache(
  page: Awaited<ReturnType<typeof chromium.launch>>['contexts'][0]['pages'][0],
): Promise<void> {
  const criticalRoutes = ['/', '/blog', '/services', '/pricing', '/about'];
  console.warn('[global-setup] 🔥 Cache ısıtma başladı…');

  for (const route of criticalRoutes) {
    try {
      await page.goto(`${PREVIEW_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });
    } catch {
      // Cache warming hatası kritik değil
    }
  }
  console.warn(`[global-setup] 🔥 Cache ısıtma tamamlandı (${criticalRoutes.length} sayfa)`);
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  console.warn('\n[global-setup] 🚀 EcyPro E2E Global Setup başlıyor…');
  const t0 = Date.now();

  // 1. Ortam kontrolü
  const isCI = !!process.env.CI;
  console.warn(`[global-setup] Ortam: ${isCI ? 'CI' : 'local'}, Node ${process.version}`);

  // 2. Preview sunucusu hazır mı?
  await waitForServer(PREVIEW_URL, 'Preview Server (4173)', MAX_WAIT_MS);

  // 3. Mock API hazır mı? (opsiyonel — başlatılmamış olabilir)
  await waitForServer(MOCK_API_URL, 'Mock API (3001)', 10_000).catch(() =>
    console.warn("[global-setup] ⚠️ Mock API başlatılmamış — bazı testler mock'suz çalışır"),
  );

  // 4. Cache warming (sadece local'de, CI'de yavaşlatır)
  if (!isCI) {
    const browser = await chromium.launch({
      headless: true,
      ...(process.env.PW_BROWSER_CHANNEL ? { channel: process.env.PW_BROWSER_CHANNEL } : {}),
    });
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();

    // Dış servisleri mock et (warmup sırasında 429 riski)
    await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
    await page.route('**/api.telegram.org/**', (r) => r.fulfill({ status: 200 }));
    await page.route('**/api/geo/**', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { country: 'TR', flag: '🇹🇷', currency: 'TRY', suggestedLang: 'tr' },
        }),
      }),
    );

    await warmCache(page);
    await browser.close();
  }

  console.warn(`[global-setup] ✅ Setup tamamlandı (${Date.now() - t0}ms)\n`);
}
