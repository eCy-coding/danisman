#!/usr/bin/env node
/**
 * P18 BE Track 2 / Aşama 5 — Prisma migration safety analyzer.
 *
 * Walks `prisma/migrations/*.sql` and flags risky DDL using a 4-tier
 * risk classification (matching the P14-BE risk register):
 *
 *   A — Append-only / additive.    CREATE TABLE, CREATE INDEX CONCURRENTLY,
 *                                   ADD COLUMN nullable, ADD CONSTRAINT
 *                                   NOT VALID, etc. CI auto-approve.
 *   B — Reversible mutations.      ALTER TYPE expand, ADD COLUMN NOT NULL
 *                                   DEFAULT, rename via VIEW. CI auto-approve
 *                                   but flag in PR comment.
 *   C — Irreversible / lossy.      DROP COLUMN, DROP TABLE,
 *                                   ALTER COLUMN NOT NULL (over data),
 *                                   ALTER COLUMN TYPE (narrowing).
 *                                   CI requires manual approval label.
 *   D — Catastrophic.              TRUNCATE, DELETE without WHERE,
 *                                   DROP DATABASE/SCHEMA. CI hard-fails.
 *
 * Output:
 *   - JSON summary to stdout
 *   - `STRICT=1` exits 1 when any class C or D statement is found,
 *     so the GitHub Actions workflow can use this as a hard gate.
 *
 * Usage:
 *   node scripts/check-migration-safety.mjs
 *   node scripts/check-migration-safety.mjs --since=20260516200000
 *   STRICT=1 node scripts/check-migration-safety.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const MIGRATIONS = path.join(ROOT, 'prisma', 'migrations');

// ──────────────────────────────────────────────────────────────────
// Risk patterns
// ──────────────────────────────────────────────────────────────────

const PATTERNS = [
  // ── D: Catastrophic ───────────────────────────────────────────
  {
    class: 'D',
    label: 'DROP DATABASE',
    regex: /\bDROP\s+DATABASE\b/i,
  },
  {
    class: 'D',
    label: 'DROP SCHEMA',
    regex: /\bDROP\s+SCHEMA\b/i,
  },
  {
    class: 'D',
    label: 'TRUNCATE',
    regex: /\bTRUNCATE\s+(TABLE\s+)?[A-Za-z0-9_"]+/i,
  },
  {
    class: 'D',
    label: 'Unscoped DELETE',
    regex: /\bDELETE\s+FROM\s+[A-Za-z0-9_"]+\s*(;|$)/im,
  },

  // ── C: Irreversible / lossy ───────────────────────────────────
  {
    class: 'C',
    label: 'DROP TABLE',
    regex: /\bDROP\s+TABLE\b/i,
  },
  {
    class: 'C',
    label: 'DROP COLUMN',
    regex: /\bALTER\s+TABLE\s+[A-Za-z0-9_"]+\s+DROP\s+COLUMN\b/i,
  },
  {
    class: 'C',
    label: 'ALTER COLUMN NOT NULL (rewrite)',
    regex: /\bALTER\s+COLUMN\s+[A-Za-z0-9_"]+\s+SET\s+NOT\s+NULL\b/i,
  },
  {
    class: 'C',
    label: 'ALTER COLUMN TYPE (narrowing risk)',
    regex: /\bALTER\s+COLUMN\s+[A-Za-z0-9_"]+\s+TYPE\b/i,
  },
  {
    class: 'C',
    label: 'DROP CONSTRAINT',
    regex: /\bDROP\s+CONSTRAINT\b/i,
  },
  {
    class: 'C',
    label: 'DROP INDEX',
    regex: /\bDROP\s+INDEX\b/i,
  },

  // ── B: Reversible mutations ──────────────────────────────────
  {
    class: 'B',
    label: 'ALTER TYPE (enum expand/rename)',
    regex: /\bALTER\s+TYPE\b/i,
  },
  {
    class: 'B',
    label: 'RENAME COLUMN',
    regex: /\bRENAME\s+COLUMN\b/i,
  },
  {
    class: 'B',
    label: 'RENAME TO (table)',
    regex: /\bRENAME\s+TO\b/i,
  },
  {
    class: 'B',
    label: 'ADD COLUMN NOT NULL DEFAULT',
    regex:
      /\bALTER\s+TABLE\s+[A-Za-z0-9_"]+\s+ADD\s+COLUMN\s+[A-Za-z0-9_"]+\s+[A-Z0-9_("\s]+NOT\s+NULL\b/i,
  },
];

// ──────────────────────────────────────────────────────────────────
// File discovery + SQL stripping
// ──────────────────────────────────────────────────────────────────

function listMigrationFiles(since) {
  if (!fs.existsSync(MIGRATIONS)) return [];
  const dirs = fs
    .readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const out = [];
  for (const dir of dirs) {
    if (since && dir < since) continue;
    const dirAbs = path.join(MIGRATIONS, dir);
    for (const f of fs.readdirSync(dirAbs)) {
      if (f.endsWith('.sql')) out.push(path.join(dirAbs, f));
    }
  }
  return out;
}

/** Strip `-- ...` line comments and `/* ... *‍/` block comments so the
 *  pattern matcher doesn't false-positive on documentation. */
function stripSqlComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');
}

// ──────────────────────────────────────────────────────────────────
// Analyzer
// ──────────────────────────────────────────────────────────────────

export function analyzeSQL(rawSql) {
  const sql = stripSqlComments(rawSql);
  const findings = [];
  for (const p of PATTERNS) {
    const re = new RegExp(p.regex.source, 'gi');
    let m;
    while ((m = re.exec(sql)) !== null) {
      findings.push({
        class: p.class,
        label: p.label,
        snippet: m[0].slice(0, 160),
      });
      if (!re.global) break;
    }
  }
  return findings;
}

function analyzeFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return analyzeSQL(raw);
}

export function classify(findings) {
  if (findings.some((f) => f.class === 'D')) return 'D';
  if (findings.some((f) => f.class === 'C')) return 'C';
  if (findings.some((f) => f.class === 'B')) return 'B';
  return 'A';
}

export { PATTERNS, stripSqlComments };

function arg(name) {
  const prefix = `--${name}=`;
  for (const a of process.argv.slice(2)) if (a.startsWith(prefix)) return a.slice(prefix.length);
  return null;
}

function main() {
  const since = arg('since');
  const files = listMigrationFiles(since);
  const report = [];
  let worstClass = 'A';

  for (const file of files) {
    const findings = analyzeFile(file);
    const klass = classify(findings);
    if (klass > worstClass) worstClass = klass;
    if (findings.length > 0) {
      report.push({
        migration: path.relative(ROOT, file),
        riskClass: klass,
        findings,
      });
    }
  }

  const summary = {
    scanned: files.length,
    risky: report.length,
    worstClass,
    threshold: process.env.MIGRATION_SAFETY_THRESHOLD ?? 'C',
  };

  console.log(JSON.stringify({ summary, report }, null, 2));

  if (process.env.STRICT === '1') {
    const threshold = (summary.threshold || 'C').toUpperCase();
    // Hard-fail when worstClass exceeds threshold.
    if (worstClass >= threshold) {
      console.error(
        `[migration-safety] STRICT=1 + worstClass=${worstClass} (threshold=${threshold}) — FAILING`,
      );
      process.exit(1);
    }
  }
}

// Only run the CLI when invoked directly (not when imported as a module).
const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) main();
