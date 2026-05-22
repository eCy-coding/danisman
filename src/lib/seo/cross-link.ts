/**
 * P51.2 — Internal cross-link auto-gen utility.
 *
 * Pillar/cluster strategy: blog post → 3 related post + 2 related service.
 * Service detail → 3 related service (zaten P47'de var) + 2 related blog.
 *
 * Scoring: shared tags + shared category + serviceCategories overlap.
 * Deterministic — same input → same output (SEO stability).
 */

import type { BlogPost } from '../../schemas/blog';
import { SERVICES } from '../../data/services';

interface ScoredItem<T> {
  item: T;
  score: number;
}

/** Find top N most-related blog posts to a source post. */
export function findRelatedBlogPosts(
  source: BlogPost,
  candidates: BlogPost[],
  limit = 3,
): BlogPost[] {
  const sourceTags = new Set((source.tags ?? []).map((t) => t.toLowerCase()));
  const sourceCats = new Set((source.serviceCategories ?? []).map((c) => c.toLowerCase()));
  const sourceCategory = source.category?.toLowerCase();

  const scored: ScoredItem<BlogPost>[] = candidates
    .filter((p) => p.slug !== source.slug)
    .map((p) => {
      let score = 0;
      for (const tag of p.tags ?? []) {
        if (sourceTags.has(tag.toLowerCase())) score += 2;
      }
      for (const cat of p.serviceCategories ?? []) {
        if (sourceCats.has(cat.toLowerCase())) score += 3;
      }
      if (p.category?.toLowerCase() === sourceCategory) score += 1;
      return { item: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.item);
}

/** Find related SERVICES based on blog post tags/categories. */
export function findRelatedServices(
  source: BlogPost,
  limit = 2,
): { slug: string; title: string; description: string; category: string }[] {
  const sourceCats = new Set((source.serviceCategories ?? []).map((c) => c.toLowerCase()));
  const sourceTags = new Set((source.tags ?? []).map((t) => t.toLowerCase()));

  const scored = SERVICES.map((svc) => {
    let score = 0;
    if (sourceCats.has(svc.category.toLowerCase())) score += 3;
    // Tag matching (fuzzy)
    const svcTitle = svc.title.toLowerCase();
    for (const tag of sourceTags) {
      if (svcTitle.includes(tag) || tag.includes(svc.category.toLowerCase())) score += 1;
    }
    return { item: svc, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => ({
    slug: s.item.id,
    title: s.item.title,
    description: s.item.description,
    category: s.item.category,
  }));
}

/** Reverse: from service slug → find related blog posts (P47 ServiceDetailLayout). */
export function findBlogPostsForService(
  serviceCategory: string,
  candidates: BlogPost[],
  limit = 2,
): BlogPost[] {
  const cat = serviceCategory.toLowerCase();
  return candidates
    .filter((p) => {
      const cats = (p.serviceCategories ?? []).map((c) => c.toLowerCase());
      return cats.includes(cat);
    })
    .slice(0, limit);
}
