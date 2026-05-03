/**
 * Lighthouse Runner — Phase 20 A5 (TS port).
 *
 * Assumes the production build already exists in `dist/` and a preview server
 * is running. The runner does NOT build or spawn the preview itself; that is
 * the orchestrator's job (CI workflow or `npm run preview`).
 *
 * Usage:
 *   PREVIEW_URL=http://localhost:4173 npx tsx scripts/lighthouse.ts
 *
 * Outputs:
 *   - lighthouse-reports/<page>.json (per-page detailed report)
 *   - docs/PERFORMANCE_REPORT.md (summary table)
 *   - exit code 1 if any page fails the budget thresholds
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

interface PageTarget {
  name: string;
  pathname: string;
}

interface Scores {
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
}

interface PageResult extends Scores {
  page: string;
  url: string;
  pass: boolean;
}

const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';

// Budget thresholds (mobile emulation defaults). Tuned for a marketing site
// running on a typical 4G connection. Tighten as we improve.
const BUDGET: Scores = {
  performance: 85,
  accessibility: 95,
  seo: 95,
  bestPractices: 90,
};

const PAGES: PageTarget[] = [
  { name: 'LandingPage', pathname: '/' },
  { name: 'ServicesPage', pathname: '/services' },
  { name: 'PricingPage', pathname: '/pricing' },
  { name: 'CaseStudiesPage', pathname: '/case-studies' },
  { name: 'BlogPage', pathname: '/blog' },
  { name: 'ContactPage', pathname: '/contact' },
];

async function runOne(url: string, port: number): Promise<Scores> {
  const result = await lighthouse(url, {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
    port,
  });

  if (!result?.lhr) {
    throw new Error(`Lighthouse returned no result for ${url}`);
  }

  const lhr = result.lhr;
  return {
    performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
    seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
    bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
  };
}

function passes(scores: Scores): boolean {
  return (
    scores.performance >= BUDGET.performance &&
    scores.accessibility >= BUDGET.accessibility &&
    scores.seo >= BUDGET.seo &&
    scores.bestPractices >= BUDGET.bestPractices
  );
}

function writeMarkdownReport(results: PageResult[]): void {
  const lines: string[] = [
    '# ⚡ Lighthouse Performance Report',
    '',
    `> Run: ${new Date().toISOString()}  ·  Preview: ${PREVIEW_URL}  ·  Budget: P≥${BUDGET.performance} A≥${BUDGET.accessibility} SEO≥${BUDGET.seo} BP≥${BUDGET.bestPractices}`,
    '',
    '| Page | Perf | A11y | SEO | BP | Status |',
    '|------|-----:|-----:|----:|---:|:------:|',
  ];
  for (const r of results) {
    lines.push(
      `| ${r.page} | ${r.performance} | ${r.accessibility} | ${r.seo} | ${r.bestPractices} | ${r.pass ? '✅' : '❌'} |`,
    );
  }

  const outDir = path.join(process.cwd(), 'docs');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'PERFORMANCE_REPORT.md'), lines.join('\n') + '\n', 'utf8');
}

async function main(): Promise<void> {
  console.log(`🚀 Lighthouse audit · target=${PREVIEW_URL}`);

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
  const reportDir = path.join(process.cwd(), 'lighthouse-reports');
  fs.mkdirSync(reportDir, { recursive: true });

  const results: PageResult[] = [];
  let exitCode = 0;

  try {
    for (const page of PAGES) {
      const url = PREVIEW_URL.replace(/\/$/, '') + page.pathname;
      console.log(`🔍 ${page.name} (${page.pathname})…`);
      try {
        const scores = await runOne(url, chrome.port);
        const pass = passes(scores);
        const result: PageResult = { page: page.name, url, pass, ...scores };
        results.push(result);

        const flag = pass ? '✅' : '❌';
        console.log(
          `   ${flag} P=${scores.performance} A=${scores.accessibility} SEO=${scores.seo} BP=${scores.bestPractices}`,
        );

        // Persist raw report (allow reviewers to drill into traces).
        const reportRunner = await lighthouse(url, {
          logLevel: 'error',
          output: 'json',
          onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
          port: chrome.port,
        });
        if (reportRunner?.report) {
          const reportJson = Array.isArray(reportRunner.report) ? reportRunner.report[0] : reportRunner.report;
          fs.writeFileSync(path.join(reportDir, `${page.name}.json`), reportJson, 'utf8');
        }

        if (!pass) exitCode = 1;
      } catch (err) {
        console.error(`   ❌ Failed to audit ${page.name}: ${(err as Error).message}`);
        exitCode = 1;
      }
    }
  } finally {
    await chrome.kill();
  }

  writeMarkdownReport(results);
  console.log('\n📊 Summary:');
  console.table(results);
  console.log(`📝 Report: docs/PERFORMANCE_REPORT.md`);

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Fatal error in lighthouse runner:', err);
  process.exit(1);
});
