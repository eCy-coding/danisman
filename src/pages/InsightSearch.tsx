import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInsightsFeed } from '@/hooks/useInsightsFeed';
import { InsightCard } from '@/components/insights/InsightCard';
import { BreadcrumbNav } from '@/components/insights/BreadcrumbNav';

export function InsightSearch() {
  const { t } = useTranslation('insights');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';

  const [inputValue, setInputValue] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(inputValue);
      if (inputValue) {
        setSearchParams({ q: inputValue }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, setSearchParams]);

  const { data, isLoading } = useInsightsFeed({ q: debouncedQ || undefined });
  const posts = data?.posts ?? [];

  const pageTitle = `${t('nav.search')} | Perspektif | eCyPro`;

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="robots" content="noindex" />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        <section className="py-[34px] border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BreadcrumbNav
              items={[
                { label: t('breadcrumb.home'), href: '/' },
                { label: t('breadcrumb.insights'), href: '/insights' },
                { label: t('nav.search') },
              ]}
            />

            {/* 1. Search bar */}
            <div className="mt-[21px] relative max-w-2xl">
              <label htmlFor="insight-search" className="sr-only">
                {t('search.placeholder')}
              </label>
              <div className="absolute inset-y-0 left-[13px] flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                id="insight-search"
                type="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('search.placeholder')}
                data-testid="search-input"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-[42px] pr-[21px] py-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base"
                /* eslint-disable-next-line jsx-a11y/no-autofocus */
                autoFocus
              />
            </div>

            {/* Result count */}
            {debouncedQ && !isLoading && (
              <p className="mt-[13px] text-sm text-slate-500">
                {t('search.resultsCount', { count: posts.length })}
              </p>
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[34px]">
          {/* 2. Results */}
          {isLoading ? (
            <div className="flex flex-col gap-[21px]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-lg h-40 animate-pulse" />
              ))}
            </div>
          ) : debouncedQ && posts.length === 0 ? (
            <div data-testid="no-results" className="py-[55px] text-center">
              <p className="text-slate-400 text-xl font-medium mb-[8px]">{t('search.noResults')}</p>
              <p className="text-slate-600 mb-[34px]">{t('search.noResultsHint')}</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="flex flex-col gap-[21px]">
              {posts.map((post) => (
                <InsightCard key={post.id} post={post} size="md" showExcerpt />
              ))}
            </div>
          ) : null}

          {/* 3. Fallback CTA */}
          <section className="mt-[55px] p-[34px] rounded-xl border border-amber-500/30 bg-slate-900 text-center">
            <h2 className="text-xl font-semibold text-amber-400 mb-[8px]">
              {t('search.fallbackCta')}
            </h2>
            <p className="text-slate-400 mb-[21px]">{t('search.fallbackDesc')}</p>
            <Link
              to="/discovery-call"
              className="inline-block px-[21px] py-[13px] bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Discovery Call →
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
