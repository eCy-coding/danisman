/**
 * P51.2 — IndexNow API submit script.
 *
 * Run via `npm run seo:indexnow` (CI ya da elle).
 * Sitemap.xml'i çeker, son N gün içinde lastmod güncellenmiş URL'leri tespit
 * eder, Bing IndexNow API'sine submit eder.
 *
 * Setup:
 *   1. Bing Webmaster Tools'a domain ekle
 *   2. IndexNow key oluştur (UUID-like string)
 *   3. `public/<KEY>.txt` dosyası oluştur, içeriğinde key olsun
 *   4. .env'de INDEXNOW_KEY=<KEY> set et
 *   5. `npm run seo:indexnow` çalıştır
 *
 * Sandbox build'a etki YOK — sadece manuel run.
 */

/* eslint-disable no-console */

const SITEMAP_URL = 'https://www.ecypro.com/sitemap.xml';
const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
const SITE_HOST = 'www.ecypro.com';
const KEY = process.env.INDEXNOW_KEY ?? '';
const KEY_LOCATION = process.env.INDEXNOW_KEY_LOCATION ?? `https://${SITE_HOST}/${KEY}.txt`;
const SINCE_DAYS = parseInt(process.env.INDEXNOW_SINCE_DAYS ?? '7', 10);

async function fetchSitemap(): Promise<string> {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  return await res.text();
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const urlBlocks = xml.matchAll(/<url>([\s\S]*?)<\/url>/g);
  for (const match of urlBlocks) {
    const block = match[1] ?? '';
    const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1];
    const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(block)?.[1];
    if (loc) entries.push({ loc, lastmod });
  }
  return entries;
}

function filterRecent(entries: SitemapEntry[]): string[] {
  const cutoff = Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000;
  return entries
    .filter((e) => {
      if (!e.lastmod) return true;
      const ts = new Date(e.lastmod).getTime();
      return Number.isFinite(ts) && ts >= cutoff;
    })
    .map((e) => e.loc);
}

async function submit(urlList: string[]): Promise<void> {
  if (!KEY) {
    console.error('[indexnow] INDEXNOW_KEY env not set; aborting.');
    process.exitCode = 1;
    return;
  }
  if (urlList.length === 0) {
    console.log('[indexnow] No URLs to submit (none updated within window).');
    return;
  }
  console.log(`[indexnow] Submitting ${urlList.length} URLs to IndexNow...`);

  const payload = {
    host: SITE_HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  const res = await fetch(INDEXNOW_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log(`[indexnow] HTTP ${res.status} ${res.statusText}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[indexnow] Response body: ${body.slice(0, 300)}`);
    process.exitCode = 1;
  } else {
    console.log(`[indexnow] ${urlList.length} URLs submitted successfully.`);
  }
}

(async () => {
  try {
    const xml = await fetchSitemap();
    const entries = parseSitemap(xml);
    const recent = filterRecent(entries);
    await submit(recent);
  } catch (err) {
    console.error('[indexnow] error:', err);
    process.exitCode = 1;
  }
})();
