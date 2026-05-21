import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { FadeIn } from '../components/common/FadeIn';
import { ServiceCard } from '../components/services/ServiceCard';
import { ServiceFilter } from '../components/services/ServiceFilter';
import { DEPARTMENTS, SERVICES } from '@/data/services';
import { useInterestTracker } from '@/hooks/useInterestTracker';
import { usePersonalizationStore } from '@/lib/stores/personalizationStore';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/layout/PageWrapper';

// P6 — below-fold heavy components are lazy + intersection-gated so Lighthouse
// can reach CPU idle on this route (previously PAGE_HUNG across 4 consecutive
// runs because GrowthCalculator's recharts ResponsiveContainer + BookingWizard
// hydration kept the main thread busy past the navigation budget).
const GrowthCalculator = React.lazy(() =>
  import('@/components/features/interactive/GrowthCalculator').then((m) => ({
    default: m.GrowthCalculator,
  })),
);
const BookingWizard = React.lazy(() =>
  import('@/components/features/interactive/BookingWizard').then((m) => ({
    default: m.BookingWizard,
  })),
);

// P25 — interest tags hoisted to module scope so useInterestTracker's effect
// dependency array stays referentially stable across renders. Inline literal
// previously caused an infinite render loop on Lighthouse where:
//   render → new tags ref → effect runs → trackVisit set() →
//   whole-store subscriber re-renders → loop.
// Combined with the narrowed `scores` slice selector below in the component,
// this is what unblocks /services PAGE_HUNG (see outputs/P25_FE_SERVICES_HANG_DIAGNOSTIC.md).
const INTEREST_TAGS: readonly string[] = ['strategy', 'digital-transformation'];

const InteractiveLazyMount: React.FC<{ children: React.ReactNode; placeholderHeight?: number }> = ({
  children,
  placeholderHeight = 480,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldMount, setShouldMount] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShouldMount(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldMount(true);
          io.disconnect();
        }
      },
      { rootMargin: '320px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ minHeight: shouldMount ? undefined : placeholderHeight }}>
      {shouldMount ? (
        <Suspense fallback={<div style={{ minHeight: placeholderHeight }} />}>{children}</Suspense>
      ) : null}
    </div>
  );
};

export const ServicesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = ((i18n.language || 'en').startsWith('tr') ? 'tr' : 'en') as 'tr' | 'en';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Personalization — stable tag reference + sliced subscription to avoid
  // refiring trackVisit on every store mutation (see INTEREST_TAGS comment).
  useInterestTracker(INTEREST_TAGS, 'services-hub');
  const scores = usePersonalizationStore((state) => state.scores);

  // Filter Logic
  const filteredServices = useMemo(() => {
    let filtered = SERVICES;

    // 1. Category Filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query),
      );
    }

    // 3. Personalization Sort (Zero Dependency AI)
    // If user has shown interest in a category, boost it to top
    if (selectedCategory === 'all' && !searchQuery) {
      filtered = [...filtered].sort((a, b) => {
        const scoreA = scores[a.category] || 0;
        const scoreB = scores[b.category] || 0;
        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [selectedCategory, searchQuery, scores]);

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const getCategoryLabel = (catId: string) => {
    const dept = DEPARTMENTS.find((d) => d.id === catId);
    if (!dept) return catId;
    const label = dept.label;
    if (typeof label === 'string') return label;
    return label[lang];
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{lang === 'tr' ? 'Hizmetler' : 'Services'} | eCyPro Premium Consulting</title>
        <meta
          name="description"
          content="Global standartlarda stratejik yönetim, dijital dönüşüm ve kurumsal liderlik hizmetleri."
        />
        <meta name="theme-color" content="#050810" />
        <link rel="canonical" href="https://ecypro.com/services" />
      </Helmet>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
          { name: lang === 'tr' ? 'Hizmetler' : 'Services', url: 'https://ecypro.com/services' },
        ])}
      />

      <PageWrapper className="bg-neutral pt-32 pb-24 relative overflow-hidden">
        {/* Ambient Background Glows - Adjusted for Light Theme */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] opacity-30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Header Section */}
          <div className="text-center mb-16">
            {/* P31-T02: immediate — LCP element <p> below; skip opacity:0 */}
            <FadeIn immediate>
              <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-6">
                Akademik Derinlik, Profesyonel Çözüm
              </span>
              <h1 className="text-4xl md:text-6xl font-serif font-medium text-white mb-6 leading-tight">
                Entegre Danışmanlık <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-dark">
                  Ekosistemi
                </span>
              </h1>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                İktisadi ve İdari Bilimler Fakültesi'nin tüm disiplinlerini tek bir çatıda topladık.
                Makrodan mikroya, veriye dayalı bütüncül stratejiler.
              </p>
            </FadeIn>
          </div>

          {/* Filter & Search Section */}
          <div className="sticky top-24 z-30 mb-12 space-y-6">
            {/* Search Bar - Glassmorphism Light */}
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors duration-300 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Hizmetlerde arayın..."
                  data-testid="services-search-input"
                  className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl
                                             focus:outline-none focus:border-secondary/50 focus:bg-white/10 focus:shadow-glow
                                             text-white placeholder-slate-500 transition-all duration-300 font-sans shadow-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <ServiceFilter
              departments={DEPARTMENTS}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Services Grid — P6 — no motion wrapper to prevent Lighthouse PAGE_HUNG.
                        Cards still use motion internally with whileHover (event-driven). */}
          <h2 className="sr-only">Hizmetlerimiz</h2>
          <div
            key={selectedCategory + searchQuery}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  categoryLabel={getCategoryLabel(service.category)}
                  variants={itemVariants}
                />
              ))
            ) : (
              <div className="col-span-full py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-6">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <h3
                  data-testid="services-no-results"
                  className="text-xl font-serif text-slate-300 mb-2"
                >
                  {t('no_results') || 'Sonuç Bulunamadı'}
                </h3>
                <p className="text-slate-300 mb-6">"{searchQuery}"...</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  data-testid="services-filter-clear"
                  className="px-6 py-2.5 bg-secondary text-neutral font-bold rounded-lg hover:bg-white transition-colors text-sm tracking-wide"
                >
                  {t('filter_clear') || 'Filtreleri Temizle'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Tools Section */}
        <div className="max-w-7xl mx-auto px-6 py-24 border-t border-white/10">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* ROI Calculator */}
            <div>
              <div className="text-left mb-8">
                <h2 className="text-3xl font-serif text-white mb-4">
                  Potansiyelinizi <span className="text-primary font-medium">Hesaplayın</span>
                </h2>
                <p className="text-slate-400">
                  Dijital dönüşüm ve stratejik optimizasyonun işletmenize katacağı değeri şimdiden
                  görün.
                </p>
              </div>
              <InteractiveLazyMount placeholderHeight={520}>
                <GrowthCalculator />
              </InteractiveLazyMount>
            </div>

            {/* Interactive Booking */}
            <div id="booking-wizard">
              <div className="text-left mb-8">
                <h2 className="text-3xl font-serif text-white mb-4">
                  Projenizi <span className="text-primary font-medium">Başlatalım</span>
                </h2>
                <p className="text-slate-400">
                  İhtiyaçlarınızı belirleyin, bütçenizi seçin ve uzman ekibimizle hemen iletişime
                  geçin.
                </p>
              </div>
              <InteractiveLazyMount placeholderHeight={520}>
                <BookingWizard />
              </InteractiveLazyMount>
            </div>
          </div>
        </div>
      </PageWrapper>
    </React.Fragment>
  );
};

export default ServicesPage;
