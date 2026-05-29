/**
 * L1-6 — /founder page
 *
 * Emre Can Yalçın bio + Big4 vs Boutique comparison + manifesto + career timeline.
 * Replaces the Navigate-to-/about redirect.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from '@/lib/seo-helmet';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Clock, Target, ExternalLink, Award } from 'lucide-react';
import { JsonLd } from '../components/seo/JsonLd';
import { buildFounderSchema } from '../lib/seo/founder-schema';
import { buildCanonical } from '@/i18n/canonical';
import { FOUNDER_BIOS, type SupportedLang } from '@/data/founder-bios';
import { FounderPortrait } from '@/components/common/FounderPortrait';
import { PageWrapper } from '../components/layout/PageWrapper';
import { FadeIn } from '../components/common/FadeIn';

const PHILOSOPHY_ICONS = ['⚡', '🌉', '🎯'];

export const FounderPage: React.FC = () => {
  const { t, i18n } = useTranslation('founder');
  const lang: SupportedLang = i18n.language.startsWith('tr') ? 'tr' : 'en';
  const bio300 = FOUNDER_BIOS[lang]?.['300w']?.text ?? FOUNDER_BIOS.tr['300w'].text;
  const founderSchema = buildFounderSchema();

  const philosophyCards = t('philosophy.cards', { returnObjects: true }) as Array<{
    title: string;
    desc: string;
  }>;
  const comparisonRows = t('comparison.rows', { returnObjects: true }) as Array<{
    criterion: string;
    big4: string;
    boutique: string;
  }>;
  const timelineItems = t('timeline.items', { returnObjects: true }) as Array<{
    year: string;
    event: string;
  }>;
  const credentials = t('credentials', { returnObjects: true }) as string[];

  return (
    <>
      <Helmet>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
        <link rel="canonical" href={buildCanonical('/founder', lang)} />
        <meta property="og:title" content={t('meta.title')} />
        <meta property="og:description" content={t('meta.description')} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={buildCanonical('/founder', lang)} />
        <meta property="og:image" content="https://www.ecypro.com/og/founder.png" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Emre Can Yalçın — Kurucu & Baş Stratejist | eCyPro" />
        <meta
          name="twitter:description"
          content="10+ yıl danışmanlık, 120+ stratejik karar. Big4 metodolojisi boutique çevikliğiyle."
        />
        <meta name="twitter:image" content="https://www.ecypro.com/og/founder.png" />
      </Helmet>
      <JsonLd data={founderSchema} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Anasayfa', item: 'https://www.ecypro.com/' },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Kurucu',
              item: 'https://www.ecypro.com/founder',
            },
          ],
        }}
      />

      <PageWrapper className="bg-neutral">
        {/* ── Hero ── */}
        <section className="relative pt-32 pb-16 px-6 md:px-12 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_30%_0%,rgba(37,99,235,0.08),transparent)] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto">
            <FadeIn>
              <nav className="text-sm text-slate-500 mb-10" aria-label="Breadcrumb">
                <Link to="/" className="hover:text-secondary transition-colors">
                  {t('breadcrumb.home')}
                </Link>
                <span className="mx-2 text-slate-700">/</span>
                <span className="text-slate-300">{t('breadcrumb.current')}</span>
              </nav>
            </FadeIn>

            <div className="grid md:grid-cols-[1.5fr_1fr] gap-12 items-start">
              <FadeIn>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-[10px] font-bold tracking-[0.25em] text-secondary uppercase mb-6">
                  <Award size={11} aria-hidden="true" />
                  {t('hero.badge')}
                </span>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-3 leading-tight">
                  Emre Can Yalçın
                </h1>
                <p className="text-xl text-slate-400 mb-6">{t('hero.subtitle')}</p>

                <ul
                  className="flex flex-wrap gap-2 mb-8"
                  aria-label={t('hero.credentialsAriaLabel')}
                >
                  {credentials.map((c) => (
                    <li
                      key={c}
                      className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-300"
                    >
                      {c}
                    </li>
                  ))}
                </ul>

                <p className="text-slate-300 leading-relaxed mb-8 text-lg">{bio300}</p>

                <div className="flex flex-wrap gap-4 mb-10">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20"
                    data-cta="founder-contact"
                    data-track="cta-click"
                  >
                    {t('hero.cta_discovery')} <ArrowRight size={18} />
                  </Link>
                  <a
                    href="https://linkedin.com/in/emrecnyalcin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 hover:border-white/30 transition-colors"
                    data-cta="founder-linkedin"
                    data-track="cta-click"
                  >
                    {t('hero.cta_linkedin')} <ExternalLink size={16} />
                  </a>
                </div>

                <ul className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
                  <li className="inline-flex items-center gap-2">
                    <Clock size={14} className="text-secondary" aria-hidden="true" />
                    {t('hero.stat_experience')}
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <Target size={14} className="text-secondary" aria-hidden="true" />
                    {t('hero.stat_decisions')}
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-secondary" aria-hidden="true" />
                    {t('hero.stat_sectors')}
                  </li>
                </ul>
              </FadeIn>

              <div className="flex justify-center md:justify-end">
                <FounderPortrait size="xl" className="max-w-[320px] w-full" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Big4 vs Boutique Comparison ── */}
        <section
          aria-labelledby="comparison-title"
          className="px-6 md:px-12 py-20 border-t border-white/10"
        >
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-12">
                <h2
                  id="comparison-title"
                  className="text-3xl md:text-4xl font-serif font-bold text-white mb-4"
                >
                  {t('comparison.title').replace(t('comparison.titleAccent'), '')}{' '}
                  <span className="text-secondary">{t('comparison.titleAccent')}</span>
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto">{t('comparison.subtitle')}</p>
              </div>
            </FadeIn>

            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm" aria-label={t('comparison.ariaLabel')}>
                <thead>
                  <tr className="border-b border-white/10">
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500 w-32"
                    >
                      {t('comparison.col_criterion')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500"
                    >
                      {t('comparison.col_big4')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-secondary"
                    >
                      {t('comparison.col_boutique')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {comparisonRows.map(({ criterion, big4, boutique }, i) => (
                    <tr
                      key={criterion}
                      className={i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}
                    >
                      <td className="px-6 py-4 font-medium text-slate-400 whitespace-nowrap">
                        {criterion}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{big4}</td>
                      <td className="px-6 py-4 text-slate-200 font-medium">{boutique}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">{t('comparison.footnote')}</p>
          </div>
        </section>

        {/* ── Philosophy ── */}
        <section
          aria-labelledby="philosophy-title"
          className="px-6 md:px-12 py-20 border-t border-white/10"
        >
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <h2
                id="philosophy-title"
                className="text-3xl md:text-4xl font-serif font-bold text-white mb-12 text-center"
              >
                {t('philosophy.title')}
              </h2>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-6">
              {philosophyCards.map(({ title, desc }, idx) => (
                <FadeIn key={title}>
                  <div className="h-full bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-secondary/30 transition-colors">
                    <div className="text-3xl mb-4" aria-hidden="true">
                      {PHILOSOPHY_ICONS[idx]}
                    </div>
                    <h3 className="font-bold text-white mb-3">{title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Career Timeline ── */}
        <section
          aria-labelledby="timeline-title"
          className="px-6 md:px-12 py-20 border-t border-white/10"
        >
          <div className="max-w-3xl mx-auto">
            <FadeIn>
              <h2
                id="timeline-title"
                className="text-3xl md:text-4xl font-serif font-bold text-white mb-12"
              >
                {t('timeline.title')}
              </h2>
            </FadeIn>

            <ol aria-label={t('timeline.ariaLabel')} className="space-y-0">
              {timelineItems.map(({ year, event }, i) => (
                <li key={year} className="relative flex gap-6 pb-8 last:pb-0">
                  <div className="flex flex-col items-center" aria-hidden="true">
                    <div className="w-3 h-3 rounded-full bg-secondary z-10 mt-1 shrink-0" />
                    {i < timelineItems.length - 1 && (
                      <div className="w-px flex-1 bg-white/10 mt-1" />
                    )}
                  </div>
                  <div className="pb-2">
                    <time dateTime={year} className="text-xs font-bold text-secondary">
                      {year}
                    </time>
                    <p className="text-sm text-slate-300 mt-1">{event}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Founder Letters CTA ── */}
        <section className="px-6 md:px-12 py-20 border-t border-white/10">
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn>
              <span className="inline-block text-xs font-bold tracking-widest text-secondary uppercase mb-4">
                {t('letters.badge')}
              </span>
              <h2 className="text-3xl font-serif font-bold text-white mb-4">
                {t('letters.title')}
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">{t('letters.desc')}</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/insights"
                  className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20"
                  data-cta="founder-insights"
                  data-track="cta-click"
                >
                  {t('letters.cta_insights')} <ArrowRight size={18} />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 hover:border-white/30 transition-colors"
                  data-cta="founder-discovery"
                  data-track="cta-click"
                >
                  {t('letters.cta_discovery')}
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      </PageWrapper>
    </>
  );
};

export default FounderPage;
