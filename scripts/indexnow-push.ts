#!/usr/bin/env tsx
/**
 * P31-T09: IndexNow Protocol — Bing/Yandex/Seznam bulk URL push
 *
 * IndexNow = single API call notifies Bing + Yandex + Seznam simultaneously.
 * Zero quota, near-instant crawl trigger for updated pages.
 *
 * Setup:
 *   1. Generate key:  openssl rand -hex 16
 *   2. Add to .env:   INDEXNOW_KEY=<your-key>
 *   3. Create:        public/<your-key>.txt  (content = the key itself)
 *   4. Run:           npm run seo:indexnow
 *
 * Usage:  npm run seo:indexnow [--urls url1,url2,...]
 * Exit:   0 = success | 1 = error
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname ?? process.cwd(), '..');
const SITEMAP_PATH = join(ROOT, 'public', 'sitemap.xml');
const HOST = process.env.VITE_PROD_URL?.replace(/^https?:\/\//, '') ?? 'www.ecypro.com';
const KEY = process.env.INDEXNOW_KEY;
const API_ENDPOINT = 'https://api.indexnow.org/indexnow';

// ── Parse sitemap for URL list ────────────────────────────────────────────────
function parseUrlsFromSitemap(path: string): string[] {
  try {
    const xml = readFileSync(path, 'utf-8');
    const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/gi);
    return Array.from(matches, (m) => m[1].trim());
  } catch {
    console.error('  ⚠️  sitemap.xml not found — run `npm run build` first.');
    return [];
  }
}

// ── CLI: --urls override ──────────────────────────────────────────────────────
function parseCliUrls(): string[] | null {
  const idx = process.argv.indexOf('--urls');
  if (idx === -1) return null;
  const raw = process.argv[idx + 1];
  if (!raw) return null;
  return raw
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

// ── Push to IndexNow API ──────────────────────────────────────────────────────
async function pushToIndexNow(urls: string[]): Promise<void> {
  if (!KEY) {
    console.error('  ❌ INDEXNOW_KEY env variable not set.');
    console.error('     Steps: openssl rand -hex 16 → add to .env + public/<key>.txt');
    process.exit(1);
  }

  const keyLocation = `https://${HOST}/${KEY}.txt`;
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation, urlList: urls });

  console.log(`\n📡 IndexNow Push`);
  console.log(`   Host     : ${HOST}`);
  console.log(`   Endpoint : ${API_ENDPOINT}`);
  console.log(`   URLs     : ${urls.length}`);

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok || res.status === 200 || res.status === 202) {
      console.log(`\n  ✅ IndexNow accepted — status ${res.status}`);
      console.log(`     Notified engines: Bing, Yandex, Seznam`);
    } else if (res.status === 400) {
      console.error(`  ❌ Bad Request (400) — check URL format or key.`);
      process.exit(1);
    } else if (res.status === 403) {
      console.error(`  ❌ Forbidden (403) — key file not accessible at ${keyLocation}`);
      process.exit(1);
    } else if (res.status === 422) {
      console.error(`  ❌ Unprocessable (422) — URLs belong to different host.`);
      process.exit(1);
    } else if (res.status === 429) {
      console.warn(`  ⚠️  Too many requests (429) — wait and retry.`);
    } else {
      console.warn(`  ⚠️  Unexpected status: ${res.status}`);
    }
  } catch (err) {
    console.error('  ❌ Network error:', (err as Error).message);
    process.exit(1);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const urls = parseCliUrls() ?? parseUrlsFromSitemap(SITEMAP_PATH);

  if (urls.length === 0) {
    console.error('  ❌ No URLs to push.');
    process.exit(1);
  }

  // IndexNow limit: 10,000 URLs per call
  const CHUNK = 10_000;
  for (let i = 0; i < urls.length; i += CHUNK) {
    await pushToIndexNow(urls.slice(i, i + CHUNK));
  }

  console.log(`\n  Total pushed: ${urls.length} URL(s)\n`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
