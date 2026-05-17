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
  tags: z.array(z.string()),
  serviceCategories: z.array(z.string()).optional(),
  readingTime: z.string(),
  featured: z.boolean().optional(),
});

export type BlogPost = z.infer<typeof BlogPostSchema>;

export const BlogPostListSchema = z.array(BlogPostSchema);
