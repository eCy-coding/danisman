/**
 * Perspektifler hub — pure state/filter layer (istek.md v2 §PHASE 3).
 * ALL hub state lives in the URL (shareable, refresh-safe). This module is
 * framework-free so the round-trip invariants are unit-testable.
 */
import blogPostsJson from '@/data/blog-posts.json';
import { CATEGORIES, CATEGORY_BY_SLUG, TAG_BY_SLUG, FORMATS } from '@/data/taxonomy';
import { CATEGORY_MERGE_MAP, TAG_MERGE_MAP } from '@/data/taxonomy';
import { CASE_STUDIES } from '@/data/mockCaseStudies';
import { foldForSearch } from '@/lib/slugify';

export interface FeedItem {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  coverImage?: string;
  category: string;
  categorySlug: string;
  tags: string[];
  readingTime: string;
  readTimeMin: number;
  lang: string;
  format: string;
  featured: boolean;
  /** Hub-relative article URL. */
  href: string;
}

export interface HubFilter {
  kategori?: string;
  format?: string;
  konu?: string;
  yil?: string;
  sirala: 'yeni' | 'eski' | 'az';
  q?: string;
  page: number;
}

export const PAGE_SIZE = 12;
export const DOM_CARD_CAP = 48;

const posts: FeedItem[] = (blogPostsJson as Omit<FeedItem, 'href'>[]).map((p) => ({
  ...p,
  href: `/perspektifler/${p.slug}`,
}));

/** Case studies join the feed as `vaka-analizi` format items (BUG-11). */
const caseStudyItems: FeedItem[] = CASE_STUDIES.map((cs) => ({
  slug: cs.slug,
  title: cs.title,
  excerpt: cs.challenge ?? cs.result,
  date: `${cs.goLive ?? '2025'}-01-01T00:00:00.000Z`,
  author: cs.client,
  coverImage: cs.image,
  category: CATEGORY_BY_SLUG[cs.categorySlug ?? '']?.label ?? 'Strateji',
  categorySlug: cs.categorySlug ?? 'strateji',
  tags: [],
  readingTime: '5 dk okuma',
  readTimeMin: 5,
  lang: 'tr',
  format: 'vaka-analizi',
  featured: false,
  href: `/case-studies/${cs.slug}`,
}));

export const ALL_ITEMS: FeedItem[] = [...posts, ...caseStudyItems];

/** Curated hero layer: featured posts (max 4), newest first. */
export function getFeatured(): { lead: FeedItem | null; secondary: FeedItem[] } {
  const featured = posts
    .filter((p) => p.featured)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  return { lead: featured[0] ?? null, secondary: featured.slice(1) };
}

/** Legacy param migration: ?cat=<TR label> / ?tag=<raw tag> from the old /blog. */
export function parseHubFilter(params: URLSearchParams): HubFilter {
  let kategori = params.get('kategori') ?? undefined;
  const legacyCat = params.get('cat');
  if (!kategori && legacyCat) {
    const label = CATEGORY_MERGE_MAP[legacyCat] ?? legacyCat;
    kategori = Object.values(CATEGORY_BY_SLUG).find((c) => c.label === label)?.slug;
  }
  let konu = params.get('konu') ?? undefined;
  const legacyTag = params.get('tag');
  if (!konu && legacyTag) {
    konu = TAG_BY_SLUG[legacyTag]
      ? legacyTag
      : (TAG_MERGE_MAP[legacyTag] ?? undefined) || undefined;
  }
  const sirala = params.get('sirala');
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  return {
    kategori: kategori && CATEGORY_BY_SLUG[kategori] ? kategori : undefined,
    format: params.get('format') ?? undefined,
    konu: konu && TAG_BY_SLUG[konu] ? konu : undefined,
    yil: params.get('yil') ?? undefined,
    sirala: sirala === 'eski' || sirala === 'az' ? sirala : 'yeni',
    q: params.get('q')?.trim() || undefined,
    page,
  };
}

export function serializeHubFilter(f: HubFilter): URLSearchParams {
  const p = new URLSearchParams();
  if (f.kategori) p.set('kategori', f.kategori);
  if (f.format) p.set('format', f.format);
  if (f.konu) p.set('konu', f.konu);
  if (f.yil) p.set('yil', f.yil);
  if (f.sirala !== 'yeni') p.set('sirala', f.sirala);
  if (f.q) p.set('q', f.q);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
}

function matchesExceptPage(item: FeedItem, f: HubFilter): boolean {
  if (f.kategori && item.categorySlug !== f.kategori) return false;
  if (f.format && item.format !== f.format) return false;
  if (f.konu && !item.tags.includes(f.konu)) return false;
  if (f.yil && !item.date.startsWith(f.yil)) return false;
  if (f.q) {
    const hay = foldForSearch(
      `${item.title} ${item.excerpt} ${item.category} ${item.tags
        .map((t) => TAG_BY_SLUG[t]?.labelTr ?? t)
        .join(' ')}`,
    );
    for (const token of foldForSearch(f.q).split(/\s+/).filter(Boolean)) {
      if (!hay.includes(token)) return false;
    }
  }
  return true;
}

