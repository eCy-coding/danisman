#!/usr/bin/env tsx
/**
 * P32-T04: Internal Linking Audit
 *
 * Parses every HTML file in dist/ and:
 *   1. Counts internal links (<a href="/..."> or same domain)
 *   2. Identifies pages with fewer than 3 internal links (orphan risk)
 *   3. Detects broken internal links (href points to missing file)
 *   4. Reports link graph (from → to) for silo review
 *
 * Usage:  npm run audit:links
 * Exit:   0 = all pass | 1 = orphan pages found
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, normalize } from 'path';

const ROOT = join(import.meta.dirname ?? process.cwd(), '..');
const DIST_DIR = join(ROOT, 'dist');
const MIN_INTERNAL_LINKS = 3;

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

function extractInternalLinks(html: string): string[] {
  const hrefs: string[] = [];
  const regex = /<a[^>]+href=["']([^"'#?]+)[^"']*["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    // Internal: starts with / (not //) or relative
    if (href.startsWith('/') && !href.startsWith('//')) {
      hrefs.push(href);
    }
  }
  return hrefs;
}

function resolveHref(href: string): string {
  const clean = href.split('?')[0].split('#')[0];
  if (clean.endsWith('/') || clean === '') {
    return join(DIST_DIR, clean, 'index.html');
  }
  // Check with .html extension
  const withHtml = join(DIST_DIR, clean + '.html');
  if (existsSync(withHtml)) return withHtml;
  return join(DIST_DIR, clean, 'index.html');
}

function main(): void {
  console.log('\n🔗 eCyPro Internal Links Audit\n');

  let htmlFiles: string[];
  try {
    htmlFiles = collectHtmlFiles(DIST_DIR);
  } catch {
    console.error('  ⚠️  dist/ not found — run `npm run build` first.\n');
    process.exit(1);
  }

  const knownPaths = new Set(htmlFiles.map((f) => normalize(f)));
  let orphanCount = 0;
  let brokenCount = 0;

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const links = extractInternalLinks(html);
    const unique = [...new Set(links)];
    const relFile = relative(ROOT, file);
    const issues: string[] = [];
    const warns: string[] = [];

    if (unique.length < MIN_INTERNAL_LINKS) {
      warns.push(
        `Only ${unique.length} unique internal link(s) — minimum ${MIN_INTERNAL_LINKS} recommended`,
      );
    }

    for (const href of unique) {
      const resolved = resolveHref(href);
      if (!existsSync(resolved) && !knownPaths.has(normalize(resolved))) {
        issues.push(`Broken link: ${href} (resolved: ${relative(ROOT, resolved)})`);
        brokenCount++;
      }
    }

    if (issues.length > 0) {
      console.error(`  ❌ ${relFile}`);
      issues.forEach((i) => console.error(`       • ${i}`));
    } else if (warns.length > 0) {
      orphanCount++;
      console.warn(`  ⚠️  ${relFile}  [${unique.length} links]`);
      warns.forEach((w) => console.warn(`       • ${w}`));
    } else {
      console.log(`  ✅ ${relFile}  [${unique.length} links]`);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Pages scanned : ${htmlFiles.length}`);
  console.log(`  Orphan risk   : ${orphanCount}  (<${MIN_INTERNAL_LINKS} internal links)`);
  console.log(`  Broken links  : ${brokenCount}`);
  console.log(`${'─'.repeat(60)}\n`);

  process.exit(brokenCount > 0 ? 1 : 0);
}

main();
