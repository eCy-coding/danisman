import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { EditorialHero } from '@/components/insights/EditorialHero';
import { DomainFilterBar } from '@/components/insights/DomainFilterBar';
import { SmartFilter } from '@/components/insights/SmartFilter';
import { FeaturedGrid } from '@/components/insights/FeaturedGrid';
import { LatestFeed } from '@/components/insights/LatestFeed';
import { DomainSpotlightCards } from '@/components/insights/DomainSpotlightCards';
import { SeriesShowcase } from '@/components/insights/SeriesShowcase';
import { NewsletterSidebar } from '@/components/insights/NewsletterSidebar';
import { useInsightsFeed } from '@/hooks/useInsightsFeed';
import {
  getMockFeaturedPost,
  getMockFeaturedGrid,
  getMockDomainSpotlights,
  getMockSeries,
  getMockArticleCounts,
} from '@/lib/insights-mock';
import type { InsightsFilter, Domain } from '@/types/insights';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

function parseFilterFromSearch(params: URLSearchParams): InsightsFilter {
  const domain = params.get('domain') as Domain | null;
  const search = params.get('q') ?? undefined;
  const sort = (params.get('sort') as InsightsFilter['sort']) ?? 'newest';
  const tagsRaw = params.get('tags');
  const tags = tagsRaw ? tagsRaw.split(',').filter(Boolean) : undefined;
  return { domain: domain ?? undefined, search, sort, tags };
}

function InsightsPageInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<InsightsFilter>(() => parseFilterFromSearch(searchParams));

  const { posts, hasMore, isLoading, isFetchingNextPage, fetchNextPage } = useInsightsFeed(filter);

  const featuredPost = getMockFeaturedPost();
  const featuredGrid = getMockFeaturedGrid();
  const domainSpotlights = getMockDomainSpotlights();
  const series = getMockSeries();
  const articleCounts = getMockArticleCounts();

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.domain) params.set('domain', filter.domain);
    if (filter.search) params.set('q', filter.search);
    if (filter.sort && filter.sort !== 'newest') params.set('sort', filter.sort);
    if (filter.tags?.length) params.set('tags', filter.tags.join(','));
    setSearchParams(params, { replace: true });
  }, [filter, setSearchParams]);

  function handleDomainChange(domain: Domain | 'ALL') {
    setFilter((prev) => ({
      ...prev,
      domain: domain === 'ALL' ? undefined : domain,
      cursor: undefined,
    }));
  }

  function handleFilterChange(newFilter: InsightsFilter) {
    setFilter({ ...newFilter, cursor: undefined });
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: "Perspektif — Türkiye'nin Sermaye ve Sürdürülebilirlik Düşüncesi",
    description: 'M&A, ESG, Fintech ve Aile Şirketi alanlarında Big4 derinliğinde bağımsız analiz.',
    url: 'https://ecypro.com/insights',
    numberOfItems: articleCounts.ALL,
    itemListElement: posts.slice(0, 10).map((post, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `https://ecypro.com/insights/${post.slug}`,
      name: post.titleTr,
    })),
  };

  return (
    <>
      <Helmet>
        <title>Perspektif — Türkiye M&A, ESG ve Aile Şirketi Analizi | eCyPro</title>
        <meta
          name="description"
          content="M&A, ESG, Fintech ve Aile Şirketi alanlarında Big4 derinliğinde bağımsız analiz. Türkiye'nin önde gelen yönetim danışmanlığı platformu."
        />
        <meta property="og:title" content="Perspektif | eCyPro" />
        <meta
          property="og:description"
          content="Türkiye'nin Sermaye, Sürdürülebilirlik ve Aile Şirketi Düşüncesi"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ecypro.com/insights" />
        <link rel="canonical" href="https://ecypro.com/insights" />
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <PageWrapper>
        <main data-testid="insights-page">
          <EditorialHero featuredPost={featuredPost} />

          <DomainFilterBar
            activeDomain={filter.domain ?? 'ALL'}
            onDomainChange={handleDomainChange}
            articleCounts={articleCounts}
          />

          <SmartFilter filter={filter} onChange={handleFilterChange} />

          {!filter.domain && !filter.search && !filter.tags?.length && (
            <FeaturedGrid posts={featuredGrid} />
          )}

          <div className="max-w-7xl mx-auto px-6 py-2 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              <LatestFeed
                posts={posts}
                hasMore={hasMore}
                onLoadMore={fetchNextPage}
                isLoading={isLoading || isFetchingNextPage}
              />
            </div>

            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div id="newsletter">
                <NewsletterSidebar variant="sidebar" />
              </div>
            </aside>
          </div>

          <DomainSpotlightCards spotlights={domainSpotlights} />

          <SeriesShowcase series={series} />

          <div className="lg:hidden max-w-7xl mx-auto px-6 py-10" id="newsletter">
            <NewsletterSidebar variant="inline" />
          </div>
        </main>
      </PageWrapper>
    </>
  );
}

export function InsightsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <InsightsPageInner />
    </QueryClientProvider>
  );
}
