/**
 * Insights mega-menu data — computed from the real content index so category
 * and format counts are always live (istek.md v2 §PHASE 2). Build-time static
 * imports only; zero-result entries are dropped (never render dead facets).
 */
import blogPosts from '@/data/blog-posts.json';
import { CATEGORIES, FORMATS } from '@/data/taxonomy';
import { CASE_STUDIES } from '@/data/mockCaseStudies';

interface IndexedPost {
  slug: string;
  title: string;
  coverImage?: string;
  category: string;
  categorySlug: string;
  format: string;
  featured: boolean;
  date: string;
}

const posts = blogPosts as unknown as IndexedPost[];

export interface MenuCategory {
  slug: string;
  label: { tr: string; en: string };
  count: number;
  href: string;
}

export interface MenuFormat {
  slug: string;
  label: { tr: string; en: string };
  count: number;
  href: string;
}

export interface MenuPick {
  slug: string;
  title: string;
  coverImage?: string;
  href: string;
}

const categoryCounts = new Map<string, number>();
for (const p of posts) {
  categoryCounts.set(p.categorySlug, (categoryCounts.get(p.categorySlug) ?? 0) + 1);
}
for (const cs of CASE_STUDIES) {
  if (cs.categorySlug) {
    categoryCounts.set(cs.categorySlug, (categoryCounts.get(cs.categorySlug) ?? 0) + 1);
  }
}

/** Top 8 categories by live count — zero-count categories never render. */
export const MENU_CATEGORIES: MenuCategory[] = CATEGORIES.map((c) => ({
  slug: c.slug,
  label: { tr: c.label, en: c.labelEn },
  count: categoryCounts.get(c.slug) ?? 0,
  href: `/perspektifler/kategori/${c.slug}`,
}))
  .filter((c) => c.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 8);

const formatCounts = new Map<string, number>();
for (const p of posts) {
  formatCounts.set(p.format, (formatCounts.get(p.format) ?? 0) + 1);
}
formatCounts.set('vaka-analizi', (formatCounts.get('vaka-analizi') ?? 0) + CASE_STUDIES.length);

export const MENU_FORMATS: MenuFormat[] = FORMATS.map((f) => ({
  slug: f.slug,
  label: { tr: f.label === 'Makale' ? 'Makaleler' : f.label, en: f.labelEn },
  count: formatCounts.get(f.slug) ?? 0,
  href: `/perspektifler?format=${f.slug}`,
})).filter((f) => f.count > 0);

/** 3 editor picks: featured posts first, newest as fallback. */
export const MENU_PICKS: MenuPick[] = [...posts]
  .sort((a, b) => Number(b.featured) - Number(a.featured) || b.date.localeCompare(a.date))
  .slice(0, 3)
  .map((p) => ({
    slug: p.slug,
    title: p.title,
    coverImage: p.coverImage,
    href: `/perspektifler/${p.slug}`,
  }));

export const MENU_HUB_HREF = '/perspektifler';
export const MENU_TOPICS_HREF = '/perspektifler/konular';

/** Newest publish date — drives the dismissible "Yeni" nav badge (D-6:
 *  SocialProofToast is replaced by this badge on insights surfaces). */
export const NEWEST_POST_DATE: string = [...posts].sort((a, b) => b.date.localeCompare(a.date))[0]!
  .date;
