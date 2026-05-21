import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { CaseStudyCard } from '../components/features/case-studies/CaseStudyCard';
import { CASE_STUDIES } from '@/data/mockCaseStudies';
import { FadeIn } from '../components/common/FadeIn';
import { PageWrapper } from '../components/layout/PageWrapper';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';

const ALL_INDUSTRY = '__all__';

export const CaseStudiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeIndustry = searchParams.get('industry') ?? ALL_INDUSTRY;

  const industries = useMemo(() => {
    const set = new Set<string>();
    CASE_STUDIES.forEach((s) => {
      if (s.industry) set.add(s.industry);
    });
    return Array.from(set).sort();
  }, []);

  const visibleStudies = useMemo(() => {
    if (activeIndustry === ALL_INDUSTRY) return CASE_STUDIES;
    return CASE_STUDIES.filter((s) => s.industry === activeIndustry);
  }, [activeIndustry]);

  const setIndustry = (industry: string) => {
    const next = new URLSearchParams(searchParams);
    if (industry === ALL_INDUSTRY) {
      next.delete('industry');
    } else {
      next.set('industry', industry);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>Başarı Hikayeleri | eCyPro Premium Consulting</title>
        <meta
          name="description"
          content="Müşterilerimizle birlikte yazdığımız başarı hikayeleri. Dönüşüm yolculuklarına tanıklık edin."
        />
        <link rel="canonical" href="https://ecypro.com/case-studies" />
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

          <nav aria-label="Sektör filtresi" className="mb-12">
            <ul className="flex flex-wrap justify-center gap-2">
              <li>
                <button
                  type="button"
                  onClick={() => setIndustry(ALL_INDUSTRY)}
                  aria-pressed={activeIndustry === ALL_INDUSTRY}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeIndustry === ALL_INDUSTRY
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Tümü ({CASE_STUDIES.length})
                </button>
              </li>
              {industries.map((industry) => {
                const count = CASE_STUDIES.filter((s) => s.industry === industry).length;
                const active = activeIndustry === industry;
                return (
                  <li key={industry}>
                    <button
                      type="button"
                      onClick={() => setIndustry(industry)}
                      aria-pressed={active}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {industry} ({count})
                    </button>
                  </li>
                );
              })}
            </ul>
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
    </React.Fragment>
  );
};
