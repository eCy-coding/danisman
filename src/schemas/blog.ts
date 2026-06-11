import { z } from 'zod';
// BLOG_CATEGORIES import removed in P45 — taxonomy still curated via BlogList
// filter chips but the Zod schema accepts any category string from data files.

export const BlogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string(),
  date: z.string().datetime(),
  author: z.string(),
  coverImage: z.string().min(1),
  content: z.string().optional(),
  // P45: was z.enum(BLOG_CATEGORIES). 21/34 posts had categories outside the
  // enum (Analitik, Pazarlama, Finans, Yapay Zeka, Dijital Dönüşüm...) so Zod
  // rejected the whole list, getBlogPosts() returned [], and /blog rendered
  // "Bu filtreyle eşleşen yazı bulunamadı". Switched to free-form string —
  // BlogList filter chips still draw from BLOG_CATEGORIES so the curated
  // taxonomy is preserved.
  category: z.string().optional(),
  /** Perspektifler taxonomy (GATE-1): canonical category slug for URLs. */
  categorySlug: z.string().optional(),
  tags: z.array(z.string()),
  serviceCategories: z.array(z.string()).optional(),
  readingTime: z.string(),
  readTimeMin: z.number().int().positive().optional(),
  wordCount: z.number().int().nonnegative().optional(),
  lang: z.enum(['tr', 'en']).optional(),
  format: z.enum(['makale', 'vaka-analizi', 'rapor', 'founder-letter']).optional(),
  pairId: z.string().optional(),
  seriesId: z.string().optional(),
  updated: z.string().optional(),
  featured: z.boolean().optional(),
  // Sprint 4 — NotebookLM Audio Overview embed (markdown frontmatter pattern,
  // vault konsensüsü: BE schema dondurulduğu için content layer'ında tutulur).
  // When `audioUrl` is set, the blog post page renders <AudioOverview /> between
  // header and MDX body. Duration + description are optional UX/SEO hints.
  audioUrl: z.string().url().optional(),
  audioDurationSec: z.number().int().positive().optional(),
  audioDescription: z.string().max(400).optional(),
});

export type BlogPost = z.infer<typeof BlogPostSchema>;

export const BlogPostListSchema = z.array(BlogPostSchema);
