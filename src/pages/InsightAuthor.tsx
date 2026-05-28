import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DOMAIN_META } from '@/types/insights';
import type { Domain } from '@/types/insights';
import { useInsightsFeed } from '@/hooks/useInsightsFeed';
import { InsightCard } from '@/components/insights/InsightCard';
import { BreadcrumbNav } from '@/components/insights/BreadcrumbNav';

export function InsightAuthor() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation('insights');

  const { posts, isLoading } = useInsightsFeed({ authorSlug: slug });

  // Derive author from first post (stub — Wave-1 will provide dedicated author endpoint)
  const author = posts[0]?.author ?? {
    id: 'author-1',
    slug: slug ?? 'emre-can-yalcin',
    displayName: 'Emre Can Yalçın',
    bioTr: 'eCyPro Kurucu Ortağı. M&A, ESG ve Fintech alanlarında 15+ yıllık danışmanlık deneyimi.',
    avatarUrl: '/images/founder-avatar.jpg',
    isFounder: true,
    linkedinUrl: 'https://linkedin.com/in/emrecan',
  };

  const totalViews = posts.reduce((sum, p) => sum + p.viewCount, 0);

  // Most active domain
  const domainCounts: Partial<Record<Domain, number>> = {};
  posts.forEach((p) => {
    domainCounts[p.primaryDomain] = (domainCounts[p.primaryDomain] ?? 0) + 1;
  });
  const topDomain = (Object.entries(domainCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ??
    'M_A') as Domain;
  const topDomainLabel = DOMAIN_META[topDomain]?.labelTr ?? '-';

  const pageTitle = `${author.displayName} | Perspektif | eCyPro`;

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={`${author.displayName} — ${author.bioTr}`} />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        {/* 1. Hero */}
        <section className="py-[55px] border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BreadcrumbNav
              items={[
                { label: t('breadcrumb.home'), href: '/' },
                { label: t('breadcrumb.insights'), href: '/insights' },
                { label: author.displayName },
              ]}
            />
            <div className="mt-[21px] flex items-center gap-[34px] flex-wrap">
              <img
                src={author.avatarUrl}
                alt={author.displayName}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover bg-slate-700 flex-shrink-0 border-2 border-amber-500/30"
              />
              <div>
                <div className="flex items-center gap-[13px] mb-[8px] flex-wrap">
                  <h1 className="text-3xl font-bold text-slate-100">{author.displayName}</h1>
                  {author.isFounder && (
                    <span className="px-[13px] py-[5px] rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium">
                      {t('author.founderBadge')}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 max-w-2xl">{author.bioTr}</p>
                <div className="flex items-center gap-[13px] mt-[13px]">
                  {author.linkedinUrl && (
                    <a
                      href={author.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="text-slate-500 hover:text-blue-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[34px]">
          {/* 2. Stats card */}
          <section className="mb-[34px]">
            <div className="grid grid-cols-3 gap-[21px]" data-testid="author-stats">
              <div className="bg-slate-900 rounded-xl p-[21px] border border-slate-800 text-center">
                <p className="text-3xl font-bold text-amber-400">{posts.length}</p>
                <p className="text-slate-500 text-sm mt-[5px]">{t('author.totalPosts')}</p>
              </div>
              <div className="bg-slate-900 rounded-xl p-[21px] border border-slate-800 text-center">
                <p className="text-3xl font-bold text-amber-400">
                  {totalViews.toLocaleString('tr-TR')}
                </p>
                <p className="text-slate-500 text-sm mt-[5px]">{t('author.totalViews')}</p>
              </div>
              <div className="bg-slate-900 rounded-xl p-[21px] border border-slate-800 text-center">
                <p className="text-lg font-bold text-amber-400 leading-tight">{topDomainLabel}</p>
                <p className="text-slate-500 text-sm mt-[5px]">{t('author.topDomain')}</p>
              </div>
            </div>
          </section>

          {/* 3. Article grid */}
          <section className="mb-[34px]">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[21px]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-slate-800 rounded-lg h-48 animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <p className="text-slate-500 py-[34px] text-center">
                Bu yazara ait makale bulunamadı.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[21px]">
                {posts.map((post) => (
                  <InsightCard key={post.id} post={post} size="md" showExcerpt />
                ))}
              </div>
            )}
          </section>

          {/* 4. Discovery CTA */}
          <section className="p-[34px] rounded-xl border border-amber-500/30 bg-slate-900 text-center">
            <h2 className="text-xl font-semibold text-amber-400 mb-[13px]">
              {t('author.discoveryCta')}
            </h2>
            <p className="text-slate-400 mb-[21px] max-w-xl mx-auto">
              Projenizi birlikte ele alalım. Strateji, M&A, ESG veya Fintech alanlarında ücretsiz
              keşif görüşmesi planlayın.
            </p>
            <Link
              to="/discovery-call"
              className="inline-block px-[21px] py-[13px] bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {t('author.discoveryCta')} →
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
