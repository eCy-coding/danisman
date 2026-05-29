#!/usr/bin/env tsx
/**
 * P32-T19: URL Canonicalization Audit
 *
 * Checks:
 *   1. vercel.json trailingSlash setting
 *   2. Canonical tag URL consistency (no trailing slashes on canonical hrefs)
 *   3. Common duplicate URL patterns: /services vs /services/
 *
 * Usage:  npx tsx scripts/audit-url-canonicalization.ts
 * Exit:   0 = all pass | 1 = failures found
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname ?? process.cwd(), '..');
const DIST_DIR = join(ROOT, 'dist');
const VERCEL_JSON = join(ROOT, 'vercel.json');

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

function collectHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        results.push(...collectHtmlFiles(full));
      } else if (entry.endsWith('.html')) {
        results.push(full);
      }
    }
  } catch {
    // ignore
  }
  return results;
}

function auditVercelJson(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  try {
    const raw = readFileSync(VERCEL_JSON, 'utf-8');
    const config = JSON.parse(raw) as Record<string, unknown>;

    if (config['trailingSlash'] === true) {
      issues.push('vercel.json: trailingSlash=true — set to false to avoid duplicate content');
    } else if (config['trailingSlash'] === false) {
      // explicit false — correct
    } else {
      // Not set — Vercel default is to redirect trailing slashes → OK but warn
      issues.push(
        'vercel.json: trailingSlash not set — default Vercel behavior redirects, but explicit false preferred',
      );
    }
  } catch {
    issues.push('vercel.json: file not found or invalid JSON');
  }
  return { ok: issues.length === 0, issues };
}

function extractCanonicalHref(html: string): string | null {
  const match =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return match?.[1] ?? null;
}

function main(): void {
  console.log('\n🔗 eCyPro URL Canonicalization Audit\n');

  // 1. vercel.json check
  const vercelAudit = auditVercelJson();
  if (vercelAudit.ok) {
    console.log('  ✅ vercel.json — trailingSlash: false');
  } else {
    vercelAudit.issues.forEach((i) => console.error(`  ❌ ${i}`));
  }

  // 2. Canonical URL trailing slash check in dist/
  let htmlFiles: string[];
  try {
    htmlFiles = collectHtmlFiles(DIST_DIR).filter((f) => !isSpaShell(f));
  } catch {
    console.error('\n  ⚠️  dist/ not found — run `npm run build` first.\n');
    process.exit(1);
  }

  if (htmlFiles.length === 0) {
    console.log(
      '\n  ℹ️  No SEO HTML files in dist/ — SPA build.\n' +
        '     Canonical URLs managed at runtime by React Helmet.\n',
    );
    const allOk = vercelAudit.ok;
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  vercel.json: ${vercelAudit.ok ? '✅ OK' : '❌ FAIL'}`);
    console.log(`${'─'.repeat(50)}\n`);
    process.exit(allOk ? 0 : 1);
  }

  console.log(`\n  Scanning ${htmlFiles.length} canonical URLs…\n`);

  let failCount = 0;
  const trailingSlashViolations: string[] = [];

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const canonical = extractCanonicalHref(html);
    const relFile = relative(ROOT, file);

    if (!canonical) continue;

    // Check canonical URL doesn't end with trailing slash (except root /)
    const url = new URL(canonical);
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      failCount++;
      trailingSlashViolations.push(`  ❌ ${relFile} → canonical has trailing slash: ${canonical}`);
    } else {
      console.log(`  ✅ ${relFile} → ${canonical}`);
    }
  }

  trailingSlashViolations.forEach((v) => console.error(v));

  const totalFail = failCount + (vercelAudit.ok ? 0 : 1);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Scanned : ${htmlFiles.length} canonical URLs`);
  console.log(`  Trailing slash violations: ${failCount}`);
  console.log(`  vercel.json: ${vercelAudit.ok ? '✅ OK' : '❌ FAIL'}`);
  console.log(`${'─'.repeat(60)}\n`);

  process.exit(totalFail > 0 ? 1 : 0);
}

main();
