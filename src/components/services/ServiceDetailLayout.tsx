/**
 * P49 — ServiceDetailLayout v2 (UI/UX deep refinement).
 *
 * P47'de 16-section data-driven layout kuruldu. P49'da:
 *   - Hero: 2-column with ServiceIllustration (sağda), refined badge above title
 *   - Outcomes: KPI hero numbers (animated counter, IntersectionObserver triggered)
 *   - Methodology: numbered timeline with vertical connector + phase progression
 *   - Deliverables: refined card grid with iconography
 *   - Investment: prominent pricing display + payment plan accordion
 *   - Trust: large quote treatment + anonymized client context
 *   - FAQ: accessible accordion with smooth expand
 *   - Assessment: numbered list with rubric callout
 *   - Sticky bottom-right CTA (scroll-triggered) on desktop
 *   - Premium spacing + typography refinement
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Target,
  Compass,
  Wrench,
  Sprout,
  Recycle,
  ChevronDown,
  CircleDollarSign,
  Calendar,
  Sparkles,
  X,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { ServiceContent } from '../../data/service-content';
import { SERVICES } from '../../data/services';
import { JsonLd } from '../seo/JsonLd';
import { ServiceIllustration } from './ServiceIllustration';
import { LifecycleNav } from './LifecycleNav';
import { DetailSectionNav, type DetailSection } from './DetailSectionNav';
import { getCtaVariants } from '@/data/cta-variants';
import { useInView, useCountUp } from '../../lib/animations';
import { useServiceOverride } from '../../hooks/useServiceOverride';
import { StrategicMaturityLadder } from './widgets/StrategicMaturityLadder';
import { DealPipelineVisualizer } from './widgets/DealPipelineVisualizer';
import { GenerationalTransitionTimeline } from './widgets/GenerationalTransitionTimeline';
import { CustomerSegmentQuiz } from './widgets/CustomerSegmentQuiz';
import { OrgDesignMaturity } from './widgets/OrgDesignMaturity';
import { CrisisReadinessMatrix } from './widgets/CrisisReadinessMatrix';
import { AIMaturityRadar } from './widgets/AIMaturityRadar';
import { DigitalReadinessScorecard } from './widgets/DigitalReadinessScorecard';
import { KVKKComplianceChecker } from './widgets/KVKKComplianceChecker';
import { ESGScoreCard } from './widgets/ESGScoreCard';
import { IncentiveEligibilityChecker } from './widgets/IncentiveEligibilityChecker';
import { MacroExposureDashboard } from './widgets/MacroExposureDashboard';
import { MarketConcentrationAnalyzer } from './widgets/MarketConcentrationAnalyzer';
import { UnionEngagementMatrix } from './widgets/UnionEngagementMatrix';
import { EmploymentIncentiveCalculator } from './widgets/EmploymentIncentiveCalculator';
import { EmployerBrandHealth } from './widgets/EmployerBrandHealth';
import { MarketFeasibilityMatrix } from './widgets/MarketFeasibilityMatrix';
import { CountryRiskRadar } from './widgets/CountryRiskRadar';
import { UrbanReadinessScore } from './widgets/UrbanReadinessScore';
import { RegulatoryStakeholderMap } from './widgets/RegulatoryStakeholderMap';

const PHASE_ICONS: React.ComponentType<{ size?: number; className?: string }>[] = [
  Compass,
  Wrench,
  Sprout,
  Recycle,
  Sparkles,
];

interface ServiceDetailLayoutProps {
  content: ServiceContent;
  fallbackTitle: string;
  fallbackDescription: string;
}

/**
 * "%32 artış" / "₺4.2M tasarruf" / "18 ay" gibi string'lerden ilk numerik
 * değeri çıkar; KPI counter için kullanılır. Yoksa null.
 */
function extractFirstNumber(s: string): { value: number; suffix: string; prefix: string } | null {
  const match = s.match(/(₺|%|\$|€)?\s*([\d.,]+)\s*([a-zA-ZçÇğĞıİöÖşŞüÜ%]*)/);
  if (!match || !match[2]) return null;
  const prefix = match[1] || '';
  const raw = match[2].replace(/[.,]/g, '');
  const value = parseInt(raw, 10);
  if (!Number.isFinite(value)) return null;
  const suffix = match[3] || '';
  return { value, prefix, suffix };
}

