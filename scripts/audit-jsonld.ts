#!/usr/bin/env tsx
/**
 * P31-T10: JSON-LD Schema Audit
 * W3 (M9 follow-up): duplicate-block detection.
 *
 * Parses every prerendered index.html under dist/ (recursively) and validates:
 *   1. JSON-LD <script> tags exist on expected pages
 *   2. Each JSON-LD block is valid JSON (syntactically)
 *   3. @type and @context are present
 *   4. Required fields per @type (BreadcrumbList, Article, FAQPage, Service, etc.)
 *   5. No two blocks on the SAME page collide:
 *        a. same data-seo-id (the upsert key SEO.tsx/SchemaOrg.tsx/JsonLd.tsx
 *           use to dedup client-side injection against the static index.html
 *           bake — see M9 in brain/MISTAKES_LOG.md), OR
 *        b. both lack data-seo-id AND share identical @type + name (name-less
 *           types like BreadcrumbList are compared on @type only; the itemList
 *           entries *inside* one BreadcrumbList block are not separate blocks
 *           so legitimate multi-item lists are never flagged).
 *   6. Generates audit report at audits/jsonld-audit.json
 *
 * Usage:  npm run audit:jsonld  (or) npx tsx scripts/audit-jsonld.ts [distDir]
 * Exit:   0 = all pass, or dist/ absent (skipped) | 1 = failures found
 */

import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, relative, resolve } from 'path';

const ROOT = join(import.meta.dirname ?? process.cwd(), '..');
const distArg = process.argv[2];
const DIST_DIR = distArg ? resolve(process.cwd(), distArg) : join(ROOT, 'dist');
const AUDITS_DIR = join(ROOT, 'audits');
const REPORT_PATH = join(AUDITS_DIR, 'jsonld-audit.json');

// ── Required fields per @type ─────────────────────────────────────────────────
const REQUIRED_FIELDS: Record<string, string[]> = {
  BreadcrumbList: ['itemListElement'],
  Article: ['headline', 'author', 'datePublished'],
  BlogPosting: ['headline', 'author', 'datePublished'],
  FAQPage: ['mainEntity'],
  Service: ['name', 'provider'],
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  WebPage: ['name'],
  ContactPage: ['name'],
  ItemList: ['itemListElement'],
};

interface SchemaResult {
  type: string;
  valid: boolean;
  issues: string[];
  data: Record<string, unknown>;
  /** data-seo-id attribute on the <script> tag, if present (upsert dedup key). */
  seoId: string | null;
}

interface DuplicateGroup {
  key: string;
  reason: 'data-seo-id' | '@type+name';
  count: number;
}

interface PageResult {
  file: string;
  schemas: SchemaResult[];
  totalIssues: number;
  duplicates: DuplicateGroup[];
}

// ── Helper: collect prerendered HTML files (dist/**/index.html) ───────────────
function collectHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectHtmlFiles(full));
    } else if (entry === 'index.html') {
      results.push(full);
    }
  }
  return results;
}

function typeKey(type: unknown): string {
  if (Array.isArray(type)) return [...type].map(String).sort().join('+');
  return String(type ?? '');
}

// ── Extract + validate all JSON-LD blocks ────────────────────────────────────
function auditJsonLd(html: string): SchemaResult[] {
  const results: SchemaResult[] = [];
  // Capture the opening <script ...> tag (attrs) and body separately so we can
  // pull data-seo-id regardless of attribute order, while still only matching
  // application/ld+json blocks.
  const regex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const attrs = match[1];
    if (!/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;

    const seoIdMatch = /data-seo-id\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const seoId = seoIdMatch ? seoIdMatch[1] : null;

    const raw = match[2].trim();
    const issues: string[] = [];
    let data: Record<string, unknown> = {};
    let schemaType = 'unknown';

    // 1. Valid JSON
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch (e) {
      issues.push(`Invalid JSON: ${(e as Error).message}`);
      results.push({ type: schemaType, valid: false, issues, data, seoId });
      continue;
    }

    // 2. @context present
    if (!data['@context']) issues.push('Missing @context');

    // 3. @type present
    if (!data['@type']) {
      issues.push('Missing @type');
    } else {
      schemaType = typeKey(data['@type']);

      // 4. Required fields (lookup per the JSON-provided @type, not the
      // sorted joined key used for dedup comparisons).
      const rawType = Array.isArray(data['@type'])
        ? String(data['@type'][0])
        : String(data['@type']);
      const required = REQUIRED_FIELDS[rawType] ?? [];
      for (const field of required) {
        if (!(field in data)) issues.push(`Missing required field: ${field}`);
      }
    }

    results.push({ type: schemaType, valid: issues.length === 0, issues, data, seoId });
  }

  return results;
}

