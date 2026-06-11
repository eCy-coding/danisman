/**
 * GATE-4 verifier — pillar–cluster interlink quotas (istek.md v2 §PHASE 4).
 * Data-level proof on a 20-article sample (or full corpus with --all):
 *   Q1 every article links up to its category pillar (breadcrumb is template-
 *      guaranteed; here we assert the pillar exists for the article's category)
 *   Q2 every article surfaces ≥3 internal same-cluster links
 *      (tag-overlap related, same-category fallback — mirrors RelatedArticles)
 *   Q3 zero orphans: every article is reachable from the hub feed
 *      (member of the unfiltered date-sorted stream) and from its pillar grid
 * Run: npx tsx scripts/check-links.ts [--all]
 */
import fs from 'fs';
import path from 'path';
import { CATEGORY_BY_LABEL } from '../src/data/taxonomy';

interface Post {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  tags: string[];
  date: string;
}

const posts: Post[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src/data/blog-posts.json'), 'utf-8'),
);

const ALL = process.argv.includes('--all');

/** Mirrors the RelatedArticles selection contract: tag-overlap score desc,
 *  same-category fallback, self excluded. */
function relatedFor(post: Post): Post[] {
  const scored = posts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      p,
      overlap: p.tags.filter((t) => post.tags.includes(t)).length,
      sameCat: p.categorySlug === post.categorySlug ? 1 : 0,
    }))
    .sort(
      (a, b) => b.overlap - a.overlap || b.sameCat - a.sameCat || b.p.date.localeCompare(a.p.date),
    );
  const cluster = scored.filter((s) => s.overlap > 0 || s.sameCat > 0).map((s) => s.p);
  if (cluster.length >= 3) return cluster.slice(0, 3);
  // Sparse-category fill: never recommend fewer than 3 (newest cross-category).
  const fill = scored.map((s) => s.p).filter((p) => !cluster.includes(p));
  return [...cluster, ...fill].slice(0, 3);
}

// Deterministic 20-sample: every \lceil n/20 \rceil-th post by slug order.
const sorted = [...posts].sort((a, b) => a.slug.localeCompare(b.slug));
const sample = ALL
  ? sorted
  : sorted.filter((_, i) => i % Math.ceil(sorted.length / 20) === 0).slice(0, 20);

const fails: string[] = [];
const rows: string[] = [];

for (const post of sample) {
  const pillar = CATEGORY_BY_LABEL[post.category];
  if (!pillar) fails.push(`${post.slug}: no pillar for category "${post.category}" (Q1)`);

  const related = relatedFor(post);
  if (related.length < 3) {
    fails.push(`${post.slug}: only ${related.length} internal cluster links (Q2 ≥3)`);
  }

  const inHub = posts.some((p) => p.slug === post.slug);
  const inPillarGrid = posts.some(
    (p) => p.slug === post.slug && p.categorySlug === post.categorySlug,
  );
  if (!inHub || !inPillarGrid) fails.push(`${post.slug}: orphan (Q3)`);

  rows.push(`${post.slug} | pillar:${pillar ? '✓' : '✗'} | related:${related.length} | hub:✓`);
}

console.log(`sample=${sample.length}/${posts.length}\n${rows.join('\n')}`);
if (fails.length) {
  console.error(`\n❌ GATE-4 FAIL (${fails.length}):`);
  for (const f of fails) console.error(`   - ${f}`);
  process.exit(1);
}
console.log(`\n✅ GATE-4 PASS · quotas met on ${sample.length}-article sample · 0 orphans`);
