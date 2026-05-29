import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { buildCanonical } from '@/i18n/canonical';
import { FadeIn } from '../components/common/FadeIn';
import { ServiceCard } from '../components/services/ServiceCard';
import { ServiceFilter } from '../components/services/ServiceFilter';
import { DEPARTMENTS, SERVICES } from '@/data/services';
import { useInterestTracker } from '@/hooks/useInterestTracker';
import { usePersonalizationStore } from '@/lib/stores/personalizationStore';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/layout/PageWrapper';
import { ServicesClusterSection } from '../components/sections/ServicesClusterSection';
import { ServicesDiscoveryCTA } from '../components/sections/ServicesDiscoveryCTA';
// P32-T17: FAQSection with FAQPage JSON-LD for "People Also Ask" rich snippets
import { FAQSection } from '../components/blog/FAQSection';

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
  const { t, i18n } = useTranslation('services');
  const lang = ((i18n.language || 'en').startsWith('tr') ? 'tr' : 'en') as 'tr' | 'en';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Personalization — stable tag reference + sliced subscription to avoid
  // refiring trackVisit on every store mutation (see INTEREST_TAGS comment).
  useInterestTracker(INTEREST_TAGS, 'services-hub');
  const scores = usePersonalizationStore((state) => state.scores);

  // Filter Logic
  const showGrouped = selectedCategory === 'all' && !searchQuery.trim();

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

  // Fixed cluster display order for grouped view
  const CLUSTER_ORDER = DEPARTMENTS.filter((d) => d.id !== 'all');

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
        {/* P32-T12: keyword-optimised title (primary: "stratejik danışmanlık hizmetleri" / "management consulting Turkey") */}
        <title>
          {lang === 'tr'
            ? 'Stratejik Danışmanlık Hizmetleri — KVKK, Dijital Dönüşüm | eCyPro'
            : 'Management Consulting Services — KVKK, Digital Transformation | eCyPro'}
        </title>
        <meta
          name="description"
          content={
            lang === 'tr'
              ? 'Stratejik yönetim danışmanlığı, KVKK & AB regülasyon uyumu, operasyonel verimlilik ve dijital dönüşüm. Big4-alternatif boutique metodoloji, sektörel benchmark.'
              : 'Strategic management consulting, KVKK & EU regulatory compliance, operational efficiency and digital transformation. Big4-alternative boutique methodology, sector benchmarks.'
          }
        />
        <meta name="theme-color" content="#0d1b2a" />
        <link rel="canonical" href={buildCanonical('/services', lang)} />
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
                {t('hero_badge')}
              </span>
              <h1 className="text-4xl md:text-6xl font-serif font-medium text-white mb-6 leading-tight">
                {t('hero_title_lead')} <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-dark">
                  {t('hero_title_accent')}
                </span>
              </h1>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                {t('hero_intro')} {t('subtitle')}
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
                  placeholder={t('search_placeholder')}
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
          {showGrouped ? (
            /* Grouped view: h1 (page) → h2 (cluster) → h3 (service title in ServiceCard) */
            <div key="grouped" className="space-y-16">
              {CLUSTER_ORDER.map((cluster) => {
                const clusterLabel =
                  typeof cluster.label === 'string' ? cluster.label : cluster.label[lang];
                const clusterServices = SERVICES.filter((s) => s.category === cluster.id);
                return (
                  <section key={cluster.id} aria-labelledby={`cluster-${cluster.id}`}>
                    <h2
                      id={`cluster-${cluster.id}`}
                      data-testid={`cluster-heading-${cluster.id}`}
                      className="text-2xl font-serif font-medium text-white mb-8 pb-3 border-b border-white/10"
                    >
                      {clusterLabel}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {clusterServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          categoryLabel={clusterLabel}
                          variants={itemVariants}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            /* Filtered / search view: flat grid */
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
          )}
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

      {/* atom-2-2/3/4/5: 4 cluster grouped view */}
      <ServicesClusterSection />

      {/* P32-T17: FAQ section — FAQPage JSON-LD rich snippet */}
      <div className="max-w-4xl mx-auto px-6 md:px-12 pb-8">
        <FAQSection
          title={lang === 'tr' ? 'Sık Sorulan Sorular' : 'Frequently Asked Questions'}
          items={
            lang === 'tr'
              ? [
                  {
                    question: 'Danışmanlık hizmeti ne kadar sürer?',
                    answer:
                      'Kapsama bağlı olarak 4 haftadan 12 aya kadar değişir. Stratejik yol haritası projeleri genellikle 8-12 hafta, KVKK uyum projeleri 4-8 hafta, kapsamlı dönüşüm programları 6-12 ay sürer. İlk keşif görüşmesinde projeye özgü takvim netleştirilir.',
                  },
                  {
                    question: 'Hangi büyüklükteki şirketlere hizmet veriyorsunuz?',
                    answer:
                      "Temel olarak 50-500 çalışan aralığındaki orta ölçekli kurumlara ve aile şirketlerine hizmet veriyoruz. KOBİ'lere yönelik Starter paketi ve kurumsal müşteriler için Enterprise özel kapsamı da sunuyoruz.",
                  },
                  {
                    question: 'KVKK ve GDPR aynı anda çözülebilir mi?',
                    answer:
                      "Evet. AB ile iş yapan Türk firmalar için GDPR-first yaklaşımı benimseyerek KVKK'yı üstüne inşa ediyoruz. Bu yaklaşım hem iki ayrı projeye gerek olmadan uyumu sağlar, hem de gelecek AB yeterlilik kararına hazırlar.",
                  },
                  {
                    question: 'Uzaktan hizmet veriyor musunuz?',
                    answer:
                      "Evet. Hizmetlerimizin %80'i online olarak yürütülebilir. Özellikle strateji workshop'ları, KVKK uyum süreçleri ve dijital dönüşüm yol haritası çalışmaları tam uzaktan gerçekleştirilir. Gerektiğinde yerinde çalışma da yapıyoruz.",
                  },
                  {
                    question: 'Projeyi kim yürütecek?',
                    answer:
                      'Founder Emre Can Yalçın her projede bizzat yer alır — sadece satış sürecinde değil, teslim aşamasında da. Junior delegasyon yok; boutique modelin temel farkı bu.',
                  },
                ]
              : [
                  {
                    question: 'How long does a consulting engagement take?',
                    answer:
                      'Timelines vary from 4 weeks to 12 months depending on scope. Strategic roadmap projects typically take 8-12 weeks, KVKK compliance 4-8 weeks, and comprehensive transformation programs 6-12 months. The exact timeline is clarified in the initial discovery call.',
                  },
                  {
                    question: 'What size companies do you work with?',
                    answer:
                      'We primarily serve mid-market organizations with 50-500 employees and family businesses. We also offer a Starter package for SMEs and custom Enterprise scope for larger institutions.',
                  },
                  {
                    question: 'Can KVKK and GDPR compliance be handled together?',
                    answer:
                      'Yes. For Turkish firms doing business in the EU, we use a GDPR-first approach and layer KVKK compliance on top. This avoids two separate projects and prepares you for the upcoming EU adequacy decision for Turkey.',
                  },
                  {
                    question: 'Do you work remotely?',
                    answer:
                      'Yes. 80% of our services can be delivered entirely online. Strategy workshops, compliance projects, and digital transformation roadmaps are commonly done remotely. On-site work is available when needed.',
                  },
                  {
                    question: 'Who will actually work on my project?',
                    answer:
                      'Founder Emre Can Yalçın is personally involved in every engagement — not just the sales process, but delivery as well. No junior delegation; that is the core differentiator of the boutique model.',
                  },
                ]
          }
        />
      </div>

      {/* atom-2-6: Discovery CTA with KVKKBadge */}
      <ServicesDiscoveryCTA />
    </React.Fragment>
  );
};

export default ServicesPage;
