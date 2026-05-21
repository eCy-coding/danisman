#!/usr/bin/env tsx
/**
 * P32-T03: H1 Keyword Audit
 *
 * Parses every HTML file in dist/ and validates:
 *   1. Each page has exactly 1 <h1> tag
 *   2. Checks for suspiciously generic H1s ("Welcome", "Home", etc.)
 *   3. Reports H1 content per file for manual keyword review
 *
 * Usage:  npm run audit:h1
 * Exit:   0 = structural pass | 1 = missing H1 or multiple H1s
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname ?? process.cwd(), '..');
const DIST_DIR = join(ROOT, 'dist');

const GENERIC_H1_PATTERNS = [/^home$/i, /^welcome/i, /^untitled/i, /^page$/i];

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

function extractH1s(html: string): string[] {
  const matches = html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  return Array.from(matches, (m) =>
    m[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function main(): void {
  console.log('\n🔍 eCyPro H1 Keyword Audit\n');

  let htmlFiles: string[];
  try {
    htmlFiles = collectHtmlFiles(DIST_DIR);
  } catch {
    console.error('  ⚠️  dist/ not found — run `npm run build` first.\n');
    process.exit(1);
  }

  let failCount = 0;
  let warnCount = 0;

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const h1s = extractH1s(html);
    const relFile = relative(ROOT, file);
    const issues: string[] = [];
    const warns: string[] = [];

    if (h1s.length === 0) {
      issues.push('No H1 found');
    } else if (h1s.length > 1) {
      issues.push(`Multiple H1s (${h1s.length}): ${h1s.join(' | ')}`);
    } else {
      const h1 = h1s[0];
      if (GENERIC_H1_PATTERNS.some((p) => p.test(h1))) {
        warns.push(`Generic H1: "${h1}" — consider keyword-rich replacement`);
      }
      if (h1.length < 10) warns.push(`Short H1 (${h1.length} chars): "${h1}"`);
    }

    if (issues.length > 0) {
      failCount++;
      console.error(`  ❌ ${relFile}`);
      issues.forEach((i) => console.error(`       • ${i}`));
    } else if (warns.length > 0) {
      warnCount++;
      console.warn(`  ⚠️  ${relFile}  →  "${h1s[0]}"`);
      warns.forEach((w) => console.warn(`       • ${w}`));
    } else {
      console.log(`  ✅ ${relFile}  →  "${h1s[0]}"`);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Scanned : ${htmlFiles.length} HTML files`);
  console.log(`  Passed  : ${htmlFiles.length - failCount - warnCount}`);
  console.log(`  Warnings: ${warnCount}  (manual keyword review needed)`);
  console.log(`  Failed  : ${failCount}  (missing or duplicate H1)`);
  console.log(`${'─'.repeat(60)}\n`);

  process.exit(failCount > 0 ? 1 : 0);
}

main();
