import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInsightsFeed } from '@/hooks/useInsightsFeed';
import { InsightCard } from '@/components/insights/InsightCard';
import { BreadcrumbNav } from '@/components/insights/BreadcrumbNav';

const YEARS = [2024, 2025, 2026];

function padMonth(m: number) {
  return String(m).padStart(2, '0');
}

export function InsightArchive() {
  const { year: yearParam, month: monthParam } = useParams<{ year?: string; month?: string }>();
  const { t } = useTranslation('insights');

  const selectedYear = yearParam ? parseInt(yearParam, 10) : undefined;
  const selectedMonth = monthParam ? parseInt(monthParam, 10) : undefined;

  const { data, isLoading } = useInsightsFeed({ year: selectedYear, month: selectedMonth });
  const posts = data?.posts ?? [];

  const yearTitle = selectedYear ? ` — ${selectedYear}` : '';
  const pageTitle = `Arşiv${yearTitle} | Perspektif | eCyPro`;

  const monthNames = t('archive.monthNames', { returnObjects: true }) as string[];

  // Group posts by month for timeline when year is selected
  const postsByMonth: Record<number, typeof posts> = {};
  if (selectedYear) {
    posts.forEach((p) => {
      const m = new Date(p.publishedAt).getMonth() + 1;
      if (!postsByMonth[m]) postsByMonth[m] = [];
      postsByMonth[m].push(p);
    });
  }

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content="eCyPro Perspektif makale arşivi" />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        {/* Header */}
        <section className="py-[55px] border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BreadcrumbNav
              items={[
                { label: t('breadcrumb.home'), href: '/' },
                { label: t('breadcrumb.insights'), href: '/insights' },
                ...(selectedYear
                  ? [
                      { label: t('archive.title'), href: '/insights/archive' },
                      { label: String(selectedYear) },
                    ]
                  : [{ label: t('archive.title') }]),
              ]}
            />
            <h1 className="mt-[21px] text-4xl font-bold text-slate-100">
              {t('archive.title')}
              {selectedYear ? ` — ${selectedYear}` : ''}
            </h1>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[34px]">
          {/* Year selector */}
          <section className="mb-[34px]" data-testid="year-selector">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-[13px]">
              {t('archive.yearSelector')}
            </h2>
            <div className="flex items-center gap-[8px]">
              {YEARS.map((year) => (
                <Link
                  key={year}
                  to={`/insights/archive/${year}`}
                  className={[
                    'px-[21px] py-[8px] rounded-full text-sm font-medium transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                    selectedYear === year
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700',
                  ].join(' ')}
                >
                  {year}
                </Link>
              ))}
            </div>
          </section>

          {/* Month grid */}
          {selectedYear && (
            <section className="mb-[34px]" data-testid="month-grid">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-[8px]">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const count = postsByMonth[month]?.length ?? 0;
                  const isActive = selectedMonth === month;
                  return count > 0 ? (
                    <Link
                      key={month}
                      to={`/insights/archive/${selectedYear}/${padMonth(month)}`}
                      className={[
                        'p-[13px] rounded-lg text-center transition-all duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                        isActive
                          ? 'bg-amber-500 text-slate-900'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700',
                      ].join(' ')}
                    >
                      <p className="text-xs font-medium">{monthNames[month - 1]}</p>
                      <p className="text-lg font-bold mt-1">{count}</p>
                    </Link>
                  ) : (
                    <div
                      key={month}
                      className="p-[13px] rounded-lg text-center bg-slate-900/50 border border-slate-800 opacity-40"
                    >
                      <p className="text-xs text-slate-600">{monthNames[month - 1]}</p>
                      <p className="text-lg font-bold mt-1 text-slate-700">0</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Article list — timeline view when year selected */}
          <section>
            {isLoading ? (
              <div className="flex flex-col gap-[21px]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-slate-800 rounded-lg h-40 animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div data-testid="archive-empty-state" className="py-[55px] text-center">
                <p className="text-slate-500 text-lg">{t('archive.noPosts')}</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div
                  className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-800"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-[21px]">
                  {posts.map((post) => (
                    <div key={post.id} className="flex gap-[21px] items-start relative">
                      {/* Timeline dot */}
                      <div className="flex-shrink-0 w-[40px] flex justify-center pt-6">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-slate-950 relative z-10" />
                      </div>
                      <div className="flex-1 pb-[21px]">
                        <InsightCard post={post} size="md" showExcerpt />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
