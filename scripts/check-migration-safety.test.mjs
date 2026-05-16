#!/usr/bin/env node
/**
 * P18 BE Track 2 / Aşama 5 — Inline tests for migration safety analyzer.
 *
 * Pure-Node test (no vitest) so the CI workflow can run it without
 * installing the dev dep tree. Imports the analyzer's exported helpers
 * and asserts classification per fixture.
 *
 * Run:  node scripts/check-migration-safety.test.mjs
 */

import { analyzeSQL, classify } from './check-migration-safety.mjs';

const cases = [
  { name: 'DROP COLUMN → C', sql: 'ALTER TABLE users DROP COLUMN legacy;', expect: 'C' },
  { name: 'TRUNCATE → D', sql: 'TRUNCATE TABLE sessions;', expect: 'D' },
  { name: 'DROP DATABASE → D', sql: 'DROP DATABASE prod;', expect: 'D' },
  { name: 'CREATE TABLE → A', sql: 'CREATE TABLE x (id text);', expect: 'A' },
  { name: 'ADD COLUMN nullable → A', sql: 'ALTER TABLE x ADD COLUMN c text;', expect: 'A' },
  { name: 'SET NOT NULL → C', sql: 'ALTER TABLE x ALTER COLUMN c SET NOT NULL;', expect: 'C' },
  { name: 'ALTER TYPE → B', sql: 'ALTER TYPE colour ADD VALUE \'red\';', expect: 'B' },
  { name: 'RENAME COLUMN → B', sql: 'ALTER TABLE x RENAME COLUMN a TO b;', expect: 'B' },
  {
    name: 'comment mentioning DROP COLUMN ignored',
    sql: '-- This script does NOT drop column.\nCREATE TABLE x (id text);',
    expect: 'A',
  },
  {
    name: 'block comment mentioning TRUNCATE ignored',
    sql: '/* TRUNCATE TABLE bad; */\nCREATE TABLE x (id text);',
    expect: 'A',
  },
];

let failed = 0;
for (const tc of cases) {
  const findings = analyzeSQL(tc.sql);
  const got = classify(findings);
  const ok = got === tc.expect;
  console.log(`${ok ? '✓' : '✗'} ${tc.name} — expected ${tc.expect}, got ${got}`);
  if (!ok) {
    failed++;
    console.log('  findings:', JSON.stringify(findings));
  }
}

if (failed > 0) {
  console.error(`\n${failed}/${cases.length} migration-safety test(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} migration-safety tests passed.`);
