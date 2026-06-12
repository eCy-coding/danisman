/**
 * SVC P8 — Services i18n/SEO parity gate.
 *
 * 1. tr/en services.json deep key parity (both directions).
 * 2. Taxonomy registry bilingual completeness (labels/chips/descriptions + menu).
 * 3. NotFoundSearch service suggestions ⊆ canonical slug set (no dead 404 links).
 * 4. Sitemap source = registry (the hardcoded-list regression guard).
 *
 * Exit 0 = parity OK; exit 1 with a finding list otherwise.
 * Run: npx tsx scripts/services-i18n-parity.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SERVICE_DEPARTMENTS,
  SERVICES_MEGA_MENU,
  CANONICAL_SERVICE_SLUGS,
} from '../src/data/service-taxonomy';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];

// ── 1. Locale JSON key parity ────────────────────────────────────────────────
const collect = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? collect(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

const tr = JSON.parse(fs.readFileSync(path.join(repo, 'public/locales/tr/services.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(repo, 'public/locales/en/services.json'), 'utf8'));
const trKeys = new Set(collect(tr));
const enKeys = new Set(collect(en));
for (const k of trKeys) if (!enKeys.has(k)) findings.push(`EN missing key: services.${k}`);
for (const k of enKeys) if (!trKeys.has(k)) findings.push(`TR missing key: services.${k}`);

// ── 2. Registry bilingual completeness ──────────────────────────────────────
for (const d of SERVICE_DEPARTMENTS) {
  for (const f of ['label', 'chip', 'description']) {
    if (!d[f]?.tr?.trim()) findings.push(`dept ${d.id}.${f}.tr empty`);
    if (!d[f]?.en?.trim()) findings.push(`dept ${d.id}.${f}.en empty`);
  }
}
for (const sec of SERVICES_MEGA_MENU.sections) {
  if (!sec.title.tr || !sec.title.en) findings.push(`menu section ${sec.id} title incomplete`);
  for (const item of sec.items) {
    if (!item.label.tr || !item.label.en) findings.push(`menu item ${item.id} label incomplete`);
    if (!item.description.tr || !item.description.en)
      findings.push(`menu item ${item.id} description incomplete`);
  }
}

// ── 3. NotFoundSearch suggestions must resolve ───────────────────────────────
const nfs = fs.readFileSync(
  path.join(repo, 'src/components/common/NotFoundSearch.tsx'),
  'utf8',
);
const canonical = new Set(CANONICAL_SERVICE_SLUGS);
for (const m of nfs.matchAll(/['"`]\/services\/([a-z0-9-]+)['"`]/g)) {
  if (!canonical.has(m[1])) findings.push(`NotFoundSearch dead suggestion: /services/${m[1]}`);
}

// ── 4. Sitemap derives from the registry ────────────────────────────────────
const sitemapSrc = fs.readFileSync(path.join(repo, 'scripts/generate-sitemap.ts'), 'utf8');
if (!sitemapSrc.includes('CANONICAL_SERVICE_SLUGS')) {
  findings.push('generate-sitemap.ts no longer derives serviceSlugs from the registry');
}

// ── verdict ──────────────────────────────────────────────────────────────────
if (findings.length) {
  console.error(`PARITY FAIL — ${findings.length} finding(s):`);
  for (const f of findings) console.error(' -', f);
  process.exit(1);
}
console.log(
  `PARITY OK — services.json tr↔en ${trKeys.size} keys · 7 departments bilingual · menu 9 items bilingual · 404 suggestions canonical · sitemap registry-derived (${CANONICAL_SERVICE_SLUGS.length} slugs)`,
);
