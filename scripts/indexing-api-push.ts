#!/usr/bin/env tsx
/**
 * P31-T07: Google Indexing API — Dynamic URL Push
 *
 * Bulk-notifies Google about new/updated URLs via the official Indexing API.
 * Supports both URL_UPDATED and URL_DELETED notification types.
 *
 * Setup:
 *   1. Google Cloud Console → enable "Indexing API"
 *   2. Create Service Account → JSON key → download
 *   3. Add to .env:  GOOGLE_INDEXING_KEY_PATH=./secrets/indexing-key.json
 *   4. GSC: Add service account email as "Owner" of the property
 *   5. Run:  npm run seo:index
 *
 * Usage:  npm run seo:index [--type URL_DELETED]
 * Rate:   200 req/day default quota (can request increase)
 * Exit:   0 = all pushed | 1 = error
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname ?? process.cwd(), '..');
const SITEMAP_PATH = join(ROOT, 'public', 'sitemap.xml');
const KEY_PATH = process.env.GOOGLE_INDEXING_KEY_PATH;
const INDEXING_API = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const NOTIFICATION_TYPE = (
  process.argv.includes('--type') ? process.argv[process.argv.indexOf('--type') + 1] : 'URL_UPDATED'
) as 'URL_UPDATED' | 'URL_DELETED';

// ── JWT helper (minimal, no googleapis dep needed) ────────────────────────────
async function getAccessToken(keyPath: string): Promise<string> {
  const keyData = JSON.parse(readFileSync(keyPath, 'utf-8')) as {
    client_email: string;
    private_key: string;
  };

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: keyData.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');

  const unsigned = `${encode(header)}.${encode(claim)}`;

  // Node 18+ native crypto
  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(keyData.private_key, 'base64url');
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`OAuth failed: ${data.error}`);
  return data.access_token;
}

// ── Parse sitemap URLs ────────────────────────────────────────────────────────
function parseSitemapUrls(path: string): string[] {
  try {
    const xml = readFileSync(path, 'utf-8');
    return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi), (m) => m[1].trim());
  } catch {
    console.error('  ⚠️  sitemap.xml not found — run `npm run build` first.');
    return [];
  }
}

// ── Push single URL ───────────────────────────────────────────────────────────
async function pushUrl(
  url: string,
  token: string,
  type: 'URL_UPDATED' | 'URL_DELETED',
): Promise<{ url: string; ok: boolean; status: number }> {
  try {
    const res = await fetch(INDEXING_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, type }),
      signal: AbortSignal.timeout(10_000),
    });
    return { url, ok: res.ok, status: res.status };
  } catch {
    return { url, ok: false, status: 0 };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  if (!KEY_PATH) {
    console.error('\n  ❌ GOOGLE_INDEXING_KEY_PATH not set in .env');
    console.error('     Steps:');
    console.error('     1. Google Cloud → enable Indexing API');
    console.error('     2. Service Account → JSON key → save to ./secrets/indexing-key.json');
    console.error('     3. Add service account as GSC "Owner"');
    console.error('     4. Set GOOGLE_INDEXING_KEY_PATH=./secrets/indexing-key.json\n');
    process.exit(1);
  }

  const urls = parseSitemapUrls(SITEMAP_PATH);
  if (urls.length === 0) {
    console.error('  ❌ No URLs parsed from sitemap.');
    process.exit(1);
  }

  console.log(`\n🔍 Google Indexing API Push`);
  console.log(`   Type    : ${NOTIFICATION_TYPE}`);
  console.log(`   URLs    : ${urls.length}`);
  console.log('   Getting OAuth token…\n');

  let token: string;
  try {
    token = await getAccessToken(KEY_PATH);
    console.log('  ✅ OAuth token obtained\n');
  } catch (err) {
    console.error('  ❌ OAuth error:', (err as Error).message);
    process.exit(1);
  }

  // Respect 200 req/day quota: batch with 500ms delay between calls
  let success = 0;
  let failed = 0;

  for (let i = 0; i < urls.length; i++) {
    const result = await pushUrl(urls[i], token, NOTIFICATION_TYPE);
    if (result.ok) {
      success++;
      console.log(`  ✅ [${i + 1}/${urls.length}] ${result.url}`);
    } else {
      failed++;
      console.error(`  ❌ [${i + 1}/${urls.length}] ${result.url} — HTTP ${result.status}`);
    }
    // Throttle: 200ms between requests
    if (i < urls.length - 1) await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Pushed  : ${success}`);
  console.log(`  Failed  : ${failed}`);
  console.log(`${'─'.repeat(60)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
