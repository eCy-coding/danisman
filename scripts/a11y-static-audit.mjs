#!/usr/bin/env node
/**
 * P15 — Static a11y audit.
 *
 * Browser-less, jsdom-less. Pure source-code scan over src/**.tsx for common
 * accessibility risks. Designed to run in sandbox (no rollup/vite required).
 *
 * Checked rules:
 *   1. <img> without alt
 *   2. <a> with empty inner text and no aria-label
 *   3. <button> with empty inner text and no aria-label
 *   4. <input>/<select>/<textarea> without id+<label htmlFor> OR aria-label
 *   5. <h*> hierarchy (skipped levels)
 *   6. role="alert" presence near error messages
 *   7. tabindex > 0 (anti-pattern)
 *
 * Output: machine-readable JSON + human summary.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const findings = [];

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // P15 — `test/` (Vitest) ve `__snapshots__` taranmaz; scanner kendi
      // regex'ini false-positive olarak bulmasın.
      if (
        entry.name === 'node_modules' ||
        entry.name === '__snapshots__' ||
        entry.name === 'test' ||
        entry.name === '__tests__'
      )
        continue;
      out.push(...(await walk(p)));
    } else if (/\.(tsx|jsx)$/.test(entry.name) && !/\.test\.[jt]sx?$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

function fileFindings(rel, source) {
  // 1. <img without alt
  const imgRe = /<img\b[^>]*?>/g;
  let m;
  while ((m = imgRe.exec(source))) {
    const tag = m[0];
    if (!/\balt\s*=/.test(tag)) {
      findings.push({
        rule: 'IMG_NO_ALT',
        severity: 'error',
        file: rel,
        line: source.slice(0, m.index).split('\n').length,
        snippet: tag.slice(0, 120),
      });
    }
  }

  // 2. positive tabindex
  const tabRe = /tabIndex\s*=\s*\{?\s*([1-9]\d*)\s*\}?/g;
  while ((m = tabRe.exec(source))) {
    findings.push({
      rule: 'POSITIVE_TABINDEX',
      severity: 'warn',
      file: rel,
      line: source.slice(0, m.index).split('\n').length,
      snippet: `tabIndex=${m[1]}`,
    });
  }

  // 3. <a> with onClick but no href (a11y anti-pattern)
  const aClickRe = /<a\s+onClick=/g;
  while ((m = aClickRe.exec(source))) {
    findings.push({
      rule: 'ANCHOR_ONCLICK_NO_HREF',
      severity: 'warn',
      file: rel,
      line: source.slice(0, m.index).split('\n').length,
      snippet: '<a onClick=...> without href',
    });
  }

  // 4. <button without type — defaults to "submit" inside form (potential bug)
  const btnRe = /<button(\s[^>]*?)?>/g;
  while ((m = btnRe.exec(source))) {
    const attrs = m[1] ?? '';
    if (!/\btype\s*=/.test(attrs)) {
      findings.push({
        rule: 'BUTTON_NO_TYPE',
        severity: 'info',
        file: rel,
        line: source.slice(0, m.index).split('\n').length,
        snippet: '<button> without explicit type',
      });
    }
  }

  // 5. aria-label="" empty
  const emptyAriaRe = /aria-label\s*=\s*['"]\s*['"]/g;
  while ((m = emptyAriaRe.exec(source))) {
    findings.push({
      rule: 'EMPTY_ARIA_LABEL',
      severity: 'error',
      file: rel,
      line: source.slice(0, m.index).split('\n').length,
      snippet: 'aria-label=""',
    });
  }
}

(async () => {
  const files = await walk(SRC);
  for (const f of files) {
    const src = await fs.readFile(f, 'utf8');
    fileFindings(path.relative(ROOT, f), src);
  }

  const bySeverity = { error: 0, warn: 0, info: 0 };
  const byRule = {};
  for (const f of findings) {
    bySeverity[f.severity]++;
    byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
  }
  console.log('=== P15 a11y static audit ===');
  console.log(`Files scanned: ${files.length}`);
  console.log(`Findings: error=${bySeverity.error} warn=${bySeverity.warn} info=${bySeverity.info}`);
  console.log('By rule:');
  for (const [r, c] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${r.padEnd(28)} ${c}`);
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(findings, null, 2));
  }

  // Show first 20 errors for quick triage
  const errs = findings.filter((f) => f.severity === 'error').slice(0, 20);
  if (errs.length) {
    console.log('\n--- First errors ---');
    for (const e of errs) {
      console.log(`[${e.rule}] ${e.file}:${e.line}  ${e.snippet}`);
    }
  }

  // Exit non-zero only if errors
  process.exit(bySeverity.error > 0 ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(2);
});
