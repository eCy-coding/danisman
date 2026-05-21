#!/usr/bin/env npx tsx
/**
 * P32-T08: Image Alt Text Audit Script
 *
 * Scans ALL TypeScript/TSX source files for:
 *   - <img> tags missing alt attribute
 *   - <img> tags with empty alt (decorative ok, non-decorative flag)
 *   - <img> tags with alt > 125 chars (SEO limit)
 *   - <OptimizedImage> usage without alt prop
 *
 * Also scans MDX content files for markdown image syntax:
 *   ![alt text](src) — flags empty alt
 *
 * Exit codes:
 *   0 — no issues
 *   1 — issues found (use in CI: fail build)
 *
 * Usage:
 *   npx tsx scripts/audit-img-alt.ts
 *   npx tsx scripts/audit-img-alt.ts --fix  (auto-add placeholder alt)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const CONTENT_DIR = path.join(SRC_DIR, 'content');
const FIX_MODE = process.argv.includes('--fix');

interface Issue {
  file: string;
  line: number;
  type: 'MISSING_ALT' | 'EMPTY_ALT' | 'ALT_TOO_LONG' | 'MARKDOWN_EMPTY_ALT';
  snippet: string;
  severity: 'error' | 'warn';
}

const issues: Issue[] = [];

// ─── Utility: walk directory ───────────────────────────────

function* walkDir(dir: string, exts: string[]): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      yield* walkDir(fullPath, exts);
    } else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e))) {
      yield fullPath;
    }
  }
}

// ─── Scan TSX/TSX files ────────────────────────────────────

const IMG_TAG_REGEX = /<img\b([^>]*?)(?:\/>|>)/gi;
const ALT_ATTR_REGEX = /\balt\s*=\s*(?:"([^"]*?)"|'([^']*?)'|{`([^`]*?)`}|{(['"])([^'"]*?)\4})/i;
const OPTIMIZED_IMAGE_REGEX = /<OptimizedImage\b([^>]*?)(?:\/>|>)/gi;

function scanTsx(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Scan <img> tags
  let match: RegExpExecArray | null;
  IMG_TAG_REGEX.lastIndex = 0;

  while ((match = IMG_TAG_REGEX.exec(content)) !== null) {
    const attrs = match[1] ?? '';
    const lineNum = content.slice(0, match.index).split('\n').length;
    const snippet = match[0].slice(0, 80).replace(/\n/g, ' ');

    const altMatch = ALT_ATTR_REGEX.exec(attrs);

    if (!altMatch) {
      issues.push({
        file: path.relative(ROOT, filePath),
        line: lineNum,
        type: 'MISSING_ALT',
        snippet,
        severity: 'error',
      });
    } else {
      const altValue = (altMatch[1] ?? altMatch[2] ?? altMatch[3] ?? altMatch[5] ?? '').trim();
      if (altValue === '') {
        // Empty alt: warn (could be decorative)
        issues.push({
          file: path.relative(ROOT, filePath),
          line: lineNum,
          type: 'EMPTY_ALT',
          snippet,
          severity: 'warn',
        });
      } else if (altValue.length > 125) {
        issues.push({
          file: path.relative(ROOT, filePath),
          line: lineNum,
          type: 'ALT_TOO_LONG',
          snippet: `alt="${altValue.slice(0, 50)}..." (${altValue.length} chars)`,
          severity: 'warn',
        });
      }
    }
  }

  // Scan <OptimizedImage> missing alt
  OPTIMIZED_IMAGE_REGEX.lastIndex = 0;
  while ((match = OPTIMIZED_IMAGE_REGEX.exec(content)) !== null) {
    const attrs = match[1] ?? '';
    if (!ALT_ATTR_REGEX.test(attrs)) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      issues.push({
        file: path.relative(ROOT, filePath),
        line: lineNum,
        type: 'MISSING_ALT',
        snippet: `<OptimizedImage ${attrs.slice(0, 60)}...`,
        severity: 'error',
      });
    }
  }
  void lines; // suppress unused warning
}

// ─── Scan MDX files (Markdown image syntax) ───────────────

const MARKDOWN_IMG_REGEX = /!\[(.*?)\]\(([^)]+)\)/g;

function scanMdx(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');

  let match: RegExpExecArray | null;
  MARKDOWN_IMG_REGEX.lastIndex = 0;
  while ((match = MARKDOWN_IMG_REGEX.exec(content)) !== null) {
    const altText = match[1]?.trim() ?? '';
    const lineNum = content.slice(0, match.index).split('\n').length;
    if (altText === '') {
      issues.push({
        file: path.relative(ROOT, filePath),
        line: lineNum,
        type: 'MARKDOWN_EMPTY_ALT',
        snippet: match[0].slice(0, 80),
        severity: 'error',
      });
    } else if (altText.length > 125) {
      issues.push({
        file: path.relative(ROOT, filePath),
        line: lineNum,
        type: 'ALT_TOO_LONG',
        snippet: `![${altText.slice(0, 50)}...](...)`,
        severity: 'warn',
      });
    }
  }
}

// ─── Main ─────────────────────────────────────────────────

console.log('🔍 eCyPro Image Alt Text Audit\n');

let scanned = 0;

for (const file of walkDir(SRC_DIR, ['.tsx', '.ts', '.jsx'])) {
  scanTsx(file);
  scanned++;
}
for (const file of walkDir(CONTENT_DIR, ['.mdx', '.md'])) {
  scanMdx(file);
  scanned++;
}

// ─── Report ───────────────────────────────────────────────

const errors = issues.filter((i) => i.severity === 'error');
const warnings = issues.filter((i) => i.severity === 'warn');

if (issues.length === 0) {
  console.log(`✅ All clean! Scanned ${scanned} files — 0 alt text issues.\n`);
  process.exit(0);
}

// Group by file
const byFile = new Map<string, Issue[]>();
for (const issue of issues) {
  const arr = byFile.get(issue.file) ?? [];
  arr.push(issue);
  byFile.set(issue.file, arr);
}

for (const [file, fileIssues] of byFile) {
  console.log(`📄 ${file}`);
  for (const issue of fileIssues) {
    const icon = issue.severity === 'error' ? '  ❌' : '  ⚠️ ';
    console.log(`${icon} Line ${issue.line}: [${issue.type}]`);
    console.log(`     ${issue.snippet}`);
  }
  console.log('');
}

console.log('─'.repeat(60));
console.log(`Scanned  : ${scanned} files`);
console.log(`Errors   : ${errors.length} (missing alt or empty markdown alt)`);
console.log(`Warnings : ${warnings.length} (empty JSX alt or too long)`);
console.log(`Total    : ${issues.length} issues`);

if (FIX_MODE) {
  console.log('\n⚠️  --fix mode is informational only — manual review required for alt content.');
}

// Exit 1 if errors (for CI)
process.exit(errors.length > 0 ? 1 : 0);
