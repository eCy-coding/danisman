import { z } from 'zod';

export const BlogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string(),
  date: z.string().datetime(), // Validates ISO 8601 string
  author: z.string(),
  coverImage: z.string().url(),
  content: z.string().optional(), // For MDX content
  tags: z.array(z.string()),
  serviceCategories: z.array(z.string()).optional(), // Links to Service Categories
  readingTime: z.string()
});

export type BlogPost = z.infer<typeof BlogPostSchema>;

export const BlogPostListSchema = z.array(BlogPostSchema);