// ── Duplicate detection (M9): two blocks on ONE page must never collide on
// their dedup key — either a shared data-seo-id (the client upsert key), or,
// for anonymous blocks (no data-seo-id), identical @type + name. Nested
// entries (e.g. BreadcrumbList.itemListElement) are never separate <script>
// blocks, so legitimate multi-item lists inside one block are unaffected. ──
function findDuplicates(schemas: SchemaResult[]): DuplicateGroup[] {
  const byId = new Map<string, number>();
  const byTypeName = new Map<string, number>();

  for (const s of schemas) {
    if (s.seoId) {
      byId.set(s.seoId, (byId.get(s.seoId) ?? 0) + 1);
    } else if (s.type !== 'unknown') {
      const name = typeof s.data['name'] === 'string' ? (s.data['name'] as string) : '';
      const key = `${s.type}::${name}`;
      byTypeName.set(key, (byTypeName.get(key) ?? 0) + 1);
    }
  }

  const duplicates: DuplicateGroup[] = [];
  for (const [key, count] of byId) {
    if (count > 1) duplicates.push({ key, reason: 'data-seo-id', count });
  }
  for (const [key, count] of byTypeName) {
    if (count > 1) duplicates.push({ key, reason: '@type+name', count });
  }
  return duplicates;
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main(): void {
  console.log('\n🔍 eCyPro JSON-LD Schema Audit\n');

  // No dist/ — this must never break non-build contexts (fresh checkout,
  // typecheck-only CI lanes, local `npx tsx` before ever running `npm run build`).
  if (!existsSync(DIST_DIR)) {
    console.log(
      `  ⬜ no dist, skipped — ${relative(ROOT, DIST_DIR)} not found. Run \`npm run build\` first.\n`,
    );
    process.exit(0);
  }

  const htmlFiles = collectHtmlFiles(DIST_DIR);
  console.log(
    `  Scanning ${htmlFiles.length} index.html file(s) under ${relative(ROOT, DIST_DIR)}…\n`,
  );

  const report: PageResult[] = [];
  let totalFailed = 0;
  let totalSchemas = 0;

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const schemas = auditJsonLd(html);
    const totalIssues = schemas.reduce((acc, s) => acc + s.issues.length, 0);
    const duplicates = findDuplicates(schemas);
    const relFile = relative(ROOT, file);
    const pageFailed = totalIssues > 0 || duplicates.length > 0;

    report.push({ file: relFile, schemas, totalIssues, duplicates });
    totalSchemas += schemas.length;

    if (schemas.length === 0) {
      console.log(`  ⬜ ${relFile}  (no JSON-LD)`);
    } else if (!pageFailed) {
      const types = schemas.map((s) => s.type).join(', ');
      console.log(`  ✅ ${relFile}  [${types}]`);
    } else {
      totalFailed++;
      console.error(
        `  ❌ ${relFile}  — ${schemas.length} block(s), ${totalIssues} issue(s), ${duplicates.length} duplicate group(s)`,
      );
      schemas.forEach((s) => {
        s.issues.forEach((i) => console.error(`       @${s.type}: ${i}`));
      });
      duplicates.forEach((d) => {
        console.error(`       DUPLICATE (${d.reason}): ${d.key}  ×${d.count}`);
      });
    }
  }

  // Write report
  try {
    mkdirSync(AUDITS_DIR, { recursive: true });
    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log(`\n  📄 Report saved: ${relative(ROOT, REPORT_PATH)}`);
  } catch {
    console.warn('  ⚠️  Could not write audit report.');
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  HTML files  : ${htmlFiles.length}`);
  console.log(`  Schemas     : ${totalSchemas}`);
  console.log(`  Pages pass  : ${htmlFiles.length - totalFailed}`);
  console.log(`  Pages fail  : ${totalFailed}`);
  console.log(`${'─'.repeat(60)}\n`);

  process.exit(totalFailed > 0 ? 1 : 0);
}

main();
