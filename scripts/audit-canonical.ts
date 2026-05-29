#!/usr/bin/env tsx
/**
 * P31-T04: Canonical URL Audit
 *
 * Parses every HTML file in dist/ and verifies:
 *   1. Exactly one <link rel="canonical"> per page
 *   2. canonical href matches expected production URL pattern
 *   3. robots.txt has Allow: / and Sitemap: directive
 *
 * Usage:  npm run audit:canonical
 * Exit:   0 = all pass | 1 = failures found
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname ?? process.cwd(), '..');
const DIST_DIR = join(ROOT, 'dist');
const ROBOTS = join(ROOT, 'public', 'robots.txt');
const PROD_ORIGIN = process.env.VITE_PROD_URL ?? 'https://www.ecypro.com';

interface AuditResult {
  file: string;
  canonical: string | null;
  issues: string[];
}

// ── Helper: collect all .html files ──────────────────────────────────────────
function collectHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectHtmlFiles(full));
    } else if (entry.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

// ── Helper: extract canonical href from HTML string ──────────────────────────
function extractCanonical(html: string): string | null {
  const match =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return match?.[1] ?? null;
}

// ── Audit robots.txt ─────────────────────────────────────────────────────────
function auditRobots(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  try {
    const content = readFileSync(ROBOTS, 'utf-8');
    if (!content.includes('Allow: /')) issues.push('robots.txt: missing "Allow: /"');
    if (!content.includes('Sitemap:')) issues.push('robots.txt: missing "Sitemap:" directive');
  } catch {
    issues.push('robots.txt: file not found at public/robots.txt');
  }
  return { ok: issues.length === 0, issues };
}

// SPA non-SEO files — skip canonical check (admin panel, offline, tooling)
// Canonical tags for these are either irrelevant or set at runtime by React Helmet.
// index.html = SPA entry shell (canonical set at runtime by React Helmet/SEO component)
const SPA_SKIP_PATTERNS = [
  /dist\/index\.html$/,
  /dist\/admin\.html$/,
  /dist\/offline\.html$/,
  /dist\/tools\//,
];

function isSpaShell(file: string): boolean {
  const normalized = file.replace(/\\/g, '/');
  return SPA_SKIP_PATTERNS.some((p) => p.test(normalized));
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main(): void {
  console.log('\n🔍 eCyPro Canonical URL Audit\n');

  const robotsAudit = auditRobots();
  if (robotsAudit.ok) {
    console.log('  ✅ robots.txt — Allow + Sitemap present');
  } else {
    robotsAudit.issues.forEach((i) => console.error(`  ❌ ${i}`));
  }

  let htmlFiles: string[];
  try {
    htmlFiles = collectHtmlFiles(DIST_DIR).filter((f) => !isSpaShell(f));
  } catch {
    console.error('\n  ⚠️  dist/ not found — run `npm run build` first.\n');
    process.exit(1);
  }

  if (htmlFiles.length === 0) {
    console.log(
      '\n  ℹ️  No SEO HTML files in dist/ — SPA build without prerendering.\n' +
        '     Canonical tags are injected at runtime via React Helmet.\n' +
        '     robots.txt check above is the relevant static gate.\n',
    );
    console.log(`${'─'.repeat(60)}`);
    console.log(`  robots  : ${robotsAudit.ok ? '✅ OK' : '❌ FAIL'}`);
    console.log(`${'─'.repeat(60)}\n`);
    process.exit(robotsAudit.ok ? 0 : 1);
  }

  console.log(`\n  Scanning ${htmlFiles.length} HTML files in dist/…\n`);

  const results: AuditResult[] = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const canonical = extractCanonical(html);
    const issues: string[] = [];

    if (!canonical) {
      issues.push('No canonical tag found');
    } else {
      const canonicalCount = (html.match(/rel=["']canonical["']/gi) ?? []).length;
      if (canonicalCount > 1) issues.push(`Multiple canonical tags (${canonicalCount})`);
      if (!canonical.startsWith(PROD_ORIGIN)) {
        issues.push(`Canonical does not start with ${PROD_ORIGIN}: ${canonical}`);
      }
    }

    results.push({ file: relative(ROOT, file), canonical, issues });
  }

  let failCount = 0;
  for (const r of results) {
    if (r.issues.length === 0) {
      console.log(`  ✅ ${r.file}  →  ${r.canonical}`);
    } else {
      failCount++;
      console.error(`  ❌ ${r.file}`);
      r.issues.forEach((i) => console.error(`       • ${i}`));
    }
  }

  const totalIssues = failCount + (robotsAudit.ok ? 0 : 1);
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Scanned : ${htmlFiles.length} HTML files`);
  console.log(`  Passed  : ${htmlFiles.length - failCount}`);
  console.log(`  Failed  : ${failCount}`);
  console.log(`  robots  : ${robotsAudit.ok ? '✅ OK' : '❌ FAIL'}`);
  console.log(`${'─'.repeat(60)}\n`);

  process.exit(totalIssues > 0 ? 1 : 0);
}

main();
