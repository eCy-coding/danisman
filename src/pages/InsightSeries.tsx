import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInsightsFeed } from '@/hooks/useInsightsFeed';
import { BreadcrumbNav } from '@/components/insights/BreadcrumbNav';

// Stub series data — Wave-1 will replace with real API
const STUB_SERIES = {
  id: 'series-1',
  slug: 'esg-seri',
  titleTr: 'ESG Masterclass Serisi',
  descriptionTr:
    'Türk şirketleri için kapsamlı ESG stratejisi ve raporlama rehberi. GRI, TCFD ve BRSA uyumluluk adımları.',
  coverImageUrl: '/images/placeholder-cover.jpg',
  totalParts: 5,
  publishedParts: 2,
  status: 'ACTIVE' as const,
  author: {
    displayName: 'Emre Can Yalçın',
    avatarUrl: '/images/founder-avatar.jpg',
    isFounder: true,
  },
  parts: [
    {
      order: 1,
      slug: 'esg-neden-onemli',
      titleTr: 'ESG Neden Önemli? Türk Şirketleri için Stratejik Perspektif',
      status: 'PUBLISHED' as const,
    },
    {
      order: 2,
      slug: 'esg-raporlama-cercevesi',
      titleTr: 'ESG Raporlama Çerçevesi: GRI ve TCFD Karşılaştırması',
      status: 'PUBLISHED' as const,
    },
    {
      order: 3,
      slug: 'esg-gri-uyumluluk',
      titleTr: 'GRI Standartları ile Uyumluluk Adımları',
      status: 'SCHEDULED' as const,
    },
    {
      order: 4,
      slug: 'esg-tcfd-iklim',
      titleTr: 'TCFD İklim Riski Açıklamaları',
      status: 'SCHEDULED' as const,
    },
    {
      order: 5,
      slug: 'esg-yatirimci-iletisim',
      titleTr: 'ESG ve Yatırımcı İletişimi',
      status: 'SCHEDULED' as const,
    },
  ],
};

