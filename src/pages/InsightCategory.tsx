import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Domain } from '@/types/insights';
import { DOMAIN_META } from '@/types/insights';
import { useInsightsFeed } from '@/hooks/useInsightsFeed';
import { InsightCard } from '@/components/insights/InsightCard';
import { FilterBar } from '@/components/insights/FilterBar';
import { BreadcrumbNav } from '@/components/insights/BreadcrumbNav';

const PAGE_SIZE = 12;

// Fallback domain for unknown slugs
function domainFromSlug(slug: string): Domain | undefined {
  const entry = Object.entries(DOMAIN_META).find(([, v]) => v.slug === slug);
  return entry ? (entry[0] as Domain) : undefined;
}

export function InsightCategory() {
  const { domain: domainSlug, subDomain } = useParams<{ domain: string; subDomain?: string }>();
  const { t } = useTranslation('insights');
  const [activeDomain, setActiveDomain] = useState<Domain | undefined>(
    domainSlug ? domainFromSlug(domainSlug) : undefined,
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { posts, total, isLoading } = useInsightsFeed({ domain: activeDomain, subDomain });
  const visiblePosts = posts.slice(0, visibleCount);

  const domainMeta = activeDomain ? DOMAIN_META[activeDomain] : null;
  const domainLabel = domainMeta?.labelTr ?? t('nav.insights');

  const pageTitle = `${domainLabel} | Perspektif | eCyPro`;
  const metaDesc = `${domainLabel} alanında eCyPro analizleri, çerçeveler ve stratejik içerikler.`;

  // Unique subdomains from results for navigator
  const allSubDomains = [...new Set(posts.map((p) => p.subDomain).filter(Boolean))];

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('breadcrumb.home'), item: 'https://ecypro.com/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('breadcrumb.insights'),
        item: 'https://ecypro.com/insights',
      },
      { '@type': 'ListItem', position: 3, name: domainLabel },
    ],
  });

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDesc} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        {/* 1. Hero */}
        <section
          className="py-[55px] border-b border-slate-800"
          style={domainMeta ? { borderColor: `${domainMeta.color}33` } : {}}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BreadcrumbNav
              items={[
                { label: t('breadcrumb.home'), href: '/' },
                { label: t('breadcrumb.insights'), href: '/insights' },
                { label: domainLabel },
              ]}
            />
            <div className="mt-[21px]">
              {domainMeta && (
                <span
                  className="inline-block px-3 py-1 rounded text-sm font-medium mb-[13px]"
                  style={{ backgroundColor: domainMeta.bgColor, color: domainMeta.color }}
                >
                  {domainMeta.labelTr}
                </span>
              )}
              <h1 className="text-4xl font-bold text-slate-100">{domainLabel}</h1>
              <p className="mt-[13px] text-slate-400 text-lg">
                {total} {t('category.subtitle')}
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[34px]">
          {/* 2. Sub-domain navigator */}
          {allSubDomains.length > 0 && (
            <section className="mb-[34px]">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-[13px]">
                {t('category.subDomainNav')}
              </h2>
              <div className="flex items-center gap-[8px] flex-wrap">
                {allSubDomains.map((sd) => (
                  <span
                    key={sd}
                    className="px-[13px] py-[5px] rounded-full text-sm bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {sd}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 3. Featured 3-up grid */}
          {posts.filter((p) => p.isFeatured).length > 0 && (
            <section className="mb-[55px]">
              <h2 className="text-xl font-semibold text-slate-100 mb-[21px]">
                {t('category.featuredTitle')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[21px]">
                {posts
                  .filter((p) => p.isFeatured)
                  .slice(0, 3)
                  .map((post, i) => (
                    <InsightCard
                      key={post.id}
                      post={post}
                      size={i === 0 ? 'lg' : 'md'}
                      showExcerpt
                    />
                  ))}
              </div>
            </section>
          )}

          {/* 4. Article feed with FilterBar */}
          <section>
            <div className="flex items-center justify-between mb-[21px] flex-wrap gap-[13px]">
              <h2 className="text-xl font-semibold text-slate-100">{t('category.latestTitle')}</h2>
              <FilterBar
                activeDomain={activeDomain}
                onDomainChange={(d) => {
                  setActiveDomain(d);
                  setVisibleCount(PAGE_SIZE);
                }}
              />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[21px]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-slate-800 rounded-lg h-64 animate-pulse" />
                ))}
              </div>
            ) : visiblePosts.length === 0 ? (
              <p className="text-slate-500 py-[34px] text-center">
                Bu kategoride henüz makale yok.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[21px]">
                {visiblePosts.map((post) => (
                  <InsightCard key={post.id} post={post} size="md" showExcerpt />
                ))}
              </div>
            )}

            {posts.length > visibleCount && (
              <div className="mt-[34px] text-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="px-[21px] py-[13px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {t('category.loadMore')}
                </button>
              </div>
            )}
          </section>

          {/* 5. Newsletter inline CTA */}
          <section className="mt-[55px] p-[34px] rounded-xl border border-amber-500/30 bg-slate-900">
            <h2 className="text-xl font-semibold text-amber-400 mb-[8px]">
              {t('newsletter.title')}
            </h2>
            <p className="text-slate-400 mb-[21px]">{t('newsletter.desc')}</p>
            <button className="px-[21px] py-[13px] bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
              {t('newsletter.cta')}
            </button>
            <p className="text-xs text-slate-600 mt-[8px]">{t('newsletter.kvkk')}</p>
          </section>
        </div>
      </main>
    </>
  );
}
