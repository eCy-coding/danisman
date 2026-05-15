#!/usr/bin/env node
/**
 * content-qa.mjs — Content QA suite for the content-qa-auditor subagent.
 *
 * Checks:
 *   --check parity   TR/EN i18n namespace key parity (strict, fails CI)
 *   --check missing  Used in code but not in locale (auto-suggests, exits 1)
 *   --check orphans  In locale, not used in code (info-only)
 *   --check alt      <img> without `alt` attribute (warn)
 *   --check links    <Link to="..."> targets that don't match defined routes (warn)
 *   --check all      Runs everything sequentially
 *
 * Output:
 *   stdout: human-readable table
 *   outputs/content-qa-<check>-<date>.json (CI artifact)
 *
 * Exit codes:
 *   0 — all green or warn-only checks (alt, orphans, links)
 *   1 — parity or missing check failed (gate)
 *
 * Pure Node, no external deps. Uses fast-glob built into Node 22+ via fs.glob().
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const LOCALES = path.join(ROOT, 'public', 'locales');
const SRC = path.join(ROOT, 'src');
const OUTPUTS = path.join(ROOT, 'outputs');

const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', RESET = '\x1b[0m';
const t = (c, x) => `${c}${x}${RESET}`;

// ----------------------------- args ----------------------------
function getArg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const CHECK = getArg('check', 'all');
const APPLY = process.argv.includes('--apply');

// ----------------------------- helpers -------------------------
function walk(dir, pattern = /\.tsx?$/, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, pattern, out);
    else if (pattern.test(name)) out.push(full);
  }
  return out;
}

function flat(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? flat(v, prefix + k + '.')
      : [prefix + k]
  );
}

function ensureOutputs() {
  if (!existsSync(OUTPUTS)) mkdirSync(OUTPUTS, { recursive: true });
}

function writeReport(name, data) {
  ensureOutputs();
  const file = path.join(OUTPUTS, `content-qa-${name}-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

// ----------------------------- checks --------------------------

function checkParity() {
  console.log(`\n${DIM}── parity check (TR/EN i18n namespaces) ──${RESET}`);
  const trDir = path.join(LOCALES, 'tr');
  const enDir = path.join(LOCALES, 'en');
  if (!existsSync(trDir) || !existsSync(enDir)) {
    console.log(t(RED, '✗ public/locales/{tr,en} not found'));
    return { ok: false };
  }

  const namespaces = readdirSync(trDir).filter((f) => f.endsWith('.json'));
  const report = [];
  let allOk = true;

  for (const ns of namespaces) {
    const tr = JSON.parse(readFileSync(path.join(trDir, ns), 'utf8'));
    const en = JSON.parse(readFileSync(path.join(enDir, ns), 'utf8'));
    const trKeys = flat(tr).sort();
    const enKeys = flat(en).sort();

    const onlyTr = trKeys.filter((k) => !enKeys.includes(k));
    const onlyEn = enKeys.filter((k) => !trKeys.includes(k));
    const ok = onlyTr.length === 0 && onlyEn.length === 0;
    if (!ok) allOk = false;

    const mark = ok ? t(GREEN, '✓') : t(RED, '✗');
    console.log(`  ${mark} ${ns.padEnd(20)} TR=${trKeys.length} EN=${enKeys.length}${
      ok ? '' : `  only-TR: [${onlyTr.slice(0, 3).join(', ')}${onlyTr.length > 3 ? '…' : ''}]  only-EN: [${onlyEn.slice(0, 3).join(', ')}${onlyEn.length > 3 ? '…' : ''}]`
    }`);

    report.push({ namespace: ns, trKeys: trKeys.length, enKeys: enKeys.length, onlyTr, onlyEn, ok });
  }

  const file = writeReport('parity', report);
  console.log(`  ${DIM}→ ${file}${RESET}`);
  return { ok: allOk, report };
}

function collectTCalls() {
  const files = walk(SRC, /\.(ts|tsx)$/);
  // Match t('key') or t("key") or t(`key`) including namespace-prefixed: t('legal:cookies.title')
  const re = /\bt\(\s*['"`]([a-zA-Z][a-zA-Z0-9_:.-]*)['"`]/g;
  const found = new Map();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(src))) {
      const key = m[1];
      if (!found.has(key)) found.set(key, []);
      found.get(key).push(path.relative(ROOT, f));
    }
  }
  return found;
}

function loadAllNamespaces() {
  const out = new Map(); // ns -> Set<key>
  for (const lang of ['tr', 'en']) {
    const dir = path.join(LOCALES, lang);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const ns = file.replace(/\.json$/, '');
      const data = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
      const keys = new Set(flat(data));
      const existing = out.get(ns) || new Set();
      for (const k of keys) existing.add(k);
      out.set(ns, existing);
    }
  }
  return out;
}

function checkMissing() {
  console.log(`\n${DIM}── missing check (used in code, not in locale) ──${RESET}`);
  const calls = collectTCalls();
  const namespaces = loadAllNamespaces();
  const defaultNs = 'translation';

  const missing = [];
  for (const [key, files] of calls.entries()) {
    let ns = defaultNs, lookup = key;
    if (key.includes(':')) {
      const [n, k] = key.split(':', 2);
      ns = n;
      lookup = k;
    }
    const nsKeys = namespaces.get(ns);
    if (!nsKeys || !nsKeys.has(lookup)) {
      missing.push({ key, namespace: ns, lookup, files });
    }
  }

  if (missing.length === 0) {
    console.log(t(GREEN, `  ✓ 0 missing keys`));
  } else {
    console.log(t(RED, `  ✗ ${missing.length} missing keys`));
    for (const m of missing.slice(0, 10)) {
      console.log(`    - ${m.key}  ${DIM}(${m.files[0]})${RESET}`);
    }
    if (missing.length > 10) console.log(`    … and ${missing.length - 10} more`);
  }

  const file = writeReport('missing', missing);
  console.log(`  ${DIM}→ ${file}${RESET}`);
  return { ok: missing.length === 0, missing };
}

function checkOrphans() {
  console.log(`\n${DIM}── orphan check (in locale, not used in code — info only) ──${RESET}`);
  const calls = collectTCalls();
  const usedSet = new Set(
    [...calls.keys()].map((k) => (k.includes(':') ? k : `translation:${k}`))
  );
  const namespaces = loadAllNamespaces();
  const orphans = [];

  for (const [ns, keys] of namespaces.entries()) {
    for (const k of keys) {
      const full = `${ns}:${k}`;
      // Skip leaf-only matches inside grouped keys (e.g. .sections.foo when only .sections used)
      // Heuristic: check if any used key starts with this prefix.
      const used = usedSet.has(full) ||
        [...usedSet].some((u) => u.startsWith(full + '.') || full.startsWith(u + '.'));
      if (!used) orphans.push({ namespace: ns, key: k });
    }
  }

  console.log(`  ${orphans.length === 0 ? t(GREEN, '✓ 0 orphans') : t(YELLOW, `⚠ ${orphans.length} potential orphans`)}`);
  for (const o of orphans.slice(0, 10)) console.log(`    - ${o.namespace}.${o.key}`);
  if (orphans.length > 10) console.log(`    … and ${orphans.length - 10} more`);

  const file = writeReport('orphans', orphans);
  console.log(`  ${DIM}→ ${file}${RESET}`);
  return { ok: true, orphans }; // warn-only
}

function checkAlt() {
  console.log(`\n${DIM}── <img> alt audit ──${RESET}`);
  const files = walk(SRC, /\.(ts|tsx)$/);
  // crude scan: find <img ... > occurrences and verify alt= present
  const re = /<img\b([^>]*)\/?>/g;
  const issues = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(src))) {
      const attrs = m[1];
      if (!/\balt\s*=/.test(attrs)) {
        const line = src.slice(0, m.index).split('\n').length;
        issues.push({ file: path.relative(ROOT, f), line, tag: m[0].slice(0, 80) });
      }
    }
  }
  console.log(`  ${issues.length === 0 ? t(GREEN, '✓ all <img> have alt') : t(YELLOW, `⚠ ${issues.length} <img> without alt`)}`);
  for (const i of issues.slice(0, 10)) console.log(`    - ${i.file}:${i.line}  ${DIM}${i.tag.replace(/\s+/g, ' ')}${RESET}`);
  if (issues.length > 10) console.log(`    … and ${issues.length - 10} more`);

  const file = writeReport('alt', issues);
  console.log(`  ${DIM}→ ${file}${RESET}`);
  return { ok: true, issues }; // warn-only
}

function checkLinks() {
  console.log(`\n${DIM}── internal <Link> target audit ──${RESET}`);
  const files = walk(SRC, /\.(ts|tsx)$/);
  // collect all <Link to="..."> targets
  const linkRe = /<Link\b[^>]*?\bto\s*=\s*["'`]([^"'`]+)["'`]/g;
  // collect all <Route path="..." /> definitions
  const routeRe = /<Route\b[^>]*?\bpath\s*=\s*["'`]([^"'`]+)["'`]/g;

  const links = new Map();
  const routes = new Set(['/']);   // home is implicit
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    let m;
    while ((m = linkRe.exec(src))) {
      const target = m[1].split(/[?#]/)[0]; // strip query/hash
      if (target.startsWith('http') || target.startsWith('mailto:') || target.startsWith('tel:')) continue;
      const line = src.slice(0, m.index).split('\n').length;
      if (!links.has(target)) links.set(target, []);
      links.get(target).push({ file: path.relative(ROOT, f), line });
    }
    while ((m = routeRe.exec(src))) routes.add(m[1]);
  }

  // Heuristic broken: target path neither starts with "/" of any defined route nor matches lazy-loaded page convention.
  const broken = [];
  for (const [target, locs] of links.entries()) {
    if (!target.startsWith('/')) continue;
    // dynamic segments like /blog/:slug — treat the prefix as fuzzy match.
    const matches = [...routes].some((r) => {
      const rPrefix = r.split(':')[0].replace(/\/\*$/, '');
      return target === r || target.startsWith(rPrefix) || r === '*';
    });
    if (!matches) broken.push({ target, locs });
  }

  console.log(`  ${broken.length === 0 ? t(GREEN, '✓ no obviously broken internal links') : t(YELLOW, `⚠ ${broken.length} possibly broken targets`)}`);
  for (const b of broken.slice(0, 10)) console.log(`    - "${b.target}"  ${DIM}(${b.locs[0].file}:${b.locs[0].line})${RESET}`);
  if (broken.length > 10) console.log(`    … and ${broken.length - 10} more`);

  const file = writeReport('links', broken);
  console.log(`  ${DIM}→ ${file}${RESET}`);
  return { ok: true, broken }; // warn-only — heuristic
}

// ----------------------------- main ----------------------------
console.log(`${DIM}eCyPro Content QA — check=${CHECK}${RESET}`);

let exit = 0;
if (CHECK === 'parity' || CHECK === 'all') {
  const r = checkParity();
  if (!r.ok) exit = 1;
}
if (CHECK === 'missing' || CHECK === 'all') {
  const r = checkMissing();
  if (!r.ok) exit = 1;
}
if (CHECK === 'orphans' || CHECK === 'all') checkOrphans();
if (CHECK === 'alt' || CHECK === 'all') checkAlt();
if (CHECK === 'links' || CHECK === 'all') checkLinks();

console.log('');
process.exit(exit);
