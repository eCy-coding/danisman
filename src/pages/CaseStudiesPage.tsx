import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CaseStudyCard } from '../components/features/case-studies/CaseStudyCard';
import { CASE_STUDIES } from '@/data/mockCaseStudies';
import { CATEGORIES } from '@/data/taxonomy';
import { FadeIn } from '../components/common/FadeIn';
import { PageWrapper } from '../components/layout/PageWrapper';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { useTranslation } from '@/lib/i18n';
import { buildCanonical } from '@/i18n/canonical';

const ALL_CATEGORIES = '__all__';

/** Legacy ?industry= values map onto the shared Perspektifler taxonomy so old
 *  filter URLs keep working after the BUG-11 unification. */
const LEGACY_INDUSTRY_PARAM: Record<string, string> = Object.fromEntries(
  CASE_STUDIES.filter((s) => s.categorySlug).map((s) => [s.industry, s.categorySlug as string]),
);

export const CaseStudiesPage: React.FC = () => {
  const { language } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const legacyIndustry = searchParams.get('industry');
  const activeCategory =
    searchParams.get('kategori') ??
    (legacyIndustry ? (LEGACY_INDUSTRY_PARAM[legacyIndustry] ?? ALL_CATEGORIES) : ALL_CATEGORIES);

  // Shared 10-category taxonomy (BUG-11): only categories with ≥1 case render.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    CASE_STUDIES.forEach((s) => {
      if (s.categorySlug) counts.set(s.categorySlug, (counts.get(s.categorySlug) ?? 0) + 1);
    });
    return CATEGORIES.filter((c) => counts.has(c.slug)).map((c) => ({
      ...c,
      count: counts.get(c.slug) ?? 0,
    }));
  }, []);

  const visibleStudies = useMemo(() => {
    if (activeCategory === ALL_CATEGORIES) return CASE_STUDIES;
    return CASE_STUDIES.filter((s) => s.categorySlug === activeCategory);
  }, [activeCategory]);

  const setCategory = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete('industry');
    if (slug === ALL_CATEGORIES) {
      next.delete('kategori');
    } else {
      next.set('kategori', slug);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <React.Fragment>
      <Helmet>
        {/* P32-T12: keyword-optimised title + TR/EN bilingual */}
        <title>
          {language === 'tr'
            ? 'Vaka Çalışmaları & Başarı Hikayeleri | eCyPro Danışmanlık'
            : 'Consulting Case Studies & Success Stories | eCyPro'}
        </title>
        <meta
          name="description"
          content={
            language === 'tr'
              ? 'Stratejik danışmanlık, operasyonel verimlilik ve dijital dönüşüm projelerinden vaka çalışmaları. Gerçek ölçülebilir sonuçlar, anonim müşteri hikayeleri.'
              : 'Case studies from strategic consulting, operational efficiency and digital transformation projects. Measurable results, anonymized client success stories.'
          }
        />
        <link rel="canonical" href={buildCanonical('/case-studies', language)} />
      </Helmet>

      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Anasayfa', url: 'https://ecypro.com/' },
          { name: 'Case Studies', url: 'https://ecypro.com/case-studies' },
        ])}
      />

      <PageWrapper className="bg-neutral pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <FadeIn>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
                Başarı <span className="text-primary">Hikayeleri</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                Stratejik ortaklıklarımızla yarattığımız değer ve somut iş sonuçları.
              </p>
            </FadeIn>
          </div>

          <nav aria-label="Kategori filtresi" className="mb-12">
            <ul className="flex flex-wrap justify-center gap-2">
              <li>
                <button
                  type="button"
                  onClick={() => setCategory(ALL_CATEGORIES)}
                  aria-pressed={activeCategory === ALL_CATEGORIES}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === ALL_CATEGORIES
                      ? 'bg-secondary text-neutral'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Tümü ({CASE_STUDIES.length})
                </button>
              </li>
              {categories.map((cat) => {
                const active = activeCategory === cat.slug;
                return (
                  <li key={cat.slug}>
                    <button
                      type="button"
                      onClick={() => setCategory(cat.slug)}
                      aria-pressed={active}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        active
                          ? 'bg-secondary text-neutral'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="text-center mt-4">
              <Link
                to="/perspektifler?format=vaka-analizi"
                className="text-xs text-secondary hover:underline"
              >
                Perspektifler'de tüm vaka analizlerini görün →
              </Link>
            </p>
          </nav>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" aria-live="polite">
            {visibleStudies.length === 0 ? (
              <p className="col-span-full text-center text-slate-400 py-12">
                Bu sektör için henüz vaka bulunmuyor.
              </p>
            ) : (
              visibleStudies.map((study, idx) => (
                <motion.div
                  key={study.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <CaseStudyCard study={study} />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </PageWrapper>

      {/* atom-10-4: Final CTA + footer */}
      <section
        className="py-20 px-6 bg-neutral"
        aria-labelledby="cases-cta-heading"
        data-testid="case-studies-cta"
      >
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-amber-600/90 to-amber-500 rounded-3xl px-8 py-12 text-center shadow-xl shadow-amber-900/20">
          <h2
            id="cases-cta-heading"
            className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 mb-3"
          >
            Projenizi Konuşalım
          </h2>
          <p className="text-neutral-800 mb-8 leading-relaxed max-w-lg mx-auto">
            Sektörünüze özgü vaka deneyimlerimizi keşif görüşmesinde paylaşabiliriz. 30 dakika,
            taahhütsüz, doğrudan founder erişimi.
          </p>
          <Link
            to="/discovery"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-amber-400 font-semibold rounded-xl hover:bg-neutral-800 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            Keşif Görüşmesi Planla <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </React.Fragment>
  );
};
