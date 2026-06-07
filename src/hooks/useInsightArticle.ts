import { useQuery } from '@tanstack/react-query';
import { fetchInsightArticle as fetchInsightArticleMock } from '@/lib/insights-article-mock';
import type { InsightPost } from '@/types/insights';

/**
 * R12-P7 — Wire the public article hook to the real backend, fall back to
 * the Wave-1 mock if the API returns 404 (so pre-existing demo slugs like
 * `test-article` still render). Once every demo card is replaced with a
 * real post in Neon, the mock fallback can be deleted.
 *
 * Public endpoint: GET /api/v1/insights/posts/:slug (added in R12-P6).
 */

interface ApiResponse {
  data?: Partial<InsightPost> & { author?: Partial<InsightPost['author']> | null };
  error?: string;
}

async function fetchInsightArticleReal(slug: string): Promise<InsightPost | null> {
  // Vite proxy: /api → backend. apiBase defaults to relative so it works in
  // both dev (Vite proxy) and prod (same origin).
  // S14 R10 — test (Node) environment'da relative URL parse hatası veriyor
  // (TypeError: Failed to parse URL from /api/insights/posts/). typeof window
  // === 'undefined' (Node/vitest) iken `http://localhost` prefix at; browser'da
  // boş string ile relative URL kalır → existing behavior preserved.
  const baseUrl = typeof window === 'undefined' ? 'http://localhost' : '';
  const res = await fetch(`${baseUrl}/api/insights/posts/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetchInsightArticle failed: ${res.status}`);
  const json = (await res.json()) as ApiResponse;
  if (!json.data) return null;

  // Normalise Prisma row → InsightPost shape. The backend already returns
  // most fields with matching names; we fill defaults for the few counters
  // that the type marks required but the schema treats as numeric defaults.
  const d = json.data as Partial<InsightPost>;
  return {
    id: d.id ?? '',
    slug: d.slug ?? slug,
    slugEn: d.slugEn,
    type: d.type ?? 'ANALYSIS',
    status: d.status ?? 'PUBLISHED',
    language: d.language ?? 'TR_ONLY',
    titleTr: d.titleTr ?? '',
    titleEn: d.titleEn,
    excerptTr: d.excerptTr ?? '',
    excerptEn: d.excerptEn,
    bodyTrMdx: d.bodyTrMdx,
    bodyEnMdx: d.bodyEnMdx,
    primaryDomain: d.primaryDomain ?? 'ESG',
    subDomain: d.subDomain ?? '',
    topic: d.topic,
    seriesId: d.seriesId,
    seriesOrder: d.seriesOrder,
    tags: d.tags ?? [],
    author: (d.author as InsightPost['author']) ?? {
      id: '',
      slug: '',
      displayName: 'eCyPro',
      bioTr: '',
      avatarUrl: '/founder.svg',
    },
    coverImageUrl: d.coverImageUrl ?? '',
    coverImageAlt: d.coverImageAlt ?? '',
    ogImageUrl: d.ogImageUrl,
    metaTitleTr: d.metaTitleTr,
    metaTitleEn: d.metaTitleEn,
    metaDescTr: d.metaDescTr,
    metaDescEn: d.metaDescEn,
    canonicalUrl: d.canonicalUrl,
    noindex: d.noindex ?? false,
    readingTimeMin: d.readingTimeMin ?? 5,
    viewCount: d.viewCount ?? 0,
    uniqueViewCount: d.uniqueViewCount ?? 0,
    shareCount: d.shareCount ?? 0,
    bookmarkCount: d.bookmarkCount ?? 0,
    commentCount: d.commentCount ?? 0,
    publishedAt: d.publishedAt,
    scheduledAt: d.scheduledAt,
    updatedAt: d.updatedAt ?? new Date().toISOString(),
    createdAt: d.createdAt ?? new Date().toISOString(),
    isFeatured: d.isFeatured ?? false,
    isEditorsPick: d.isEditorsPick ?? false,
    featureOrder: d.featureOrder,
    feedPinned: d.feedPinned ?? false,
    series: d.series,
    manualRelated: d.manualRelated,
  };
}

export function useInsightArticle(slug: string) {
  return useQuery({
    queryKey: ['insight-article', slug],
    queryFn: async () => {
      try {
        const real = await fetchInsightArticleReal(slug);
        if (real) return real;
      } catch (err) {
        // Network or 5xx — fall back to mock for resilience during the
        // backend-wire-up rollout. Logged so we notice silent failures.
        // eslint-disable-next-line no-console
        console.warn('[useInsightArticle] real fetch failed, using mock', err);
      }
      return fetchInsightArticleMock(slug);
    },
    staleTime: 1000 * 60 * 5,
  });
}
