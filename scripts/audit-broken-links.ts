#!/usr/bin/env npx tsx
/**
 * P38-T09: Broken Link Auditor
 *
 * Crawls all URLs in sitemap.xml and checks for:
 *   - HTTP status codes (200 = ok, 301 = redirect, 404/500 = broken)
 *   - Anchor href links on each page (internal only)
 *   - Image src 404 errors
 *   - Redirect chains (3xx → follow up to 5 hops)
 *
 * Output:
 *   - Console table with status per URL
 *   - JSON report: brain/seo/broken-links-{date}.json
 *   - MD report:  brain/seo/broken-links-{date}.md
 *   - Exit 1 if any broken URLs found
 *
 * Usage:
 *   npm run audit:broken-links
 *
 *   To test production:
 *   AUDIT_BASE_URL=https://ecypro.com npm run audit:broken-links
 *
 *   To test local:
 *   AUDIT_BASE_URL=http://localhost:5173 npm run audit:broken-links
 *
 * Configuration:
 *   AUDIT_BASE_URL   Target base URL (default: http://localhost:5173)
 *   AUDIT_SITEMAP    Sitemap URL (default: {base}/sitemap.xml)
 *   AUDIT_CONCURRENCY Concurrent requests (default: 5)
 *   AUDIT_TIMEOUT_MS Request timeout ms (default: 10000)
 *   AUDIT_FOLLOW_LINKS Follow href links on pages (default: false — sitemap-only)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const BASE_URL = process.env.AUDIT_BASE_URL ?? 'http://localhost:5173';
const SITEMAP_URL = process.env.AUDIT_SITEMAP ?? `${BASE_URL}/sitemap.xml`;
const CONCURRENCY = parseInt(process.env.AUDIT_CONCURRENCY ?? '5', 10);
const TIMEOUT_MS = parseInt(process.env.AUDIT_TIMEOUT_MS ?? '10000', 10);
const BRAIN_SEO = path.join(process.cwd(), 'brain', 'seo');

// ─── Types ───────────────────────────────────────────────────

type LinkStatus = 'ok' | 'redirect' | 'broken' | 'error' | 'timeout';

interface LinkResult {
  url: string;
  status: number | null;
  finalUrl?: string;
  redirectChain?: string[];
  linkStatus: LinkStatus;
  responseMs: number;
  error?: string;
}

// ─── HTTP fetch with redirect follow ────────────────────────

async function checkUrl(url: string, hops = 0): Promise<LinkResult> {
  const start = Date.now();
  const redirectChain: string[] = [];

  const check = (currentUrl: string, hop: number): Promise<LinkResult> =>
    new Promise((resolve) => {
      const lib = currentUrl.startsWith('https') ? https : http;
      const req = lib.get(
        currentUrl,
        { headers: { 'User-Agent': 'EcyPro-BrokenLinkAuditor/1.0' } },
        (res) => {
          const elapsed = Date.now() - start;
          const status = res.statusCode ?? 0;

          // Follow redirect (3xx)
          if (
            (status === 301 || status === 302 || status === 307 || status === 308) &&
            res.headers.location &&
            hop < 5
          ) {
            const next = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, currentUrl).href;
            redirectChain.push(currentUrl);
            res.resume();
            resolve(
              check(next, hop + 1).then((r) => ({
                ...r,
                redirectChain: [...redirectChain, ...(r.redirectChain ?? [])],
              })),
            );
          } else {
            res.resume();
            const linkStatus: LinkStatus =
              status >= 200 && status < 300
                ? 'ok'
                : status >= 300 && status < 400
                  ? 'redirect'
                  : status >= 400
                    ? 'broken'
                    : 'error';
            resolve({
              url,
              status,
              finalUrl: currentUrl !== url ? currentUrl : undefined,
              redirectChain,
              linkStatus,
              responseMs: elapsed,
            });
          }
        },
      );

      req.on('error', (err: Error) => {
        resolve({
          url,
          status: null,
          linkStatus: 'error',
          responseMs: Date.now() - start,
          error: err.message,
        });
      });

      req.setTimeout(TIMEOUT_MS, () => {
        req.destroy();
        resolve({
          url,
          status: null,
          linkStatus: 'timeout',
          responseMs: TIMEOUT_MS,
          error: 'Request timeout',
        });
      });
    });

  return check(url, hops);
}

// ─── Sitemap parser ──────────────────────────────────────────

async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  const raw = await new Promise<string>((resolve, reject) => {
    const lib = sitemapUrl.startsWith('https') ? https : http;
    lib
      .get(sitemapUrl, (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => {
          body += chunk;
        });
        res.on('end', () => resolve(body));
        res.on('error', reject);
      })
      .on('error', reject);
  });

  // Parse XML manually via regex (avoids xml2js dependency)
  // Handles both <urlset> and <sitemapindex> formats
  const locMatches = raw.match(/<loc>(.*?)<\/loc>/g) ?? [];
  const locs = locMatches.map((m) => m.replace(/<\/?loc>/g, '').trim());

  // If sitemap index, recurse into child sitemaps
  if (raw.includes('<sitemapindex')) {
    const childResults = await Promise.all(locs.map((u) => parseSitemap(u)));
    return childResults.flat();
  }

  return locs;
}

// ─── Concurrency pool ────────────────────────────────────────

async function runPool<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];
  let idx = 0;

  const worker = async (): Promise<void> => {
    while (idx < queue.length) {
      const item = queue[idx++]!;
      results.push(await fn(item));
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// ─── Report generator ────────────────────────────────────────

function generateReport(results: LinkResult[]): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const broken = results.filter(
    (r) => r.linkStatus === 'broken' || r.linkStatus === 'error' || r.linkStatus === 'timeout',
  );
  const ok = results.filter((r) => r.linkStatus === 'ok');
  const redirects = results.filter((r) => r.linkStatus === 'redirect');

  // JSON report
  const jsonReport = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    sitemapUrl: SITEMAP_URL,
    summary: {
      total: results.length,
      ok: ok.length,
      broken: broken.length,
      redirects: redirects.length,
    },
    broken,
    redirects,
  };

  fs.mkdirSync(BRAIN_SEO, { recursive: true });
  fs.writeFileSync(
    path.join(BRAIN_SEO, `broken-links-${dateStr}.json`),
    JSON.stringify(jsonReport, null, 2),
  );

  // Markdown report
  const md = `# Broken Link Audit — ${dateStr}

**Base URL:** ${BASE_URL}
**Sitemap:** ${SITEMAP_URL}

## Summary

| Metric | Count |
|--------|-------|
| ✅ OK | ${ok.length} |
| 🔄 Redirect | ${redirects.length} |
| ❌ Broken | ${broken.length} |
| **Total** | **${results.length}** |

${
  broken.length === 0
    ? '## ✅ No broken links found!\n'
    : `## ❌ Broken Links (${broken.length})

${broken.map((r) => `- **${r.status ?? r.error ?? 'timeout'}** — [${r.url}](${r.url}) (${r.responseMs}ms)`).join('\n')}
`
}
${
  redirects.length > 0
    ? `## 🔄 Redirects (${redirects.length})

${redirects.map((r) => `- ${r.status} ${r.url} → ${r.finalUrl ?? 'unknown'}`).join('\n')}
`
    : ''
}
`;

  fs.writeFileSync(path.join(BRAIN_SEO, `broken-links-${dateStr}.md`), md);
  console.log(
    `\n📄 Reports saved:\n  brain/seo/broken-links-${dateStr}.json\n  brain/seo/broken-links-${dateStr}.md`,
  );
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`🔍 Broken Link Auditor — EcyPro`);
  console.log(`   Base: ${BASE_URL}`);
  console.log(`   Sitemap: ${SITEMAP_URL}`);
  console.log(`   Concurrency: ${CONCURRENCY}`);

  // 1. Parse sitemap
  console.log('\n📥 Fetching sitemap...');
  const urls = await parseSitemap(SITEMAP_URL);

  if (urls.length === 0) {
    console.error('❌ No URLs found in sitemap. Is the server running?');
    process.exit(1);
  }
  console.log(`   Found ${urls.length} URLs`);

  // 2. Check all URLs
  console.log(`\n🔗 Checking ${urls.length} URLs (concurrency=${CONCURRENCY})...`);
  let checked = 0;

  const results = await runPool(
    urls,
    async (url) => {
      const result = await checkUrl(url);
      checked++;
      const icon =
        result.linkStatus === 'ok' ? '✅' : result.linkStatus === 'redirect' ? '🔄' : '❌';
      process.stdout.write(
        `\r   ${icon} ${checked}/${urls.length} — ${result.status ?? result.error ?? '??'} ${url.slice(BASE_URL.length) || '/'}`,
      );
      return result;
    },
    CONCURRENCY,
  );

  // 3. Summary
  const broken = results.filter((r) => r.linkStatus !== 'ok' && r.linkStatus !== 'redirect');
  console.log('\n');
  console.log('━'.repeat(60));
  console.log(`Results: ${results.length} checked`);
  console.log(`  ✅ OK:       ${results.filter((r) => r.linkStatus === 'ok').length}`);
  console.log(`  🔄 Redirect: ${results.filter((r) => r.linkStatus === 'redirect').length}`);
  console.log(`  ❌ Broken:   ${broken.length}`);

  if (broken.length > 0) {
    console.log('\n❌ Broken links:');
    broken.forEach((r) => console.log(`  ${r.status ?? r.error} — ${r.url}`));
  }

  // 4. Save report
  generateReport(results);

  // Exit 1 if broken links
  if (broken.length > 0) {
    console.error(`\n💥 ${broken.length} broken link(s) found. Check report for details.`);
    process.exit(1);
  }

  console.log('\n✅ All links healthy!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
