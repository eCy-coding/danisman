/** EcyPro Perspektifler — Kategori taksonomisi (servis alanlarıyla eşleştirilmiş) */
export type BlogCategory =
  | 'Strateji'
  | 'Yapay Zeka & Teknoloji'
  | 'Finans & Ekonomi'
  | 'İnsan & Organizasyon'
  | 'Operasyon'
  | 'Pazarlama & CX'
  | 'Global Vizyon'
  | 'Kamu & ESG'
  | 'Liderlik'
  | 'M&A & Değerleme';

export const BLOG_CATEGORIES: BlogCategory[] = [
  'Strateji',
  'Yapay Zeka & Teknoloji',
  'Finans & Ekonomi',
  'İnsan & Organizasyon',
  'Operasyon',
  'Pazarlama & CX',
  'Global Vizyon',
  'Kamu & ESG',
  'Liderlik',
  'M&A & Değerleme',
];

export const BLOG_CATEGORY_META: Record<
  BlogCategory,
  { color: string; bg: string; border: string }
> = {
  Strateji: { color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  'Yapay Zeka & Teknoloji': {
    color: 'text-violet-300',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
  },
  'Finans & Ekonomi': {
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
  },
  'İnsan & Organizasyon': {
    color: 'text-rose-300',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
  },
  Operasyon: { color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  'Pazarlama & CX': { color: 'text-pink-300', bg: 'bg-pink-500/15', border: 'border-pink-500/30' },
  'Global Vizyon': { color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
  'Kamu & ESG': { color: 'text-teal-300', bg: 'bg-teal-500/15', border: 'border-teal-500/30' },
  Liderlik: { color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  'M&A & Değerleme': {
    color: 'text-indigo-300',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/30',
  },
};

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
