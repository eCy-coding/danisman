import { z } from 'zod';
import { BLOG_CATEGORIES } from '../types/blog';

export const BlogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string(),
  date: z.string().datetime(),
  author: z.string(),
  coverImage: z.string().min(1),
  content: z.string().optional(),
  category: z.enum(BLOG_CATEGORIES as [string, ...string[]]).optional(),
  tags: z.array(z.string()),
  serviceCategories: z.array(z.string()).optional(),
  readingTime: z.string(),
  featured: z.boolean().optional(),
});

export type BlogPost = z.infer<typeof BlogPostSchema>;

export const BlogPostListSchema = z.array(BlogPostSchema);
