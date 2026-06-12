/**
 * Services taxonomy integrity audit (P1 gate — istemek.md §5).
 * Imports the REAL data modules (no hand-counting) and emits
 * docs/reports/services-taxonomy-audit.json.
 *
 * Run: npx tsx scripts/services-taxonomy-audit.mjs
 * Exit 1 only on structural failure (unreadable modules); findings never fail
 * the run — they are the audit output.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SERVICES, DEPARTMENTS } from '../src/data/services';
import { SERVICE_CONTENT } from '../src/data/service-content';
import { MEGA_MENUS } from '../src/data/copy/common';
import { LOCALIZED_SLUG_PAIRS } from '../src/i18n/localized-slugs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, '..');

const slugOf = (link) => (link || '').split('/').filter(Boolean).pop() || '';

// --- 1. Source sets ---
const contentSlugs = Object.keys(SERVICE_CONTENT).sort();

const catalog = SERVICES.map((s) => ({
  id: s.id,
  category: s.category,
  link: s.link,
  slug: slugOf(s.link),
}));
const catalogSlugs = [...new Set(catalog.map((c) => c.slug))].sort();

const menuItems = MEGA_MENUS.services.sections.flatMap((sec) =>
  sec.items.map((i) => ({ section: sec.id, id: i.id, href: i.href })),
);
const menuDetailSlugs = [
  ...new Set(
    menuItems
      .filter((i) => i.href.startsWith('/services/'))
      .map((i) => slugOf(i.href)),
  ),
].sort();
const hrefCounts = menuItems.reduce((acc, i) => {
  acc[i.href] = (acc[i.href] || 0) + 1;
  return acc;
}, {});
const menuDuplicateHrefs = Object.entries(hrefCounts)
  .filter(([, n]) => n > 1)
  .map(([href, n]) => ({ href, count: n }));

// Sitemap slugs: generate-sitemap.ts is a side-effecting script — extract its
// hardcoded serviceSlugs literal from source instead of importing it.
const sitemapSrc = fs.readFileSync(
  path.join(repo, 'scripts/generate-sitemap.ts'),
  'utf8',
);
const sitemapMatch = sitemapSrc.match(
  /const serviceSlugs = \[([\s\S]*?)\];/,
);
const sitemapSlugs = sitemapMatch
  ? [...sitemapMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort()
  : [];

// --- 2. Set algebra ---
const setMinus = (a, ...rest) =>
  a.filter((x) => rest.every((r) => !r.includes(x)));

// Resolver policy TODAY (ServiceDetailPage.tsx:27-28): slug must match a
// SERVICES catalog link, else hard /404. Resolvable = catalogSlugs.
const resolvableSlugs = catalogSlugs;

const orphans = setMinus(contentSlugs, catalogSlugs, menuDetailSlugs);
const dangling = setMinus(
  [...new Set([...catalogSlugs, ...menuDetailSlugs])],
  contentSlugs,
);
const sitemap404 = setMinus(sitemapSlugs, resolvableSlugs);
const menuDead = setMinus(menuDetailSlugs, resolvableSlugs);
const contentDead = setMinus(contentSlugs, resolvableSlugs);

// --- 3. Per-slug coverage matrix ---
const universe = [
  ...new Set([
    ...contentSlugs,
    ...catalogSlugs,
    ...menuDetailSlugs,
    ...sitemapSlugs,
  ]),
].sort();
const matrix = universe.map((slug) => ({
  slug,
  content: contentSlugs.includes(slug),
  catalog: catalogSlugs.includes(slug),
  menu: menuDetailSlugs.includes(slug),
  sitemap: sitemapSlugs.includes(slug),
  resolvable_today: resolvableSlugs.includes(slug),
}));

// --- 4. Known-bug confirmation with line numbers ---
const findLines = (file, needle) => {
  const lines = fs.readFileSync(path.join(repo, file), 'utf8').split('\n');
  return lines
    .map((l, i) => (l.includes(needle) ? i + 1 : null))
    .filter(Boolean);
};
const knownBugs = [
  {
    id: 'typo-degerlemeokul',
    file: 'src/data/services.ts',
    lines: findLines('src/data/services.ts', 'DEĞERLEMEokul'),
    note: 'comment typo "DEĞERLEMEokul"',
  },
  {
    id: 'ma-valuation-shared-link',
    file: 'src/data/services.ts',
    lines: findLines('src/data/services.ts', "'/services/mergers-acquisitions'"),
    note: 'ma-valuation has no own slug; shares mergers-acquisitions link',
  },
  {
    id: 'glassmorphism-comment',
    file: 'src/pages/ServicesPage.tsx',
    lines: findLines('src/pages/ServicesPage.tsx', 'Glassmorphism'),
    note: 'doctrine-violating comment label (visual is solid — rename)',
  },
  {
    id: 'resolver-catalog-only',
    file: 'src/pages/ServiceDetailPage.tsx',
    lines: findLines(
      'src/pages/ServiceDetailPage.tsx',
      'SERVICES.find((s) => s.link?.endsWith',
    ),
    note: 'ROOT CAUSE: catalog-only resolution → menu pillars + orphans hard-404',
  },
];

// --- 5. i18n route-level coverage ---
const i18n = {
  route_pair_services: LOCALIZED_SLUG_PAIRS.some(
    (p) => p.en === 'services' && p.tr === 'hizmetler',
  ),
  per_service_slug_pairs: LOCALIZED_SLUG_PAIRS.filter((p) =>
    contentSlugs.includes(p.en),
  ).map((p) => p.en),
  note: 'service detail slugs are EN-canonical today; /hizmetler/* redirects to /services (App.tsx:444)',
};

const report = {
  generated: '2026-06-12',
  phase: 'P1',
  resolver_policy_today:
    'ServiceDetailPage.tsx:27-28 — SERVICES catalog membership required, else /404',
  counts: {
    content: contentSlugs.length,
    catalog_entries: catalog.length,
    catalog_unique_slugs: catalogSlugs.length,
    menu_items_visible: menuItems.length,
    menu_unique_detail_slugs: menuDetailSlugs.length,
    sitemap: sitemapSlugs.length,
    orphans: orphans.length,
    dangling: dangling.length,
    sitemap_404: sitemap404.length,
    menu_dead_items: menuDead.length,
    content_dead_slugs: contentDead.length,
    departments: DEPARTMENTS.filter((d) => d.id !== 'all').length,
  },
  sets: {
    contentSlugs,
    catalogSlugs,
    menuDetailSlugs,
    sitemapSlugs,
    orphans,
    dangling,
    sitemap404,
    menuDead,
    contentDead,
  },
  menu: { items: menuItems, duplicateHrefs: menuDuplicateHrefs },
  catalog,
  matrix,
  knownBugs,
  i18n,
};

const outDir = path.join(repo, 'docs/reports');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'services-taxonomy-audit.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

console.log(`audit written: ${path.relative(repo, outPath)}`);
console.log(JSON.stringify(report.counts, null, 2));
console.log('orphans:', orphans.join(', ') || '∅');
console.log('dangling:', dangling.join(', ') || '∅');
console.log('sitemap404:', sitemap404.join(', ') || '∅');
console.log('menuDead:', menuDead.join(', ') || '∅');
console.log(
  'menu duplicate hrefs:',
  menuDuplicateHrefs.map((d) => `${d.href}×${d.count}`).join(', ') || '∅',
);
