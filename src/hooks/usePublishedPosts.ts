import { useQuery } from '@tanstack/react-query';
import { apiClient, IS_SIMULATION_MODE } from '@/lib/api';
import { dbPostsToFeedItems, type DbPublishedPost, type FeedItem } from '@/lib/perspektifler';

interface PublishedPostsResponse {
  data: DbPublishedPost[];
  meta: { count: number };
}

/**
 * Admin-pipeline published posts (Neon BlogPost, status=PUBLISHED) for the
 * Perspektifler hub. Returns feed-ready items: mapped to `arastirma` format,
 * deduped against the static corpus, newest first.
 *
 * CLS contract: consumers must APPEND these after the static grid — the query
 * resolves post-hydration, so prepending would shift every prerendered card.
 */
export function usePublishedPosts() {
  return useQuery<FeedItem[]>({
    queryKey: ['perspektifler', 'published-db-posts'],
    queryFn: async () => {
      const res = await apiClient.get<PublishedPostsResponse>('/insights/posts');
      return dbPostsToFeedItems(res.data?.data ?? []);
    },
    // Static-only deploys (Plan A) have no backend: skip the request entirely
    // instead of surfacing a guaranteed network error on every hub visit.
    enabled: !IS_SIMULATION_MODE,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
