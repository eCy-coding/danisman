/**
 * Track 4 / F4 — hreflang self-validator (Google-compliant).
 *
 * eCyPro is a client-rendered SPA: the hreflang <link> alternates are injected
 * into <head> AFTER hydration by SeoManager (via the seo-helmet shim). A plain
 * `fetch` + jsdom would only see the single static x-default baked into
 * index.html and report a false negative — so this validator drives a real
 * (headless Chromium) render and reads the hydrated DOM, exactly as Googlebot's
 * WRS does.
 *
 * Per page it checks the Google hreflang contract:
 *   - tr-TR alternate present,
 *   - en alternate present,
 *   - x-default alternate present,
 *   - every href is an absolute https URL,
 *   - the current locale is self-referenced (its alternate exists).
 *
 * Usage:
 *   npx tsx scripts/qa/hreflang-validator.ts
 *   BASE_URL=https://ecypro.com npx tsx scripts/qa/hreflang-validator.ts
 *
 * Exit code 0 = all green, 1 = at least one page failed (CI-friendly).
 */

import { chromium, type Browser } from '@playwright/test';

const BASE = (process.env.BASE_URL || 'http://localhost:4173').replace(/\/$/, '');
const LOCALES = ['tr', 'en'] as const;
const PATHS = ['', '/services', '/pricing', '/about'] as const;
const SETTLE_MS = 3500;

interface Alternate {
  hreflang: string | null;
  href: string | null;
}

interface PageResult {
  url: string;
  locale: string;
  alternates: Alternate[];
  checks: {
    hasTrTr: boolean;
    hasEn: boolean;
    hasXDefault: boolean;
    allHrefsAbsolute: boolean;
    selfReferenced: boolean;
  };
  pass: boolean;
}

async function validatePage(browser: Browser, locale: string, path: string): Promise<PageResult> {
  const url = `${BASE}/${locale}${path}`;
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(SETTLE_MS);
    const alternates: Alternate[] = await page.$$eval('link[rel="alternate"][hreflang]', (els) =>
      els.map((el) => ({
        hreflang: el.getAttribute('hreflang'),
        href: el.getAttribute('href'),
      })),
    );

    const langs = alternates.map((a) => a.hreflang);
    const hasTrTr = langs.includes('tr-TR');
    const hasEn = langs.includes('en');
    const hasXDefault = langs.includes('x-default');
    const allHrefsAbsolute =
      alternates.length > 0 && alternates.every((a) => !!a.href && /^https:\/\/\S+/.test(a.href));
    // Self-reference: the current locale must have a matching alternate.
    const selfLang = locale === 'tr' ? 'tr-TR' : 'en';
    const selfReferenced = langs.includes(selfLang);

    const pass = hasTrTr && hasEn && hasXDefault && allHrefsAbsolute && selfReferenced;

    return {
      url,
      locale,
      alternates,
      checks: { hasTrTr, hasEn, hasXDefault, allHrefsAbsolute, selfReferenced },
      pass,
    };
  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const results: PageResult[] = [];
  try {
    for (const locale of LOCALES) {
      for (const path of PATHS) {
        results.push(await validatePage(browser, locale, path));
      }
    }
  } finally {
    await browser.close();
  }

  const tick = (b: boolean) => (b ? '✓' : '✗');
  console.log(`\nhreflang validator — target: ${BASE}\n`);
  console.log('PAGE'.padEnd(34), 'tr-TR en  x-def abs  self  RESULT');
  for (const r of results) {
    const c = r.checks;
    console.log(
      `/${r.locale}${r.url.slice(`${BASE}/${r.locale}`.length)}`.padEnd(34),
      `  ${tick(c.hasTrTr)}    ${tick(c.hasEn)}   ${tick(c.hasXDefault)}    ${tick(c.allHrefsAbsolute)}    ${tick(c.selfReferenced)}   ${r.pass ? 'PASS' : 'FAIL'}`,
    );
  }

  const failed = results.filter((r) => !r.pass);
  const summary = {
    target: BASE,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    pages: results,
  };
  console.log(
    `\n${failed.length === 0 ? '✅ GREEN' : '❌ RED'} — ${summary.passed}/${summary.total} pages compliant\n`,
  );

  // Machine-readable artifact for the report / CI.
  const { writeFileSync, mkdirSync } = await import('node:fs');
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/hreflang-validation.json', JSON.stringify(summary, null, 2));

  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('[hreflang-validator] fatal:', err);
  process.exit(1);
});
