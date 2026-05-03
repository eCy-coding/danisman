/** Phase 20 B3: blog category taxonomy. Curated, finite set. */
export type BlogCategory = 'Strateji' | 'Teknoloji' | 'Liderlik' | 'Pazarlama' | 'Genel';

export const BLOG_CATEGORIES: BlogCategory[] = [
  'Strateji',
  'Teknoloji',
  'Liderlik',
  'Pazarlama',
  'Genel',
];

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  coverImage?: string;
  /** Single primary category for the post (Phase 20 B3). */
  category?: BlogCategory;
  /** Free-form tags for finer search. */
  tags: string[];
  readingTime: string;
}

export interface BlogPostIndex {
  [slug: string]: BlogPost;
}
