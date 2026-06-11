/**
 * GATE-1 validator for the Perspektifler taxonomy.
 * Asserts: 0 duplicate normalized slugs, every inventory tag mapped, redirect map
 * covers 100% of retired URLs, <=60 controlled tags, all categories closed (10),
 * every CAT_MERGE + tag category resolves to one of the 10. Exit 1 on any failure.
 *
 * Run: node scripts/check-taxonomy.mjs
 */
import fs from 'fs';

const OUT = 'src/data/perspektifler';
const taxonomy = JSON.parse(fs.readFileSync(`${OUT}/taxonomy.json`, 'utf8'));
const { tag_merge } = JSON.parse(fs.readFileSync(`${OUT}/merge-map.json`, 'utf8'));
const { redirects } = JSON.parse(fs.readFileSync(`${OUT}/redirects.json`, 'utf8'));
const rawTags = JSON.parse(fs.readFileSync('/tmp/rawtags.json', 'utf8'));
const rawCats = JSON.parse(fs.readFileSync('/tmp/rawcats.json', 'utf8'));
const articleSlugs = JSON.parse(fs.readFileSync('/tmp/slugs.json', 'utf8'));

const slugify = (s) =>
  s.toLowerCase().replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/i̇/g, 'i')
    .replace(/İ/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/&/g, ' ve ').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ' — ' + m); if (!c) fail++; };

const catSlugs = new Set(taxonomy.categories.map((c) => c.slug));

// 1. exactly 10 closed categories
ok(taxonomy.categories.length === 10, `categories == 10 (got ${taxonomy.categories.length})`);

// 2. <= 60 controlled tags
ok(taxonomy.tags.length <= 60, `controlled tags <= 60 (got ${taxonomy.tags.length})`);

// 3. 0 duplicate normalized tag slugs
const tagSlugs = taxonomy.tags.map((t) => t.slug);
const normDup = {};
tagSlugs.forEach((s) => { const n = slugify(s); normDup[n] = (normDup[n] || 0) + 1; });
const dups = Object.entries(normDup).filter(([, n]) => n > 1).map(([s]) => s);
ok(dups.length === 0, `0 duplicate normalized tag slugs (dups: ${dups.join(', ') || 'none'})`);

// 3b. every tag slug already ASCII-normalized
const nonNorm = tagSlugs.filter((s) => slugify(s) !== s);
ok(nonNorm.length === 0, `all tag slugs ASCII-normalized (bad: ${nonNorm.join(', ') || 'none'})`);

// 4. every tag's category is one of the 10
const badCat = taxonomy.tags.filter((t) => !catSlugs.has(t.category)).map((t) => t.slug);
ok(badCat.length === 0, `every tag.category in 10 (bad: ${badCat.join(', ') || 'none'})`);

// 5. every inventory RAW tag is mapped (100%)
const unmapped = rawTags.filter((t) => !(t in tag_merge));
ok(unmapped.length === 0, `100% of ${rawTags.length} raw tags mapped (unmapped: ${unmapped.join(' | ') || 'none'})`);

// 6. every non-special merge target exists in vocab
const vocabSet = new Set(tagSlugs);
const badTarget = Object.entries(tag_merge)
  .filter(([, v]) => v !== '__category__' && v !== '__drop__' && !vocabSet.has(v))
  .map(([k, v]) => `${k}->${v}`);
ok(badTarget.length === 0, `every survivor target in vocab (bad: ${badTarget.join(', ') || 'none'})`);

// 7. all 21 raw categories mapped to one of 10
const unmappedCat = rawCats.filter((c) => !(c in taxonomy.category_merge));
const badCatTarget = Object.values(taxonomy.category_merge).filter((v) => !catSlugs.has(v));
ok(unmappedCat.length === 0, `100% of ${rawCats.length} raw categories mapped (unmapped: ${unmappedCat.join(' | ') || 'none'})`);
ok(badCatTarget.length === 0, `every category_merge target in 10 (bad: ${[...new Set(badCatTarget)].join(', ') || 'none'})`);

// 8. redirects: /blog->/perspektifler correct direction + every article slug + every retired tag URL
const fromSet = new Set(redirects.map((r) => r.from));
ok(redirects.some((r) => r.from === '/blog' && r.to === '/perspektifler'), `/blog -> /perspektifler (correct direction)`);
const missArticle = articleSlugs.filter((s) => !fromSet.has(`/blog/${s}`));
ok(missArticle.length === 0, `100% article 301s (/blog/:slug, missing: ${missArticle.length})`);
const missTag = rawTags.filter((t) => !fromSet.has(`/insights/tag/${slugify(t)}`));
ok(missTag.length === 0, `100% retired tag-URL 301s (missing: ${missTag.length})`);

// 9. no redirect chain > 1 hop (no 'to' is also a 'from')
const toThatIsAlsoFrom = redirects.filter((r) => fromSet.has(r.to)).map((r) => `${r.from}->${r.to}`);
ok(toThatIsAlsoFrom.length === 0, `no redirect chain >1 hop (chains: ${toThatIsAlsoFrom.slice(0,3).join(', ') || 'none'})`);

console.log('\n' + (fail === 0 ? '✅ GATE-1 PASS — all assertions green' : `❌ GATE-1 FAIL — ${fail} assertion(s)`));
process.exit(fail === 0 ? 0 : 1);
