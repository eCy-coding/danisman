#!/usr/bin/env node
/**
 * P6 — Lighthouse 5-run median runner (mobile, slow 4G)
 *
 * Why this exists:
 *   P5 made decisions on a single Lighthouse run. Lighthouse has ±5-10 point
 *   noise per run; that variance ate the signal. P6 takes 5 runs per page,
 *   computes median + p95, and writes a structured baseline file the
 *   Apply-Measure-Decide loop compares against.
 *
 * Usage (host shell):
 *   PREVIEW_URL=http://localhost:4173 node scripts/lh-5run.mjs [tag]
 *   tag defaults to "baseline" (e.g. "round-A", "round-B").
 *
 * Output:
 *   outputs/lh-<tag>-<ISO>/
 *     ├── <Page>-run<N>.json         (raw lighthouse json, 5 per page)
 *     ├── summary.json               (median+p95 per page per metric)
 *     └── summary.md                 (human-readable table)
 *
 * Exit code: 0 always (this is a measurement tool, not a gate).
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';
const TAG = process.argv[2] ?? 'baseline';
const RUNS = Number(process.env.LH_RUNS ?? '5');

const PAGES = [
  { name: 'LandingPage', pathname: '/' },
  { name: 'ServicesPage', pathname: '/services' },
  { name: 'PricingPage', pathname: '/pricing' },
  { name: 'CaseStudiesPage', pathname: '/case-studies' },
  { name: 'BlogPage', pathname: '/blog' },
  { name: 'ContactPage', pathname: '/contact' },
];

// Mobile preset — Lighthouse default config but explicit for clarity.
// Slow 4G throttling matches the real-world budget targets in PERF_CHARTER.
// maxWaitForLoad bumped to 60s so heavy SPA routes don't false-positive PAGE_HUNG.
const LH_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.5600000000002,
      uploadThroughputKbps: 675,
    },
    throttlingMethod: 'simulate',
    maxWaitForLoad: 60000,
    maxWaitForFcp: 30000,
    onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
  },
};

const median = (arr) => {
  const sorted = [...arr].filter((x) => x != null && !Number.isNaN(x)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
};

const p95 = (arr) => {
  const sorted = [...arr].filter((x) => x != null && !Number.isNaN(x)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const i = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[i];
};

async function runOne(url, port) {
  const result = await lighthouse(url, { logLevel: 'error', output: 'json', port }, LH_CONFIG);
  if (!result?.lhr) throw new Error('No lhr');
  const lhr = result.lhr;
  return {
    scores: {
      performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
      seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
    },
    metrics: {
      lcp: lhr.audits['largest-contentful-paint']?.numericValue ?? null,
      cls: lhr.audits['cumulative-layout-shift']?.numericValue ?? null,
      tbt: lhr.audits['total-blocking-time']?.numericValue ?? null,
      fcp: lhr.audits['first-contentful-paint']?.numericValue ?? null,
      si: lhr.audits['speed-index']?.numericValue ?? null,
      tti: lhr.audits['interactive']?.numericValue ?? null,
    },
    runtimeError: lhr.runtimeError?.code ?? null,
    report: Array.isArray(result.report) ? result.report[0] : result.report,
  };
}

async function launchChrome() {
  return chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });
}

async function main() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(process.cwd(), 'outputs', `lh-${TAG}-${ts}`);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`P6 lh-5run · target=${PREVIEW_URL} tag=${TAG} runs=${RUNS}`);
  console.log(`output=${outDir}`);

  const allResults = {};

  // P6 — fresh Chrome PER PAGE so a hung page (Services PAGE_HUNG, TRACING_ALREADY_STARTED, PROTOCOL_TIMEOUT)
  // doesn't poison subsequent pages with stale debugger protocol state.
  for (const page of PAGES) {
    const url = PREVIEW_URL.replace(/\/$/, '') + page.pathname;
    console.log(`\n[${page.name}] ${url}`);
    const runs = [];
    let chrome;
    try {
      chrome = await launchChrome();
      for (let i = 1; i <= RUNS; i++) {
        process.stdout.write(`  run ${i}/${RUNS}… `);
        try {
          const r = await runOne(url, chrome.port);
          runs.push(r);
          fs.writeFileSync(path.join(outDir, `${page.name}-run${i}.json`), r.report);
          const s = r.scores;
          const flag = r.runtimeError ? `ERR(${r.runtimeError})` : '';
          console.log(`P=${s.performance} A=${s.accessibility} SEO=${s.seo} BP=${s.bestPractices} ${flag}`);
          // If we got a fatal runtime error, restart Chrome for the next run to avoid pollution
          if (r.runtimeError) {
            try { await Promise.resolve(chrome.kill()); } catch { /* ignore */ }
            chrome = await launchChrome();
          }
        } catch (err) {
          console.log(`FAIL: ${err.message}`);
          runs.push({ error: err.message });
          // Restart Chrome after any unexpected error
          try { await Promise.resolve(chrome.kill()); } catch { /* ignore */ }
          chrome = await launchChrome();
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    } finally {
      if (chrome) try { await Promise.resolve(chrome.kill()); } catch { /* ignore */ }
    }
    allResults[page.name] = runs;
  }

  // Aggregate
  const summary = {};
  for (const [pageName, runs] of Object.entries(allResults)) {
    const valid = runs.filter((r) => !r.error && r.scores);
    const errored = runs.filter((r) => r.error || r.runtimeError);
    summary[pageName] = {
      validRuns: valid.length,
      erroredRuns: errored.length,
      runtimeErrors: errored.map((r) => r.runtimeError || r.error).filter(Boolean),
      perf: {
        median: median(valid.map((r) => r.scores.performance)),
        p95: p95(valid.map((r) => r.scores.performance)),
        runs: runs.map((r) => r.scores?.performance ?? null),
      },
      a11y: {
        median: median(valid.map((r) => r.scores.accessibility)),
        runs: runs.map((r) => r.scores?.accessibility ?? null),
      },
      seo: {
        median: median(valid.map((r) => r.scores.seo)),
        runs: runs.map((r) => r.scores?.seo ?? null),
      },
      bp: {
        median: median(valid.map((r) => r.scores.bestPractices)),
        runs: runs.map((r) => r.scores?.bestPractices ?? null),
      },
      metrics: {
        lcp: { median: median(valid.map((r) => r.metrics.lcp)), runs: valid.map((r) => r.metrics.lcp) },
        cls: { median: median(valid.map((r) => r.metrics.cls)), runs: valid.map((r) => r.metrics.cls) },
        tbt: { median: median(valid.map((r) => r.metrics.tbt)), runs: valid.map((r) => r.metrics.tbt) },
        fcp: { median: median(valid.map((r) => r.metrics.fcp)), runs: valid.map((r) => r.metrics.fcp) },
        si: { median: median(valid.map((r) => r.metrics.si)), runs: valid.map((r) => r.metrics.si) },
        tti: { median: median(valid.map((r) => r.metrics.tti)), runs: valid.map((r) => r.metrics.tti) },
      },
    };
  }

  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

  // Markdown
  const lines = [
    `# P6 — Lighthouse ${TAG} (${RUNS}-run median)`,
    '',
    `**Tarih:** ${new Date().toISOString()}`,
    `**Hedef:** ${PREVIEW_URL}`,
    `**Throttle:** Slow 4G (1.6 Mbps down, 150ms RTT, 4× CPU slowdown), mobile 412×823`,
    '',
    '## Skor Tablosu (median)',
    '',
    '| Page | Perf | A11y | SEO | BP | runs |',
    '|------|-----:|-----:|----:|---:|------|',
  ];
  for (const [name, s] of Object.entries(summary)) {
    const runs = s.perf.runs.map((x) => x ?? '×').join(',');
    lines.push(`| ${name} | ${s.perf.median ?? '×'} | ${s.a11y.median ?? '×'} | ${s.seo.median ?? '×'} | ${s.bp.median ?? '×'} | ${runs} |`);
  }
  lines.push('');
  lines.push('## Web Vitals (median, ms)');
  lines.push('');
  lines.push('| Page | LCP | CLS | TBT | FCP | SI | TTI |');
  lines.push('|------|----:|----:|----:|----:|---:|----:|');
  for (const [name, s] of Object.entries(summary)) {
    const m = s.metrics;
    const fmt = (v) => (v == null ? '×' : v < 10 ? v.toFixed(3) : Math.round(v));
    lines.push(`| ${name} | ${fmt(m.lcp.median)} | ${fmt(m.cls.median)} | ${fmt(m.tbt.median)} | ${fmt(m.fcp.median)} | ${fmt(m.si.median)} | ${fmt(m.tti.median)} |`);
  }
  lines.push('');
  lines.push('## Errored Runs');
  lines.push('');
  for (const [name, s] of Object.entries(summary)) {
    if (s.erroredRuns > 0) {
      lines.push(`- **${name}**: ${s.erroredRuns}/${RUNS} errored — ${s.runtimeErrors.join(', ')}`);
    }
  }

  fs.writeFileSync(path.join(outDir, 'summary.md'), lines.join('\n') + '\n');

  console.log(`\nDone. Summary: ${path.join(outDir, 'summary.md')}`);
  console.log(`JSON: ${path.join(outDir, 'summary.json')}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
