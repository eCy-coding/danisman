import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInsightsFeed } from '@/hooks/useInsightsFeed';
import { InsightCard } from '@/components/insights/InsightCard';
import { BreadcrumbNav } from '@/components/insights/BreadcrumbNav';

const PAGE_SIZE = 12;

// Stub related tags data — Wave-1 will replace
const STUB_RELATED: Array<{ slug: string; labelTr: string }> = [
  { slug: 'due-diligence', labelTr: 'Due Diligence' },
  { slug: 'regülasyon', labelTr: 'Regülasyon' },
  { slug: 'strateji', labelTr: 'Strateji' },
];

export function InsightTag() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation('insights');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading } = useInsightsFeed({ tagSlug: slug });
  const posts = data?.posts ?? [];
  const visiblePosts = posts.slice(0, visibleCount);

  // Stub tag label from slug
  const tagLabel = slug ? slug.replace(/-/g, ' ') : '';
  const postCount = data?.total ?? 0;

  const pageTitle = `#${tagLabel} | Perspektif | eCyPro`;
  const metaDesc = `${tagLabel} etiketiyle ilgili ${postCount} eCyPro analizi ve stratejik içerik.`;

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDesc} />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        {/* 1. Hero */}
        <section className="py-[55px] border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BreadcrumbNav
              items={[
                { label: t('breadcrumb.home'), href: '/' },
                { label: t('breadcrumb.insights'), href: '/insights' },
                { label: `#${tagLabel}` },
              ]}
            />
            <div className="mt-[21px]">
              <div className="flex items-center gap-[13px] flex-wrap">
                <h1 className="text-4xl font-bold text-slate-100">
                  <span className="text-amber-500">#</span>
                  {tagLabel}
                </h1>
                <span className="px-[13px] py-[5px] rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-sm">
                  {t('tag.postsCount', { count: postCount })}
                </span>
              </div>
              <p className="mt-[13px] text-slate-400 max-w-2xl">
                Bu etiket altında eCyPro uzmanları tarafından hazırlanmış analizler, çerçeveler ve
                stratejik içerikler yer almaktadır.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[34px]">
          {/* 3. Article feed */}
          <section>
            {isLoading ? (
              <div className="flex flex-col gap-[21px]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-slate-800 rounded-lg h-40 animate-pulse" />
                ))}
              </div>
            ) : visiblePosts.length === 0 ? (
              <div data-testid="empty-state" className="py-[55px] text-center">
                <p className="text-slate-500 text-lg mb-[13px]">Bu etiket için henüz makale yok.</p>
                <p className="text-slate-600 text-sm">
                  Farklı bir etiket deneyin veya tüm içeriklere göz atın.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[21px]">
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

          {/* 4. Related tags */}
          <section className="mt-[55px]">
            <h2 className="text-lg font-semibold text-slate-300 mb-[13px]">
              {t('tag.relatedTags')}
            </h2>
            <div className="flex flex-wrap gap-[8px]">
              {STUB_RELATED.map((tag) => (
                <a
                  key={tag.slug}
                  href={`/insights/tag/${tag.slug}`}
                  className="px-[13px] py-[5px] rounded-full text-sm bg-slate-800 text-slate-300 border border-slate-700 hover:border-amber-500/50 hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  #{tag.labelTr}
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
