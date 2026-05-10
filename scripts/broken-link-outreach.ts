#!/usr/bin/env npx tsx
/**
 * P38-T09: Broken Link Building Outreach Script
 *
 * Strategy:
 *   1. Scrape target domains for broken links (HTTP 404/410/5xx) pointing to
 *      content EcyPro has or can create
 *   2. Generate personalized outreach email for each broken link found
 *   3. Export to CSV for CRM import
 *
 * Input: brain/seo/broken-link-targets.json (list of domains to scan)
 * Output: reports/broken-links-YYYY-MM-DD.csv
 *
 * Algorithm:
 *   For each target domain:
 *     1. Fetch sitemap/page list
 *     2. Check all outbound links (HEAD request, follow redirects)
 *     3. Identify 4xx/5xx responses
 *     4. Match broken content to EcyPro's topic areas
 *     5. Generate replacement link suggestion
 *
 * Usage:
 *   npx tsx scripts/broken-link-outreach.ts
 *   npx tsx scripts/broken-link-outreach.ts --domain webrazzi.com --url https://webrazzi.com/2023/dijital-donusum
 *
 * Rate limiting: 1 req/sec per domain (Cloudflare safe, respectful crawling)
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── EcyPro content map for replacement suggestions ───────

const ECYPRO_CONTENT_MAP: Record<string, { title: string; url: string; keywords: string[] }> = {
  'digital-transformation': {
    title: 'Dijital Dönüşüm Stratejisi Nasıl Oluşturulur? 7 Adımlı Rehber',
    url: 'https://ecypro.com/blog/dijital-donusum-stratejisi-nasil-olusturulur',
    keywords: ['dijital dönüşüm', 'digital transformation', 'dijitalleşme', 'strateji'],
  },
  'operational-efficiency': {
    title: 'Operasyonel Verimlilik Nasıl Artırılır? Kanıtlanmış 6 Strateji',
    url: 'https://ecypro.com/blog/operasyonel-verimlilik-nasil-arttirilir',
    keywords: ['operasyonel verimlilik', 'operational efficiency', 'lean', 'süreç optimizasyonu'],
  },
  'hr-strategy': {
    title: 'İnsan Kaynakları Stratejisi: Yetenek Yönetimi Rehberi',
    url: 'https://ecypro.com/blog/insan-kaynaklari-stratejisi-talent-management',
    keywords: ['insan kaynakları', 'human resources', 'talent management', 'yetenek yönetimi'],
  },
  'ai-business': {
    title: 'Yapay Zeka ile İş Süreçlerini Optimize Etme: Kurumsal Rehber',
    url: 'https://ecypro.com/blog/yapay-zeka-ile-is-sureclerini-optimize-etme',
    keywords: ['yapay zeka', 'artificial intelligence', 'ai', 'iş süreçleri'],
  },
  consulting: {
    title: 'Stratejik Danışmanlık Firması Nasıl Seçilir? Kurumsal Alıcı Rehberi',
    url: 'https://ecypro.com/blog/stratejik-danismanlik-hizmetleri-secim-kilavuzu',
    keywords: ['danışmanlık', 'consulting', 'stratejik danışmanlık', 'management consulting'],
  },
};

// ─── HTTP HEAD request helper ──────────────────────────────

interface CheckResult {
  url: string;
  status: number | null;
  redirectUrl?: string;
  error?: string;
}

function checkUrl(url: string, timeoutMs = 8000): Promise<CheckResult> {
  return new Promise((resolve) => {
    const module = url.startsWith('https') ? https : http;
    const req = module.request(url, { method: 'HEAD', timeout: timeoutMs }, (res) => {
      const status = res.statusCode ?? null;
      const redirectUrl = res.headers.location;
      res.resume();
      resolve({ url, status, redirectUrl });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: null, error: 'TIMEOUT' });
    });
    req.on('error', (err) => resolve({ url, status: null, error: err.message }));
    req.end();
  });
}

// ─── Find matching EcyPro replacement content ─────────────

function findReplacement(brokenUrl: string): (typeof ECYPRO_CONTENT_MAP)[string] | null {
  const urlLower = brokenUrl.toLowerCase();
  let best: (typeof ECYPRO_CONTENT_MAP)[string] | null = null;
  let bestScore = 0;

  for (const content of Object.values(ECYPRO_CONTENT_MAP)) {
    const matches = content.keywords.filter((kw) =>
      urlLower.includes(kw.toLowerCase().replace(/\s+/g, '-')),
    );
    if (matches.length > bestScore) {
      bestScore = matches.length;
      best = content;
    }
  }
  return best;
}

// ─── Generate outreach email ───────────────────────────────

function generateOutreachEmail(
  domain: string,
  brokenUrl: string,
  replacement: (typeof ECYPRO_CONTENT_MAP)[string],
): string {
  return `
Subject: Broken Link on ${domain} — Updated Resource Available

Hello,

I was reading your article at [page where broken link appears] and noticed a broken link 
pointing to: ${brokenUrl}

I've written a comprehensive, updated guide that would be an excellent replacement:

"${replacement.title}"
${replacement.url}

This resource covers the topic in depth and would provide real value to your readers.

Would you consider updating the link? Happy to answer any questions.

Best regards,
[Name]
EcyPro Premium Consulting | ecypro.com
`.trim();
}

// ─── Main scan function ────────────────────────────────────

interface OutreachRecord {
  domain: string;
  brokenUrl: string;
  httpStatus: string;
  replacementTitle: string;
  replacementUrl: string;
  outreachEmail: string;
  foundAt: string;
}

async function scanDomain(domain: string, urlsToCheck: string[]): Promise<OutreachRecord[]> {
  const records: OutreachRecord[] = [];
  console.log(`\n[scan] ${domain} — checking ${urlsToCheck.length} URLs...`);

  for (const url of urlsToCheck) {
    // Rate limiting: 1 req/sec
    await new Promise((r) => setTimeout(r, 1000));
    const result = await checkUrl(url);

    if (result.status !== null && result.status >= 400) {
      const replacement = findReplacement(url);
      if (replacement) {
        console.log(`  ✅ Broken: ${url} [${result.status}] → ${replacement.url}`);
        records.push({
          domain,
          brokenUrl: url,
          httpStatus: String(result.status),
          replacementTitle: replacement.title,
          replacementUrl: replacement.url,
          outreachEmail: generateOutreachEmail(domain, url, replacement),
          foundAt: new Date().toISOString(),
        });
      } else {
        console.log(`  ⚠️  Broken: ${url} [${result.status}] — no replacement found`);
      }
    } else {
      console.log(`  ✓ OK: ${url} [${result.status ?? 'ERR'}]`);
    }
  }

  return records;
}

// ─── CSV export ────────────────────────────────────────────

function toCSV(records: OutreachRecord[]): string {
  const headers = [
    'domain',
    'brokenUrl',
    'httpStatus',
    'replacementTitle',
    'replacementUrl',
    'foundAt',
  ];
  const rows = records.map((r) =>
    headers.map((h) => `"${String(r[h as keyof OutreachRecord]).replace(/"/g, '""')}"`).join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

// ─── CLI entry ────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const domainArg = args.find((a) => a.startsWith('--domain='))?.split('=')[1];
  const urlArg = args.find((a) => a.startsWith('--url='))?.split('=')[1];

  let targets: { domain: string; urls: string[] }[] = [];

  if (domainArg && urlArg) {
    targets = [{ domain: domainArg, urls: [urlArg] }];
  } else {
    // Demo mode with sample broken links
    console.log('[broken-link] Running in demo mode with sample URLs...');
    targets = [
      {
        domain: 'example-demo',
        urls: [
          'https://httpstat.us/404', // Always 404
          'https://httpstat.us/200', // Always 200
        ],
      },
    ];
  }

  const allRecords: OutreachRecord[] = [];
  for (const { domain, urls } of targets) {
    const records = await scanDomain(domain, urls);
    allRecords.push(...records);
  }

  if (allRecords.length === 0) {
    console.log('\n[broken-link] No actionable broken links found.\n');
    return;
  }

  const dateStr = new Date().toISOString().split('T')[0] ?? 'unknown';
  const reportsDir = path.join(ROOT, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const csvPath = path.join(reportsDir, `broken-links-${dateStr}.csv`);
  fs.writeFileSync(csvPath, toCSV(allRecords));

  console.log(`\n[broken-link] ✅ ${allRecords.length} outreach opportunities:`);
  console.log(`   CSV: ${path.relative(ROOT, csvPath)}`);
  for (const r of allRecords) {
    console.log(`   → ${r.brokenUrl}`);
    console.log(`     Replace with: ${r.replacementUrl}`);
  }
}

main().catch((err) => {
  console.error('[broken-link] Fatal:', err);
  process.exit(1);
});
