#!/usr/bin/env npx tsx
/**
 * P39-T08: i18n Translation Memory Suggestion Engine
 *
 * Given a source string, finds the closest match in brain/i18n/memory.json
 * using Levenshtein distance normalized by string length.
 *
 * Algorithm:
 *   similarity(a, b) = 1 - editDistance(a.lower, b.lower) / max(len(a), len(b))
 *   Levenshtein DP: O(m×n) time, O(min(m,n)) space (one-row optimization)
 *
 * Match threshold: similarity ≥ 0.65 → suggest
 *
 * Usage:
 *   npx tsx scripts/i18n-suggest.ts "Strateji Görüşmesi"
 *   npx tsx scripts/i18n-suggest.ts --audit     # scan all locale JSON files for missing translations
 *   npx tsx scripts/i18n-suggest.ts --stats     # show TM coverage stats
 *
 * Output:
 *   Top-3 matches with similarity score, context key, and existing TR/EN pair
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MEMORY_PATH = path.join(ROOT, 'brain/i18n/memory.json');
const LOCALES_DIR = path.join(ROOT, 'public/locales');

const SIMILARITY_THRESHOLD = 0.65;
const TOP_K = 3;

// ─── Types ───────────────────────────────────────────────

interface TMPair {
  id: string;
  context: string;
  source: { lang: string; text: string };
  target: { lang: string; text: string };
  approved: boolean;
  variants: string[];
  note?: string;
}

interface TMFile {
  _meta: { version: string; lastUpdated: string; totalPairs: number };
  pairs: TMPair[];
}

// ─── Levenshtein distance (Wagner-Fischer, one-row) ──────

function levenshtein(a: string, b: string): number {
  // O(min(m,n)) space optimization — swap to ensure a ≤ b
  if (a.length > b.length) [a, b] = [b, a];
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    const curr: number[] = [j];
    for (let i = 1; i <= m; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(
        (curr[i - 1] ?? 0) + 1, // insertion
        (prev[i] ?? 0) + 1, // deletion
        (prev[i - 1] ?? 0) + cost, // substitution
      );
    }
    prev = curr;
  }
  return prev[m] ?? 0;
}

/**
 * Normalized similarity: 1 - editDist / maxLen ∈ [0, 1]
 * 1 = identical, 0 = completely different
 */