const KpiCard: React.FC<{ result: string; index: number }> = ({ result, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, threshold: 0.3 });
  const num = extractFirstNumber(result);
  const animated = useCountUp(num?.value ?? 0, 1400, inView);

  // Display: prefix + animated number + suffix + rest of sentence
  const display = num ? `${num.prefix}${animated}${num.suffix}` : null;
  const rest = num ? result.replace(/^\W*[\d.,]+\W*[a-zA-ZçÇğĞıİöÖşŞüÜ%]*/, '').trim() : result;

  return (
    <div
      ref={ref}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-secondary/30 transition-colors flex flex-col"
    >
      {display && (
        <div className="text-4xl md:text-5xl font-serif font-bold text-white mb-3 tracking-tight">
          {display}
          <span className="ml-1 text-secondary">↗</span>
        </div>
      )}
      <p className="text-slate-300 text-sm leading-relaxed flex-1">{display ? rest : result}</p>
      <div className="mt-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">
        Sonuç #{index + 1}
      </div>
    </div>
  );
};

const FadeUpSection: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {children}
    </div>
  );
};

const StickyCta: React.FC<{ primaryText: string }> = ({ primaryText }) => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:right-8 z-40 pointer-events-none">
      <div className="md:max-w-md mx-auto md:ml-auto pointer-events-auto bg-secondary text-neutral rounded-2xl shadow-2xl border border-secondary/30 px-5 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Sparkles size={18} className="text-neutral flex-shrink-0" />
        <Link to="/contact" className="flex-1 font-semibold text-sm leading-tight hover:underline">
          {primaryText}
          <span className="block text-xs opacity-75 mt-0.5 font-normal">
            Discovery Call · 45 dk ücretsiz
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Kapat"
          className="flex-shrink-0 inline-flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-full hover:bg-black/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export const ServiceDetailLayout: React.FC<ServiceDetailLayoutProps> = ({
  content,
  fallbackTitle,
  fallbackDescription,
}) => {
  // P63.B — Admin canlı override fetcher (Redis-backed, public endpoint)
  const override = useServiceOverride(content?.slug ?? '').data;

  const title = override?.heroTitle || content?.hero?.title || fallbackTitle;
  const subtitle = override?.heroSubtitle || content?.hero?.subtitle || fallbackDescription;
  const valueProp = override?.valueProp || content?.hero?.valueProp;
  const primaryCta = content?.hero?.primaryCtaText || 'Ücretsiz Strateji Görüşmesi Al';

  const relatedServices = (content?.related || [])
    .map((slug) => SERVICES.find((s) => s.link?.endsWith(`/${slug}`)))
    .filter((s): s is (typeof SERVICES)[number] => Boolean(s));

  // SVC P7 — sticky in-page nav: only sections that actually render get a pill.
  const sectionNavItems = [
    content?.problem?.painPoints?.length ? { id: 'problem', label: 'Problemler' } : null,
    content?.outcomes?.results?.length ? { id: 'outcomes', label: 'Sonuçlar' } : null,
    content?.methodology?.phases?.length ? { id: 'methodology', label: 'Metodoloji' } : null,
    content?.deliverables?.artifacts?.length ? { id: 'deliverables', label: 'Çıktılar' } : null,
    content?.timeline?.milestones?.length ? { id: 'timeline', label: 'Takvim & Yatırım' } : null,
    content?.faq?.items?.length ? { id: 'faq', label: 'SSS' } : null,
    content?.assessment?.questions?.length ? { id: 'assessment', label: 'Hızlı Teşhis' } : null,
  ].filter((s): s is DetailSection => Boolean(s));

  // SVC P7 — the 63 authored CTA variants were never consumed; the footer now
  // renders the per-service 'value' flavor (default copy for uncovered slugs).
  const ctaVariant = getCtaVariants(content.slug).variants.value;

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: title,
    provider: {
      '@type': 'Organization',
      name: 'eCyPro Premium Consulting',
      url: 'https://www.ecypro.com',
    },
    areaServed: { '@type': 'Country', name: 'Turkey' },
    description: valueProp || subtitle,
    ...(content?.investment?.range
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'TRY',
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: content.investment.range,
              priceCurrency: 'TRY',
            },
          },
        }
      : {}),
  };

  const faqSchema = content?.faq?.items?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.faq.items.map((it) => ({
          '@type': 'Question',
          name: it.q,
          acceptedAnswer: { '@type': 'Answer', text: it.a },
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-neutral text-slate-300">
      <JsonLd data={serviceSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* ── Hero (2-column with illustration) ── */}
      <section className="relative pt-32 pb-16 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(37,99,235,0.12),transparent)] pointer-events-none" />
        <div
          className="absolute top-20 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto">
          <nav className="text-sm text-slate-500 mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-secondary transition-colors">
              Anasayfa
            </Link>
            <span className="mx-2 text-slate-700">/</span>
            <Link to="/services" className="hover:text-secondary transition-colors">
              Hizmetler
            </Link>
            <span className="mx-2 text-slate-700">/</span>
            <span className="text-slate-300">{title}</span>
          </nav>

          <div className="grid md:grid-cols-[1.5fr_1fr] gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-[10px] font-bold tracking-[0.25em] text-secondary uppercase mb-6">
                <Sparkles size={11} aria-hidden="true" />
                Premium Consulting
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-[1.05] tracking-tight text-balance">
                {title}
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-6">{subtitle}</p>
              {valueProp && (
                <p className="text-lg text-slate-300 max-w-2xl leading-relaxed mb-10 border-l-4 border-secondary pl-5">
                  {valueProp}
                </p>
              )}

              <LifecycleNav slug={content.slug} className="mb-8" />

              <div className="flex flex-wrap gap-4 items-center mb-10">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-all hover:translate-x-0.5 shadow-lg shadow-secondary/20"
                >
                  {primaryCta} <ArrowRight size={18} />
                </Link>
                <Link
                  to="/methodology"
                  className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 hover:border-white/30 transition-colors"
                >
                  Metodolojiyi İncele
                </Link>
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
                <li className="inline-flex items-center gap-2">
                  <Clock size={14} className="text-secondary" /> 5+ yıl pratik
                </li>
                <li className="inline-flex items-center gap-2">
                  <Target size={14} className="text-secondary" /> 120+ stratejik karar
                </li>
                <li className="inline-flex items-center gap-2">
                  <ShieldCheck size={14} className="text-secondary" /> KVKK & GDPR uyumlu
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-secondary" /> 24 saat içinde yanıt
                </li>
              </ul>
            </div>

            {/* Service illustration */}
            <div className="hidden md:flex justify-center items-center">
              <div className="relative w-full max-w-sm aspect-square">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-primary/5 rounded-3xl blur-2xl" />
                <ServiceIllustration slug={content.slug} className="relative w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {sectionNavItems.length > 0 && (
        <div className="px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <DetailSectionNav sections={sectionNavItems} />
          </div>
        </div>
      )}

      {/* ── atom-11-2: Bu hizmet kimin için? — 3 persona card ── */}
      <FadeUpSection>
        <section
          aria-labelledby="personas-heading"
          className="py-16 px-6 md:px-12 border-t border-white/5"
          data-testid="service-personas"
        >
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
                Hedef Kitle
              </div>
              <h2
                id="personas-heading"
                className="text-3xl md:text-4xl font-serif font-bold text-white"
              >
                Bu hizmet kimin için?
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {/* Persona 1: CEO / Founder */}
              <article
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-secondary/30 transition-colors"
                data-testid="persona-ceo"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4">
                  <Target size={20} className="text-secondary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">CEO / Kurucu Ortak</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Stratejik dönüşüm kararlarını bizzat yöneten, bağımsız ve tarafsız üst-düzey
                  uzmanlık arayan üst yönetim.
                </p>
              </article>
              {/* Persona 2: CFO / COO */}
              <article
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-secondary/30 transition-colors"
                data-testid="persona-cfo"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4">
                  <TrendingUp size={20} className="text-secondary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">CFO / COO</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Finansal model, operasyonel verimlilik veya regülasyon uyumu konularında
                  ölçülebilir çıktı isteyen operasyonel liderler.
                </p>
              </article>
              {/* Persona 3: Yönetim Kurulu / Aile Holdingi */}
              <article
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-secondary/30 transition-colors"
                data-testid="persona-board"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4">
                  <Users size={20} className="text-secondary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Yönetim Kurulu / Holdingler</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Kurumsal yönetişim, nesil geçişi veya yatırımcı ilişkileri konusunda bağımsız
                  danışmanlık bekleyen kurumsal yapılar ve aile holdingleri.
                </p>
              </article>
            </div>
          </div>
        </section>
      </FadeUpSection>

      {/* ── Problem ── */}
      {content?.problem?.painPoints?.length ? (
        <FadeUpSection>
          <section
            id="problem"
            className="scroll-mt-36 py-16 px-6 md:px-12 border-t border-white/5"
          >
            <div className="max-w-6xl mx-auto">
              <div className="mb-10">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
                  Problem
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">
                  {content.problem.title}
                </h2>
              </div>
              <ul className="grid md:grid-cols-2 gap-5">
                {content.problem.painPoints.map((p, i) => (
                  <li
                    key={i}
                    className="flex gap-5 p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-colors"
                  >
                    <span className="text-4xl font-serif text-secondary/60 leading-none mt-1 flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-slate-200 leading-relaxed">{p}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </FadeUpSection>
      ) : null}

      {/* ── Outcomes (KPI grid) ── */}
      {content?.outcomes?.results?.length ? (
        <FadeUpSection>
          <section
            id="outcomes"
            className="scroll-mt-36 py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent to-secondary/[0.03]"
          >
            <div className="max-w-6xl mx-auto">
              <div className="mb-10">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400 mb-3">
                  Ölçülebilir Sonuçlar
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">
                  {content.outcomes.title}
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {content.outcomes.results.map((r, i) => (
                  <KpiCard key={i} result={r} index={i} />
                ))}
              </div>
            </div>
          </section>
        </FadeUpSection>
      ) : null}

      {/* ── Per-slug custom interactive widget (P49 S1-S21) ── */}
      {content.slug === 'strategic-transformation' && <StrategicMaturityLadder />}
      {content.slug === 'mergers-acquisitions' && <DealPipelineVisualizer />}
      {content.slug === 'family-business' && <GenerationalTransitionTimeline />}
      {content.slug === 'neuromarketing' && <CustomerSegmentQuiz />}
      {content.slug === 'hr-transformation' && <OrgDesignMaturity />}
      {content.slug === 'crisis-management' && <CrisisReadinessMatrix />}
      {content.slug === 'ai-analytics' && <AIMaturityRadar />}
      {content.slug === 'digital-strategy' && <DigitalReadinessScorecard />}
      {content.slug === 'data-governance' && <KVKKComplianceChecker />}
      {content.slug === 'esg-strategy' && <ESGScoreCard />}
      {content.slug === 'investment-incentives' && <IncentiveEligibilityChecker />}
      {content.slug === 'macro-risk' && <MacroExposureDashboard />}
      {content.slug === 'competition-economics' && <MarketConcentrationAnalyzer />}
      {content.slug === 'industrial-relations' && <UnionEngagementMatrix />}
      {content.slug === 'payroll-audit' && <EmploymentIncentiveCalculator />}
      {content.slug === 'employer-branding' && <EmployerBrandHealth />}
      {content.slug === 'market-entry' && <MarketFeasibilityMatrix />}
      {content.slug === 'global-intelligence' && <CountryRiskRadar />}
      {content.slug === 'smart-cities' && <UrbanReadinessScore />}
      {content.slug === 'government-relations' && <RegulatoryStakeholderMap />}

      {/* ── Methodology (vertical timeline) ── */}
      {content?.methodology?.phases?.length ? (
        <FadeUpSection>
          <section
            id="methodology"
            className="scroll-mt-36 py-16 px-6 md:px-12 border-t border-white/5"
          >
            <div className="max-w-5xl mx-auto">
              <div className="mb-10">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
                  Metodoloji
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
                  {content.methodology.title}
                </h2>
                <p className="text-slate-400 max-w-2xl">
                  5-katmanlı engagement çerçevesinde adım adım akış.
                </p>
              </div>
              <div className="relative">
                {/* Vertical connector line */}
                <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-secondary/40 via-white/10 to-transparent" />
                <div className="space-y-6">
                  {content.methodology.phases.map((phase, i) => {
                    const Icon = PHASE_ICONS[i % PHASE_ICONS.length] ?? Sparkles;
                    return (
                      <div
                        key={i}
                        className="relative flex gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-colors group"
                      >
                        <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                          <Icon size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                            <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
                              {phase.duration}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{phase.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </FadeUpSection>
      ) : null}

      {/* ── Deliverables ── */}
      {content?.deliverables?.artifacts?.length ? (
        <FadeUpSection>
          <section
            id="deliverables"
            className="scroll-mt-36 py-16 px-6 md:px-12 border-t border-white/5 bg-white/[0.02]"
          >
            <div className="max-w-6xl mx-auto">
              <div className="mb-10">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
                  Çıktılar
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">
                  {content.deliverables.title}
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.deliverables.artifacts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-5 bg-white/5 border border-white/10 rounded-xl hover:border-secondary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={18} className="text-secondary" />
                    </div>
                    <span className="text-slate-200 leading-relaxed text-sm">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeUpSection>
      ) : null}

      {/* ── Timeline + Investment side-by-side ── */}
      {(content?.timeline?.milestones?.length || content?.investment?.range) && (
        <FadeUpSection>
          <section
            id="timeline"
            className="scroll-mt-36 py-16 px-6 md:px-12 border-t border-white/5"
          >
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
              {content?.timeline?.milestones?.length ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar size={22} className="text-secondary" />
                    <h2 className="text-2xl font-serif font-bold text-white">
                      Süre & Milestone'lar
                    </h2>
                  </div>
                  <p className="text-sm text-slate-400 mb-6 pb-6 border-b border-white/5">
                    Toplam:{' '}
                    <strong className="text-white text-base">
                      {content.timeline.totalDuration}
                    </strong>
                  </p>
                  <ol className="space-y-4 list-none">
                    {content.timeline.milestones.map((m, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center text-xs font-bold text-secondary mt-0.5">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                            {m.week}
                          </div>
                          <div className="text-slate-200 leading-snug">{m.name}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {content?.investment?.range ? (
                <div className="bg-gradient-to-br from-secondary/10 to-primary/5 border border-secondary/20 rounded-2xl p-8 relative overflow-hidden">
                  <div
                    className="absolute -top-12 -right-12 w-40 h-40 bg-secondary/20 rounded-full blur-3xl pointer-events-none"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <CircleDollarSign size={22} className="text-secondary" />
                      <h2 className="text-2xl font-serif font-bold text-white">Yatırım</h2>
                    </div>
                    <p className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                      {content.investment.range}
                    </p>
                    <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                      {content.investment.model}
                    </p>
                    <div className="pt-4 mt-4 border-t border-white/10">
                      <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                        Ödeme Planı
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {content.investment.paymentPlan}
                      </p>
                    </div>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-1 mt-6 text-sm text-secondary hover:underline font-semibold"
                    >
                      Tüm paketleri karşılaştır <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </FadeUpSection>
      )}

      {/* ── Trust / Anonymized Case ── */}
      {content?.trust?.anonymizedExample ? (
        <FadeUpSection>
          <section className="py-20 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent">
            <div className="max-w-4xl mx-auto">
              <div className="text-xs font-bold tracking-[0.25em] uppercase text-secondary mb-5">
                Anonim Vaka Örneği
              </div>
              <div className="relative">
                <div className="absolute -top-6 -left-2 text-7xl md:text-8xl font-serif text-secondary/30 leading-none select-none">
                  &ldquo;
                </div>
                <blockquote className="text-xl md:text-2xl font-serif text-white leading-relaxed pl-8 italic">
                  {content.trust.anonymizedExample}
                </blockquote>
              </div>
              {content.trust.caseStudySlug && (
                <Link
                  to={`/case-studies/${content.trust.caseStudySlug}`}
                  className="inline-flex items-center gap-1 mt-8 ml-8 text-sm text-secondary hover:underline font-semibold"
                >
                  İlgili vaka analizini incele <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </section>
        </FadeUpSection>
      ) : null}

      {/* ── FAQ ── */}
      {content?.faq?.items?.length ? (
        <FadeUpSection>
          <section id="faq" className="scroll-mt-36 py-16 px-6 md:px-12 border-t border-white/5">
            <div className="max-w-4xl mx-auto">
              <div className="mb-10">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
                  SSS
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">
                  Sıkça Sorulan Sorular
                </h2>
              </div>
              <div className="space-y-3">
                {content.faq.items.map((it, i) => (
                  <details
                    key={i}
                    className="group bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer hover:border-white/20 transition-colors"
                  >
                    <summary className="font-semibold text-white flex justify-between items-start gap-4 list-none">
                      <span className="text-base md:text-lg">{it.q}</span>
                      <ChevronDown
                        size={18}
                        className="text-secondary flex-shrink-0 mt-1.5 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <p className="mt-4 text-slate-300 leading-relaxed text-sm md:text-base">
                      {it.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </FadeUpSection>
      ) : null}

      {/* ── Assessment ── */}
      {content?.assessment?.questions?.length ? (
        <FadeUpSection>
          <section
            id="assessment"
            className="scroll-mt-36 py-16 px-6 md:px-12 border-t border-white/5 bg-white/[0.02]"
          >
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
                  Mini Teşhis
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
                  {content.assessment.title}
                </h2>
                <p className="text-slate-400">
                  Aşağıdaki soruları kendi durumunuza göre evet/hayır olarak değerlendirin.
                </p>
              </div>
              <ol className="space-y-3 mb-8 list-none">
                {content.assessment.questions.map((q, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center text-xs font-bold text-secondary mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-slate-200 leading-relaxed">{q}</span>
                  </li>
                ))}
              </ol>
              <div className="p-6 bg-secondary/5 border border-secondary/20 rounded-2xl">
                <div className="text-xs font-bold tracking-widest uppercase text-secondary mb-3">
                  Skor Yorumu
                </div>
                <p className="text-slate-200 whitespace-pre-line text-sm md:text-base leading-relaxed">
                  {content.assessment.rubric}
                </p>
              </div>
            </div>
          </section>
        </FadeUpSection>
      ) : null}

      {/* ── Related Services ── */}
      {relatedServices.length ? (
        <FadeUpSection>
          <section className="py-16 px-6 md:px-12 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
              <div className="mb-10">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
                  İlgili Hizmetler
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white">
                  Bu engagement'la birlikte değerlendirilebilecek diğer servisler
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {relatedServices.map((s) => (
                  <Link
                    key={s.id}
                    to={s.link}
                    className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-secondary/40 hover:bg-white/8 transition-all"
                  >
                    <h3 className="text-lg font-bold text-white mb-3 group-hover:text-secondary transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                      {s.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold">
                      Detayları gör{' '}
                      <ArrowRight
                        size={12}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </FadeUpSection>
      ) : null}

      {/* ── CTA Footer ── */}
      <section className="py-24 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent to-secondary/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-4">
            Engagement Adımı
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-5 text-balance">
            {ctaVariant.headline}
          </h2>
          <p className="text-slate-400 mb-10 leading-relaxed text-lg">{ctaVariant.microcopy}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-all hover:translate-x-0.5 shadow-lg shadow-secondary/20"
            >
              {ctaVariant.buttonLabel} <ArrowRight size={18} />
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              Önce Soruları Oku
            </Link>
          </div>
        </div>
      </section>

      {/* Sticky bottom CTA */}
      <StickyCta primaryText={primaryCta} />
    </div>
  );
};
