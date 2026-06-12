import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { CATEGORY_BY_SLUG } from '@/data/taxonomy';
import type { FeedItem } from '@/lib/perspektifler';

/** Card-shaped row from GET /api/v1/insights/posts (PUBLISHED, select-narrowed). */
interface PublishedListRow {
  slug: string;
  titleTr: string;
  excerptTr: string;
  coverImageUrl: string;
  readingTimeMin: number;
  publishedAt: string;
  primaryDomain: string;
  author?: { displayName: string } | null;
  category?: { slug: string; nameTr: string } | null;
}

// Research domains map onto the public hub taxonomy so DB posts join the
// existing category facets instead of inventing parallel ones.
const DOMAIN_TO_CATEGORY: Record<string, string> = {
  M_A: 'ma-degerleme',
  ESG: 'kamu-esg',
  FINTECH: 'finans-ekonomi',
  AILE_SIRKETI: 'insan-organizasyon',
};

export function mapToFeedItem(row: PublishedListRow): FeedItem {
  const categorySlug =
    (row.category?.slug && CATEGORY_BY_SLUG[row.category.slug] ? row.category.slug : undefined) ??
    DOMAIN_TO_CATEGORY[row.primaryDomain] ??
    'strateji';
  return {
    slug: row.slug,
    title: row.titleTr,
    excerpt: row.excerptTr,
    date: row.publishedAt,
    author: row.author?.displayName ?? 'eCyPro',
    coverImage: row.coverImageUrl,
    category: CATEGORY_BY_SLUG[categorySlug]?.label ?? row.category?.nameTr ?? 'Strateji',
    categorySlug,
    tags: [],
    readingTime: `${row.readingTimeMin} dk okuma`,
    readTimeMin: row.readingTimeMin,
    lang: 'tr',
    format: 'rapor',
    featured: false,
    href: `/perspektifler/${row.slug}`,
  };
}

/**
 * Published DB posts (NotebookLM pipeline output) as FeedItems for the hub.
 * Fails soft: any error/offline API → empty list, static feed unaffected.
 */
export function usePublishedPosts(): FeedItem[] {
  const { data } = useQuery({
    queryKey: ['public-published-posts'],
    queryFn: async () => {
      const res = await apiClient.get('/insights/posts?limit=50');
      const rows = (res as { data: { data: PublishedListRow[] } }).data.data;
      return Array.isArray(rows) ? rows.map(mapToFeedItem) : [];
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
  return data ?? [];
}