export function filterItems(f: HubFilter, items: FeedItem[] = ALL_ITEMS): FeedItem[] {
  const out = items.filter((i) => matchesExceptPage(i, f));
  if (f.sirala === 'eski') out.sort((a, b) => a.date.localeCompare(b.date));
  else if (f.sirala === 'az') out.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  else out.sort((a, b) => b.date.localeCompare(a.date));
  return out;
}

/** Visible window: cumulative pages capped at DOM_CARD_CAP (footer must stay reachable). */
export function visibleWindow(results: FeedItem[], page: number): FeedItem[] {
  const upto = Math.min(results.length, page * PAGE_SIZE);
  const start = Math.max(0, upto - DOM_CARD_CAP);
  return results.slice(start, upto);
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

/** Counts respect every OTHER active facet; zero-count options are dropped. */
export function facetOptions(f: HubFilter): {
  kategoriler: FacetOption[];
  formatlar: FacetOption[];
  yillar: FacetOption[];
} {
  const without = (key: keyof HubFilter): HubFilter => ({ ...f, [key]: undefined, page: 1 });

  const catBase = filterItems(without('kategori'));
  const kategoriler = CATEGORIES.map((c) => ({
    value: c.slug,
    label: c.label,
    count: catBase.filter((i) => i.categorySlug === c.slug).length,
  })).filter((o) => o.count > 0);

  const fmtBase = filterItems(without('format'));
  const formatlar = FORMATS.map((fm) => ({
    value: fm.slug,
    label: fm.label,
    count: fmtBase.filter((i) => i.format === fm.slug).length,
  })).filter((o) => o.count > 0);

  const yilBase = filterItems(without('yil'));
  const yearSet = new Map<string, number>();
  for (const i of yilBase) {
    const y = i.date.slice(0, 4);
    yearSet.set(y, (yearSet.get(y) ?? 0) + 1);
  }
  const yillar = [...yearSet.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([y, count]) => ({ value: y, label: y, count }));

  return { kategoriler, formatlar, yillar };
}

/** Top-N most used topics across the current category context (chips ≤12). */
export function topTopics(f: HubFilter, limit = 12): FacetOption[] {
  const base = filterItems({ ...f, konu: undefined, page: 1 });
  const use = new Map<string, number>();
  for (const i of base) for (const t of i.tags) use.set(t, (use.get(t) ?? 0) + 1);
  return [...use.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([slug, count]) => ({
      value: slug,
      label: TAG_BY_SLUG[slug]?.labelTr ?? slug,
      count,
    }))
    .filter((o) => o.count > 0);
}

/** Tag-overlap related articles (mirrors scripts/check-links.ts contract):
 *  overlap desc → same-category → newest-any fill, always 3 when corpus allows. */
export function relatedItems(slug: string, limit = 3): FeedItem[] {
  const source = posts.find((p) => p.slug === slug);
  if (!source) return [];
  const scored = posts
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      p,
      overlap: p.tags.filter((t) => source.tags.includes(t)).length,
      sameCat: p.categorySlug === source.categorySlug ? 1 : 0,
    }))
    .sort(
      (a, b) => b.overlap - a.overlap || b.sameCat - a.sameCat || b.p.date.localeCompare(a.p.date),
    );
  const cluster = scored.filter((s) => s.overlap > 0 || s.sameCat > 0).map((s) => s.p);
  if (cluster.length >= limit) return cluster.slice(0, limit);
  const fill = scored.map((s) => s.p).filter((p) => !cluster.includes(p));
  return [...cluster, ...fill].slice(0, limit);
}

/** Series siblings sorted by date (prev/next nav when series_id is set). */
export function seriesSiblings(seriesId: string): FeedItem[] {
  return posts
    .filter((p) => (p as FeedItem & { seriesId?: string }).seriesId === seriesId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** GATE-5 ranked search: title hits ×3, tag hits ×2, excerpt/category ×1. */
export function searchPerspektifler(q: string): FeedItem[] {
  const tokens = foldForSearch(q).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const scored: { item: FeedItem; score: number }[] = [];
  for (const item of ALL_ITEMS) {
    const title = foldForSearch(item.title);
    const tags = foldForSearch(item.tags.map((t) => TAG_BY_SLUG[t]?.labelTr ?? t).join(' '));
    const body = foldForSearch(`${item.excerpt} ${item.category}`);
    let score = 0;
    let miss = false;
    for (const tok of tokens) {
      const inTitle = title.includes(tok);
      const inTags = tags.includes(tok);
      const inBody = body.includes(tok);
      if (!inTitle && !inTags && !inBody) {
        miss = true;
        break;
      }
      score += (inTitle ? 3 : 0) + (inTags ? 2 : 0) + (inBody ? 1 : 0);
    }
    if (!miss) scored.push({ item, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || b.item.date.localeCompare(a.item.date))
    .map((s) => s.item);
}
