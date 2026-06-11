/**
 * GATE-1 verifier — taxonomy invariants (istek.md v2 §PHASE 1).
 * Hard failures exit 1; soft issues print as WARN.
 * Run: npx tsx scripts/check-taxonomy.ts
 */
import fs from 'fs';
import path from 'path';
import {
  CATEGORIES,
  CATEGORY_BY_LABEL,
  CATEGORY_MERGE_MAP,
  TAG_VOCABULARY,
  TAG_BY_SLUG,
  TAG_MERGE_MAP,
  CASE_STUDY_CATEGORY_MAP,
  MAX_TAGS_PER_POST,
  MAX_FEATURED,
} from '../src/data/taxonomy';
import { slugifyTr } from '../src/lib/slugify';
import { CASE_STUDIES } from '../src/data/mockCaseStudies';

const fails: string[] = [];
const warns: string[] = [];

// 1. Vocabulary size
if (TAG_VOCABULARY.length > 60) {
  fails.push(`vocabulary has ${TAG_VOCABULARY.length} terms > 60`);
}

// 2. Zero duplicate normalized slugs (tags + categories share one namespace)
const allSlugs = [...TAG_VOCABULARY.map((t) => t.slug), ...CATEGORIES.map((c) => c.slug)];
const seen = new Map<string, string>();
for (const s of allSlugs) {
  const norm = slugifyTr(s);
  if (norm !== s) fails.push(`slug "${s}" is not in canonical form (→ "${norm}")`);
  const prev = seen.get(norm);
  if (prev) fails.push(`duplicate normalized slug: "${s}" collides with "${prev}"`);
  seen.set(norm, s);
}

// 3. Merge-map targets must exist
for (const [raw, target] of Object.entries(TAG_MERGE_MAP)) {
  if (target !== null && !TAG_BY_SLUG[target]) {
    fails.push(`TAG_MERGE_MAP["${raw}"] → "${target}" not in vocabulary`);
  }
}
for (const [raw, target] of Object.entries(CATEGORY_MERGE_MAP)) {
  if (!CATEGORY_BY_LABEL[target]) {
    fails.push(`CATEGORY_MERGE_MAP["${raw}"] → "${target}" not a canonical category`);
  }
}

// 4. Generated index conformance
const indexPath = path.join(process.cwd(), 'src/data/blog-posts.json');
const posts: {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  tags: string[];
  featured: boolean;
  lang: string;
  format: string;
}[] = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

let featured = 0;
for (const p of posts) {
  if (!CATEGORY_BY_LABEL[p.category])
    fails.push(`${p.slug}: category "${p.category}" not canonical`);
  if (!CATEGORIES.some((c) => c.slug === p.categorySlug)) {
    fails.push(`${p.slug}: categorySlug "${p.categorySlug}" unknown`);
  }
  for (const t of p.tags) {
    if (!TAG_BY_SLUG[t]) fails.push(`${p.slug}: tag "${t}" not in vocabulary`);
  }
  if (p.tags.length > MAX_TAGS_PER_POST)
    fails.push(`${p.slug}: ${p.tags.length} tags > ${MAX_TAGS_PER_POST}`);
  if (p.featured) featured++;
  if (!['tr', 'en'].includes(p.lang)) fails.push(`${p.slug}: lang "${p.lang}"`);
  if (!['makale', 'vaka-analizi', 'rapor', 'founder-letter'].includes(p.format)) {
    fails.push(`${p.slug}: format "${p.format}"`);
  }
  if (p.title.length > 60) warns.push(`${p.slug}: title ${p.title.length}ch > 60`);
  if (p.excerpt.length < 140 || p.excerpt.length > 160) {
    warns.push(`${p.slug}: excerpt ${p.excerpt.length}ch outside 140–160`);
  }
}
if (featured > MAX_FEATURED) fails.push(`featured=${featured} > ${MAX_FEATURED}`);

// 5. Case studies share the taxonomy (BUG-11)
for (const cs of CASE_STUDIES) {
  const mapped = CASE_STUDY_CATEGORY_MAP[cs.industry];
  if (!mapped) fails.push(`case-study ${cs.slug}: industry "${cs.industry}" unmapped`);
  if (cs.categorySlug && cs.categorySlug !== mapped) {
    fails.push(`case-study ${cs.slug}: categorySlug "${cs.categorySlug}" ≠ map "${mapped}"`);
  }
  if (!cs.categorySlug) fails.push(`case-study ${cs.slug}: missing categorySlug`);
}

// 6. Search index exists and aligns
const searchPath = path.join(process.cwd(), 'src/data/search-index.json');
const search = JSON.parse(fs.readFileSync(searchPath, 'utf-8')) as unknown[];
if (search.length !== posts.length) {
  fails.push(`search-index has ${search.length} docs ≠ ${posts.length} posts`);
}

const tagUse = new Map<string, number>();
for (const p of posts) for (const t of p.tags) tagUse.set(t, (tagUse.get(t) ?? 0) + 1);
const unused = TAG_VOCABULARY.filter((t) => !tagUse.has(t.slug)).map((t) => t.slug);
if (unused.length)
  warns.push(`unused vocabulary terms (ok, future headroom): ${unused.join(', ')}`);

for (const w of warns) console.log(`WARN ${w}`);
if (fails.length) {
  console.error(`\n❌ GATE-1 FAIL (${fails.length}):`);
  for (const f of fails) console.error(`   - ${f}`);
  process.exit(1);
}
console.log(
  `\n✅ GATE-1 PASS · posts=${posts.length} · categories=${CATEGORIES.length} · vocab=${TAG_VOCABULARY.length}/60 · dup-slugs=0 · featured=${featured}/${MAX_FEATURED} · case-studies=${CASE_STUDIES.length} unified · warns=${warns.length}`,
);
