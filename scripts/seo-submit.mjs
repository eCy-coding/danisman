#!/usr/bin/env node
/**
 * scripts/seo-submit.mjs — P12/4
 *
 * Submits a batch of URLs to IndexNow (Bing + Yandex + Seznam + Naver shared
 * endpoint). Reads the IndexNow key from `INDEXNOW_KEY` env or `public/<key>.txt`
 * naming convention. Pings the URL list at `outputs/seo-urls.txt` (one URL
 * per line) or every URL in `dist/sitemap.xml` when no list is provided.
 *
 * Usage:
 *   INDEXNOW_KEY=<32char> node scripts/seo-submit.mjs
 *   node scripts/seo-submit.mjs outputs/seo-urls.txt
 *
 * Docs: https://www.indexnow.org/documentation
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const HOST = 'www.ecypro.com';
const KEY_LOCATION = `https://${HOST}/${process.env.INDEXNOW_KEY ?? 'REPLACE_WITH_REAL_INDEXNOW_KEY_32_CHARS'}.txt`;
const ENDPOINT = 'https://api.indexnow.org/IndexNow';

async function loadUrls() {
  const arg = process.argv[2];
  if (arg) {
    const text = await fs.readFile(arg, 'utf8');
    return text.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  // Fall back to sitemap-index parsing.
  try {
    const sm = await fs.readFile(path.join('dist', 'sitemap.xml'), 'utf8');
    return [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  } catch {
    console.error('No URL list given and no dist/sitemap.xml found. Aborting.');
    process.exit(1);
  }
}

async function main() {
  const key = process.env.INDEXNOW_KEY;
  if (!key || key === 'REPLACE_WITH_REAL_INDEXNOW_KEY_32_CHARS') {
    console.error('Set INDEXNOW_KEY (32 hex chars) before calling.');
    process.exit(1);
  }
  const urlList = await loadUrls();
  if (urlList.length === 0) {
    console.error('No URLs to submit.');
    process.exit(1);
  }

  const body = {
    host: HOST,
    key,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  console.log(`[IndexNow] ${res.status} — ${res.statusText} (${urlList.length} URLs)`);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error(txt.slice(0, 400));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
