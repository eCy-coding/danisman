import { useQuery } from '@tanstack/react-query';
import { fetchInsightArticle } from '@/lib/insights-article-mock';

export function useInsightArticle(slug: string) {
  return useQuery({
    queryKey: ['insight-article', slug],
    queryFn: () => fetchInsightArticle(slug),
    staleTime: 1000 * 60 * 5,
  });
}