export function InsightSeries() {
  const { slug } = useParams<{ slug: string; part?: string }>();
  const { t } = useTranslation('insights');

  // Use stub; real API will use slug to fetch series
  const series = STUB_SERIES;
  useInsightsFeed({ seriesSlug: slug });
  const publishedParts = series.publishedParts ?? 0;
  const progressPct = series.totalParts > 0 ? (publishedParts / series.totalParts) * 100 : 0;

  const pageTitle = `${series.titleTr} | Perspektif Serisi | eCyPro`;

  const statusBadge = {
    ACTIVE: {
      label: 'Devam Ediyor',
      cls: 'bg-green-900/50 text-green-400 border border-green-800',
    },
    COMPLETED: { label: 'Tamamlandı', cls: 'bg-slate-800 text-slate-400 border border-slate-700' },
    ON_HIATUS: {
      label: 'Ara Verildi',
      cls: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
    },
  };
  const badge = statusBadge[series.status];

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={series.descriptionTr} />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        {/* 1. Hero */}
        <section className="py-[55px] border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BreadcrumbNav
              items={[
                { label: t('breadcrumb.home'), href: '/' },
                { label: t('breadcrumb.insights'), href: '/insights' },
                { label: series.titleTr },
              ]}
            />
            <div className="mt-[21px] grid grid-cols-1 md:grid-cols-3 gap-[34px] items-center">
              <div className="md:col-span-2">
                <div className="flex items-center gap-[13px] mb-[13px] flex-wrap">
                  <span
                    className={`px-[13px] py-[5px] rounded-full text-xs font-medium ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-slate-500 text-sm">
                    {t('series.published', { count: publishedParts })} /{' '}
                    {t('series.totalParts', { total: series.totalParts })}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-[21px]">
                  {series.titleTr}
                </h1>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-[5px]">
                    <span>{t('series.progressLabel')}</span>
                    <span>{Math.round(progressPct)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden aspect-video bg-slate-800">
                <img
                  src={series.coverImageUrl}
                  alt={series.titleTr}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[34px] grid grid-cols-1 lg:grid-cols-3 gap-[34px]">
          <div className="lg:col-span-2 flex flex-col gap-[34px]">
            {/* 2. About series */}
            <section className="bg-slate-900 rounded-xl p-[21px] border border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100 mb-[13px]">Bu Seri Hakkında</h2>
              <p className="text-slate-400">{series.descriptionTr}</p>
              <div className="flex items-center gap-[13px] mt-[21px] pt-[21px] border-t border-slate-800">
                <img
                  src={series.author.avatarUrl}
                  alt={series.author.displayName}
                  className="w-10 h-10 rounded-full object-cover bg-slate-700"
                />
                <div>
                  <p className="text-sm font-medium text-slate-200">{series.author.displayName}</p>
                  {series.author.isFounder && (
                    <p className="text-xs text-amber-500">{t('author.founderBadge')}</p>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Parts list */}
            <section>
              <h2 className="text-lg font-semibold text-slate-100 mb-[21px]">Bölümler</h2>
              <ol className="flex flex-col gap-[13px]">
                {series.parts.map((part) => (
                  <li key={part.order}>
                    {part.status === 'PUBLISHED' ? (
                      <Link
                        to={`/insights/${part.slug}`}
                        className="flex items-center gap-[13px] p-[21px] bg-slate-900 rounded-lg border border-slate-800 hover:border-amber-500/30 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-slate-900 font-bold text-sm flex items-center justify-center">
                          {part.order}
                        </span>
                        <span className="text-slate-200 group-hover:text-amber-400 transition-colors">
                          {part.titleTr}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-[13px] p-[21px] bg-slate-900/50 rounded-lg border border-slate-800 opacity-60">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 text-slate-400 font-bold text-sm flex items-center justify-center">
                          {part.order}
                        </span>
                        <span className="text-slate-500">{part.titleTr}</span>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
                          {t('series.comingSoon')}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="flex flex-col gap-[21px]">
            {/* 4. Reading progress (stub) */}
            <section className="bg-slate-900 rounded-xl p-[21px] border border-slate-800">
              <h2 className="text-base font-semibold text-slate-100 mb-[13px]">
                {t('series.readingLog')}
              </h2>
              <p className="text-slate-500 text-sm mb-[13px]">{t('series.loginPrompt')}</p>
              <Link
                to="/login"
                className="inline-block px-[13px] py-[8px] bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Giriş Yap
              </Link>
            </section>

            {/* 5. Newsletter CTA */}
            <section className="p-[21px] rounded-xl border border-amber-500/30 bg-slate-900">
              <h2 className="text-base font-semibold text-amber-400 mb-[8px]">
                {t('newsletter.title')}
              </h2>
              <p className="text-slate-400 text-sm mb-[13px]">{t('newsletter.desc')}</p>
              <button className="w-full px-[13px] py-[8px] bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 text-sm">
                {t('newsletter.cta')}
              </button>
            </section>

            {/* 6. Share buttons */}
            <section className="bg-slate-900 rounded-xl p-[21px] border border-slate-800">
              <h2 className="text-base font-semibold text-slate-300 mb-[13px]">Paylaş</h2>
              <div className="flex gap-[13px]">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://ecypro.com/insights/series/${series.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-[8px] text-center rounded-lg bg-blue-900/30 text-blue-400 border border-blue-800/50 hover:bg-blue-900/60 transition-colors text-sm"
                  aria-label="LinkedIn'de paylaş"
                >
                  LinkedIn
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${series.titleTr} https://ecypro.com/insights/series/${series.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-[8px] text-center rounded-lg bg-green-900/30 text-green-400 border border-green-800/50 hover:bg-green-900/60 transition-colors text-sm"
                  aria-label="WhatsApp'ta paylaş"
                >
                  WhatsApp
                </a>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
