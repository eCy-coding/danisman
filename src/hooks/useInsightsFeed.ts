import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchInsightsFeed } from '@/lib/insights-mock';
import type { InsightsFilter, InsightsFeedResponse, InsightPostCard } from '@/types/insights';

export interface UseInsightsFeedResult {
  posts: InsightPostCard[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

export function useInsightsFeed(filter: InsightsFilter): UseInsightsFeedResult {
  const query = useInfiniteQuery<InsightsFeedResponse, Error>({
    queryKey: ['insights-feed', filter],
    queryFn: ({ pageParam }) =>
      fetchInsightsFeed({ ...filter, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
  });

  const posts = query.data?.pages.flatMap((p) => p.posts) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const lastPage = query.data?.pages[query.data.pages.length - 1];
  const hasMore = lastPage?.hasMore ?? false;

  return {
    posts,
    total,
    hasMore,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
