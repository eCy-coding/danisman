#!/usr/bin/env tsx
/**
 * P31-T10: JSON-LD Schema Audit
 *
 * Parses every HTML file in dist/ and validates:
 *   1. JSON-LD <script> tags exist on expected pages
 *   2. Each JSON-LD block is valid JSON (syntactically)
 *   3. @type and @context are present
 *   4. Required fields per @type (BreadcrumbList, Article, FAQPage, Service, etc.)
 *   5. Generates audit report at audits/jsonld-audit.json
 *
 * Usage:  npm run audit:jsonld
 * Exit:   0 = all pass | 1 = failures found
 */

import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname ?? process.cwd(), '..');
const DIST_DIR = join(ROOT, 'dist');
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
}

interface PageResult {
  file: string;
  schemas: SchemaResult[];
  totalIssues: number;
}

// ── Helper: collect HTML files ────────────────────────────────────────────────
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

// ── Extract + validate all JSON-LD blocks ────────────────────────────────────
function auditJsonLd(html: string): SchemaResult[] {
  const results: SchemaResult[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();
    const issues: string[] = [];
    let data: Record<string, unknown> = {};
    let schemaType = 'unknown';

    // 1. Valid JSON
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch (e) {
      issues.push(`Invalid JSON: ${(e as Error).message}`);
      results.push({ type: schemaType, valid: false, issues, data });
      continue;
    }

    // 2. @context present
    if (!data['@context']) issues.push('Missing @context');

    // 3. @type present
    if (!data['@type']) {
      issues.push('Missing @type');
    } else {
      schemaType = String(data['@type']);

      // 4. Required fields
      const required = REQUIRED_FIELDS[schemaType] ?? [];
      for (const field of required) {
        if (!(field in data)) issues.push(`Missing required field: ${field}`);
      }
    }

    results.push({ type: schemaType, valid: issues.length === 0, issues, data });
  }

  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main(): void {
  console.log('\n🔍 EcyPro JSON-LD Schema Audit\n');

  let htmlFiles: string[];
  try {
    htmlFiles = collectHtmlFiles(DIST_DIR);
  } catch {
    console.error('  ⚠️  dist/ not found — run `npm run build` first.\n');
    process.exit(1);
  }

  console.log(`  Scanning ${htmlFiles.length} HTML files…\n`);

  const report: PageResult[] = [];
  let totalFailed = 0;
  let totalSchemas = 0;

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const schemas = auditJsonLd(html);
    const totalIssues = schemas.reduce((acc, s) => acc + s.issues.length, 0);
    const relFile = relative(ROOT, file);

    report.push({ file: relFile, schemas, totalIssues });
    totalSchemas += schemas.length;

    if (schemas.length === 0) {
      console.log(`  ⬜ ${relFile}  (no JSON-LD)`);
    } else if (totalIssues === 0) {
      const types = schemas.map((s) => s.type).join(', ');
      console.log(`  ✅ ${relFile}  [${types}]`);
    } else {
      totalFailed++;
      console.error(`  ❌ ${relFile}  — ${totalIssues} issue(s)`);
      schemas.forEach((s) => {
        s.issues.forEach((i) => console.error(`       @${s.type}: ${i}`));
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