function similarity(a: string, b: string): number {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─── Load TM ─────────────────────────────────────────────

function loadTM(): TMFile {
  if (!fs.existsSync(MEMORY_PATH)) {
    console.error(`[i18n-suggest] TM not found: ${MEMORY_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf-8')) as TMFile;
}

// ─── Suggestion engine ────────────────────────────────────

interface SuggestionResult {
  pair: TMPair;
  similarity: number;
  matchedOn: 'source' | 'target' | 'variant';
}

function suggest(query: string, tm: TMFile, topK = TOP_K): SuggestionResult[] {
  const results: SuggestionResult[] = [];

  for (const pair of tm.pairs) {
    const candidates = [
      { text: pair.source.text, field: 'source' as const },
      { text: pair.target.text, field: 'target' as const },
      ...pair.variants.map((v) => ({ text: v, field: 'variant' as const })),
    ];

    let best = 0;
    let bestField: 'source' | 'target' | 'variant' = 'source';
    for (const { text, field } of candidates) {
      const sim = similarity(query, text);
      if (sim > best) {
        best = sim;
        bestField = field;
      }
    }

    if (best >= SIMILARITY_THRESHOLD) {
      results.push({ pair, similarity: best, matchedOn: bestField });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

// ─── Audit mode: scan locale JSON files ───────────────────

interface AuditIssue {
  file: string;
  key: string;
  issue: 'MISSING_TR' | 'MISSING_EN' | 'EMPTY_VALUE';
}

function auditLocales(): void {
  const issues: AuditIssue[] = [];
  const langs = fs
    .readdirSync(LOCALES_DIR)
    .filter((d) => fs.statSync(path.join(LOCALES_DIR, d)).isDirectory());

  // Build key map: key → {lang: value}
  const keyMap = new Map<string, Map<string, string>>();
  for (const lang of langs) {
    const nsFiles = fs.readdirSync(path.join(LOCALES_DIR, lang));
    for (const nsFile of nsFiles) {
      if (!nsFile.endsWith('.json')) continue;
      const ns = nsFile.replace('.json', '');
      const content = JSON.parse(
        fs.readFileSync(path.join(LOCALES_DIR, lang, nsFile), 'utf-8'),
      ) as Record<string, unknown>;
      const flatten = (obj: unknown, prefix = ''): void => {
        if (typeof obj !== 'object' || obj === null) return;
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          const fullKey = `${ns}.${prefix}${k}`;
          if (typeof v === 'string') {
            if (!keyMap.has(fullKey)) keyMap.set(fullKey, new Map());
            keyMap.get(fullKey)!.set(lang, v);
            if (v.trim() === '')
              issues.push({ file: `${lang}/${nsFile}`, key: fullKey, issue: 'EMPTY_VALUE' });
          } else if (typeof v === 'object') {
            flatten(v, `${k}.`);
          }
        }
      };
      flatten(content);
    }
  }

  // Find keys present in TR but missing in EN (or vice versa)
  for (const [key, langMap] of keyMap) {
    if (langs.includes('tr') && !langMap.has('tr')) {
      issues.push({ file: 'en/*', key, issue: 'MISSING_TR' });
    }
    if (langs.includes('en') && !langMap.has('en')) {
      issues.push({ file: 'tr/*', key, issue: 'MISSING_EN' });
    }
  }

  if (issues.length === 0) {
    console.log('✅ All locale keys are consistent across TR/EN.\n');
    return;
  }

  console.log(`\n📋 i18n Audit — ${issues.length} issue(s):\n`);
  for (const issue of issues.slice(0, 50)) {
    const icon = issue.issue === 'EMPTY_VALUE' ? '⚠️ ' : '❌';
    console.log(`${icon} [${issue.issue}] ${issue.key} (${issue.file})`);
  }
  if (issues.length > 50) console.log(`... and ${issues.length - 50} more`);
}

// ─── Stats mode ───────────────────────────────────────────

function showStats(tm: TMFile): void {
  const approved = tm.pairs.filter((p) => p.approved).length;
  const pending = tm.pairs.length - approved;
  console.log(`\n📊 Translation Memory Stats:`);
  console.log(`   Total pairs : ${tm.pairs.length}`);
  console.log(`   Approved    : ${approved}`);
  console.log(`   Pending     : ${pending}`);
  console.log(`   Last updated: ${tm._meta.lastUpdated}\n`);
}

// ─── Main ─────────────────────────────────────────────────

const args = process.argv.slice(2);
const tm = loadTM();

if (args.includes('--audit')) {
  console.log('\n🔍 Running i18n locale audit...\n');
  auditLocales();
} else if (args.includes('--stats')) {
  showStats(tm);
} else if (args.length === 0 || args[0]?.startsWith('--')) {
  console.log('Usage: npx tsx scripts/i18n-suggest.ts "source string"');
  console.log('       npx tsx scripts/i18n-suggest.ts --audit');
  console.log('       npx tsx scripts/i18n-suggest.ts --stats');
} else {
  const query = args.join(' ');
  const results = suggest(query, tm);

  console.log(`\n🔤 Translation Memory — suggestions for: "${query}"\n`);
  if (results.length === 0) {
    console.log(`  No matches above threshold (${SIMILARITY_THRESHOLD}) — add to memory.json\n`);
  } else {
    for (const r of results) {
      console.log(`  [${Math.round(r.similarity * 100)}%] ${r.pair.id} | ${r.pair.context}`);
      console.log(`    TR: ${r.pair.source.text}`);
      console.log(`    EN: ${r.pair.target.text}`);
      if (r.pair.variants.length > 0) console.log(`    Variants: ${r.pair.variants.join(', ')}`);
      if (r.pair.note) console.log(`    Note: ${r.pair.note}`);
      console.log();
    }
  }
}
