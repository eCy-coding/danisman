/**
 * P55.A3 — IndexNow cron (Bing IndexNow API submission).
 *
 * Schedule: every day 03:00 UTC.
 *   - Fetch public sitemap.xml (production URL)
 *   - Parse <loc> + <lastmod>
 *   - Filter URLs modified in the last 24h
 *   - POST to https://api.indexnow.org/IndexNow
 *
 * ENV gating:
 *   - INDEXNOW_KEY            — required (32 chars hex). Empty → cron logs once and no-ops.
 *   - INDEXNOW_KEY_LOCATION   — required (https://www.ecypro.com/<KEY>.txt)
 *   - INDEXNOW_HOST           — default 'www.ecypro.com'
 *   - INDEXNOW_SITEMAP_URL    — default 'https://www.ecypro.com/sitemap.xml'
 *   - INDEXNOW_ENABLED        — '1' to enable cron in dev; on by default in prod
 *
 * Can also be invoked manually via `npm run seo:indexnow` (scripts/indexnow-submit.ts).
 */

import cron from 'node-cron';
import { logger } from '../config/logger';

const INDEXNOW_API = 'https://api.indexnow.org/IndexNow';

const KEY = process.env.INDEXNOW_KEY ?? '';
const KEY_LOCATION = process.env.INDEXNOW_KEY_LOCATION ?? '';
const HOST = process.env.INDEXNOW_HOST ?? 'www.ecypro.com';
const SITEMAP_URL = process.env.INDEXNOW_SITEMAP_URL ?? `https://${HOST}/sitemap.xml`;
const ENABLED = process.env.INDEXNOW_ENABLED === '1' || process.env.NODE_ENV === 'production';

interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  // Lightweight regex parser — production-ready since sitemap.xml is generated
  // by our own postbuild script (scripts/generate-sitemap.ts), known shape.
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  for (const block of urlBlocks) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1];
    const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(block)?.[1];
    if (loc) entries.push({ loc, lastmod });
  }
  return entries;
}

async function fetchSitemap(): Promise<SitemapEntry[]> {
  const res = await fetch(SITEMAP_URL, {
    headers: { 'user-agent': 'eCyPro-IndexNow-Cron/1.0' },
  });
  if (!res.ok) throw new Error(`sitemap fetch ${res.status}`);
  const text = await res.text();
  return parseSitemap(text);
}

function filterRecent(entries: SitemapEntry[], windowMs: number): string[] {
  const cutoff = Date.now() - windowMs;
  return entries
    .filter((e) => {
      if (!e.lastmod) return false;
      const ts = Date.parse(e.lastmod);
      return Number.isFinite(ts) && ts >= cutoff;
    })
    .map((e) => e.loc);
}

async function submitToIndexNow(urls: string[]): Promise<{ ok: boolean; status: number }> {
  if (urls.length === 0) return { ok: true, status: 0 };
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
  const res = await fetch(INDEXNOW_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status };
}

export async function runIndexNowSubmit(
  args: {
    windowMs?: number; // default 24h
  } = {},
): Promise<{ submitted: number; status: number; ok: boolean }> {
  if (!KEY || !KEY_LOCATION) {
    logger.info('[indexnow] DISABLED — INDEXNOW_KEY or INDEXNOW_KEY_LOCATION missing');
    return { submitted: 0, status: 0, ok: false };
  }
  const window = args.windowMs ?? 24 * 60 * 60 * 1000;
  try {
    const entries = await fetchSitemap();
    const urls = filterRecent(entries, window);
    if (urls.length === 0) {
      logger.info('[indexnow] no URLs modified in window — skipping submit', { window });
      return { submitted: 0, status: 0, ok: true };
    }
    const result = await submitToIndexNow(urls);
    logger.info('[indexnow] submitted', {
      count: urls.length,
      status: result.status,
      ok: result.ok,
    });
    return { submitted: urls.length, status: result.status, ok: result.ok };
  } catch (err) {
    logger.error('[indexnow] submit error', { error: (err as Error).message });
    return { submitted: 0, status: 0, ok: false };
  }
}

let cronStarted = false;
let cronTask: { stop: () => void } | null = null;

export function startIndexNowCron(): void {
  if (cronStarted) return;
  if (!ENABLED) {
    logger.info('[indexnow] cron NOT started — INDEXNOW_ENABLED!=1');
    return;
  }
  // 03:00 UTC every day
  cronTask = cron.schedule(
    '0 3 * * *',
    () => {
      runIndexNowSubmit().catch((err) =>
        logger.error('[indexnow] cron error', { error: (err as Error).message }),
      );
    },
    { timezone: 'UTC' },
  );
  cronStarted = true;
  logger.info('[indexnow] cron scheduled (0 3 * * * UTC)');
}

export function stopIndexNowCron(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
  cronStarted = false;
}
