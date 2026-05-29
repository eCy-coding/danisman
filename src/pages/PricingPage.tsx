/**
 * L1-8 — /pricing page
 *
 * 5 sections: Hero → 3 Tier cards → Feature matrix → Interactive quiz → FAQ
 * USD retainer pricing (Starter / Growth / Enterprise).
 * Keeps existing SEO, Calendly, and analytics infrastructure.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Helmet } from '@/lib/seo-helmet';
import { motion } from 'motion/react';
import { Check, X, ArrowRight, Sparkles, Zap, Crown, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeIn } from '../components/common/FadeIn';
import { PageWrapper } from '../components/layout/PageWrapper';
import { buildCanonical } from '@/i18n/canonical';
import { trackEvent } from '../lib/analytics';
import { JsonLd } from '../components/seo/JsonLd';
import { buildFaqSchema, buildBreadcrumbSchema } from '../lib/structured-data';
import { getCalendlyCta, hasExternalCalendly } from '../lib/cta/calendly';
import { LazyMount } from '../components/common/LazyMount';
import { PricingQuiz } from '@/components/pricing/PricingQuiz';
import { PRICING_TIERS, FEATURE_MATRIX, PRICING_FAQS, type TierId } from '@/data/pricing-tiers';

const CalendlyEmbed = React.lazy(() =>
  import('../components/booking/CalendlyEmbed').then((m) => ({ default: m.CalendlyEmbed })),
);

const TIER_ICONS: Record<TierId, React.ReactNode> = {
  starter: <Sparkles className="w-5 h-5" />,
  growth: <Zap className="w-5 h-5" />,
  enterprise: <Crown className="w-5 h-5" />,
};

const CellValue: React.FC<{ v: boolean | string }> = ({ v }) => {
  if (v === true) return <Check className="w-5 h-5 text-emerald-400 mx-auto" aria-label="dahil" />;
  if (v === false) return <X className="w-5 h-5 text-slate-600 mx-auto" aria-label="dahil değil" />;
  return <span className="text-slate-200 text-sm font-medium">{v}</span>;
};

export const PricingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const tierRefs = useRef<Record<TierId, HTMLElement | null>>({
    starter: null,
    growth: null,
    enterprise: null,
  });

  const handleQuizResult = useCallback((tierId: TierId) => {
    trackEvent('Pricing', 'QuizResult', tierId);
    setTimeout(() => {
      tierRefs.current[tierId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  return (
    <React.Fragment>
      <Helmet>
        <title>Fiyatlandırma — Starter, Growth, Enterprise | eCyPro Premium Consulting</title>
        <meta
          name="description"
          content="eCyPro şeffaf USD fiyatlandırma: Starter 15K-25K, Growth 25K-50K, Enterprise custom. Sonuç bazlı retainer model. Founder Emre Can Yalçın her tier'da doğrudan eşlik eder."
        />
        <link rel="canonical" href={buildCanonical('/pricing', 'tr')} />
        <meta property="og:title" content="Fiyatlandırma — Starter, Growth, Enterprise | eCyPro" />
        <meta
          property="og:description"
          content="Saat satmıyoruz — sonuç ve milestone bazlı retainer modeli."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.ecypro.com/pricing" />
        <meta property="og:image" content="https://www.ecypro.com/og/pricing.png" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fiyatlandırma — Starter, Growth, Enterprise | eCyPro" />
        <meta
          name="twitter:description"
          content="Şeffaf USD fiyatlandırma: Starter, Growth, Enterprise. Sonuç bazlı retainer."
        />
        <meta name="twitter:image" content="https://www.ecypro.com/og/pricing.png" />
      </Helmet>

      <JsonLd
        data={buildFaqSchema({
          questions: PRICING_FAQS.map((f) => ({ q: f.question, a: f.answer })),
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Anasayfa', url: 'https://www.ecypro.com/' },
          { name: 'Fiyatlandırma', url: 'https://www.ecypro.com/pricing' },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'eCyPro Stratejik Danışmanlık',
          provider: {
            '@type': 'ProfessionalService',
            name: 'eCyPro Premium Consulting',
            url: 'https://www.ecypro.com',
          },
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Danışmanlık Paketleri',
            itemListElement: PRICING_TIERS.map((tier) => ({
              '@type': 'Offer',
              name: tier.name,
              description: tier.tagline,
              priceSpecification: {
                '@type': 'PriceSpecification',
                price: tier.priceLabel,
                priceCurrency: 'USD',
              },
              url: `https://www.ecypro.com/pricing`,
            })),
          },
        }}
      />

      <PageWrapper className="bg-neutral pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* ── Section 1: Hero ─────────────────────────────────────────── */}
          <section aria-labelledby="pricing-hero-heading" className="text-center mb-24">
            <FadeIn immediate>
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-400 mb-4">
                FİYATLANDIRMA
              </p>
              <h1
                id="pricing-hero-heading"
                className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight"
              >
                Şeffaf Fiyatlama, Sahaya Hızla İniş
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                Saat satmıyoruz. Sonuç ve milestone bazlı retainer modeli. Founder Emre Can Yalçın
                her tier&apos;da doğrudan eşlik eder.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/discovery"
                  onClick={() => trackEvent('Pricing', 'HeroCta', 'discovery')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-neutral font-bold hover:bg-amber-400 transition-colors"
                >
                  Ücretsiz Tanışma Toplantısı
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:border-white/40 transition-colors text-sm font-medium"
                >
                  Hangisi bana uygun?
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </FadeIn>
          </section>

          {/* ── Section 2: 3 Tier cards ──────────────────────────────────── */}
          <section aria-labelledby="tier-grid-heading" className="mb-24">
            <h2 id="tier-grid-heading" className="sr-only">
              Fiyatlandırma Paketleri
            </h2>
            <div
              className="grid md:grid-cols-3 gap-6 lg:gap-8"
              role="list"
              aria-label="Fiyatlandırma paketleri"
            >
              {PRICING_TIERS.map((tier, idx) => {
                const sharedCardClass = `relative rounded-3xl border p-8 flex flex-col ${
                  tier.highlight
                    ? 'bg-linear-to-b from-amber-500/15 to-white/5 border-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.12)]'
                    : 'bg-white/5 border-white/10'
                }`;
                const ctaInfo = getCalendlyCta('pricing-tier', {
                  'data-tier': tier.id,
                  'data-plan': tier.id,
                });
                const ctaClass = `w-full text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  tier.highlight
                    ? 'bg-amber-500 text-neutral hover:bg-amber-400'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`;

                return (
                  <motion.article
                    key={tier.id}
                    role="listitem"
                    ref={(el) => {
                      tierRefs.current[tier.id] = el;
                    }}
                    data-testid={`pricing-tier-${tier.id}`}
                    data-highlight={tier.highlight ? 'true' : 'false'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={sharedCardClass}
                  >
                    {tier.highlight && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-neutral text-xs font-bold uppercase tracking-wider"
                        data-testid="most-popular-badge"
                      >
                        En Popüler
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                      {TIER_ICONS[tier.id]}
                      <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">{tier.tagline}</p>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        {tier.priceLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-8">{tier.minTerm}</p>
                    <ul className="space-y-3 mb-8 grow" aria-label={`${tier.name} özellikleri`}>
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                          <Check
                            className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {hasExternalCalendly() ? (
                      <a
                        href={ctaInfo.href}
                        target={ctaInfo.target}
                        rel={ctaInfo.rel}
                        {...ctaInfo.dataAttrs}
                        onClick={() => trackEvent('Pricing', 'CtaClick', tier.id)}
                        data-testid={`pricing-cta-${tier.id}`}
                        className={ctaClass}
                      >
                        <span>{tier.cta}</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link
                        to={tier.ctaHref}
                        onClick={() => trackEvent('Pricing', 'CtaClick', tier.id)}
                        data-testid={`pricing-cta-${tier.id}`}
                        className={ctaClass}
                      >
                        <span>{tier.cta}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </motion.article>
                );
              })}
            </div>
          </section>

          {/* ── Section 3: Feature matrix ─────────────────────────────────── */}
          <section aria-labelledby="matrix-heading" className="mb-24">
            <h2
              id="matrix-heading"
              className="text-3xl font-serif font-bold text-white text-center mb-10"
            >
              Detaylı Karşılaştırma
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead className="sticky top-20 z-30 bg-neutral shadow-[0_1px_0_0_rgba(255,255,255,0.08)]">
                  <tr>
                    <th scope="col" className="text-left p-4 text-slate-400 font-semibold">
                      Özellik
                    </th>
                    {PRICING_TIERS.map((tier) => (
                      <th key={tier.id} scope="col" className="p-4 text-white font-semibold">
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_MATRIX.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="p-4 text-slate-300">{row.feature}</td>
                      <td className="p-4 text-center">
                        <CellValue v={row.starter} />
                      </td>
                      <td className="p-4 text-center">
                        <CellValue v={row.growth} />
                      </td>
                      <td className="p-4 text-center">
                        <CellValue v={row.enterprise} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Section 4: Interactive Quiz ───────────────────────────────── */}
          <section
            id="quiz-section"
            aria-labelledby="quiz-heading"
            className="mb-24 max-w-2xl mx-auto"
          >
            <h2
              id="quiz-heading"
              className="text-3xl font-serif font-bold text-white text-center mb-4"
            >
              Hangisi Size Uygun?
            </h2>
            <p className="text-slate-400 text-center mb-10">
              5 soruda ideal tier&apos;ınızı keşfedin.
            </p>
            <PricingQuiz onResult={handleQuizResult} />
          </section>

          {/* ── Section 5: FAQ ────────────────────────────────────────────── */}
          <section aria-labelledby="faq-heading" className="mb-20 max-w-3xl mx-auto">
            <h2
              id="faq-heading"
              className="text-3xl font-serif font-bold text-white text-center mb-10"
            >
              Sıkça Sorulan Sorular
            </h2>
            <div className="space-y-3">
              {PRICING_FAQS.map((faq, i) => {
                const open = openFaq === i;
                const panelId = `faq-panel-${i}`;
                const triggerId = `faq-trigger-${i}`;
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
                  >
                    <button
                      type="button"
                      id={triggerId}
                      className="w-full flex items-center justify-between p-5 text-left text-white font-medium hover:bg-white/5 transition-colors"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => {
                        setOpenFaq(open ? null : i);
                        if (!open) trackEvent('Pricing', 'FaqOpen', String(i));
                      }}
                      data-testid={`faq-trigger-${i}`}
                    >
                      <span>{faq.question}</span>
                      <span
                        aria-hidden="true"
                        className={`transition-transform text-amber-400 ${open ? 'rotate-45' : ''}`}
                      >
                        +
                      </span>
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      hidden={!open}
                      className="px-5 pb-5 text-slate-300 text-sm leading-relaxed"
                    >
                      {faq.answer}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── CTA strip ────────────────────────────────────────────────── */}
          <section className="rounded-3xl p-10 md:p-14 text-center bg-linear-to-br from-amber-500/15 via-white/5 to-amber-500/5 border border-white/10 mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
              Hazır mısınız?
            </h2>
            <p className="text-slate-300 mb-8">30 dakika ücretsiz keşif görüşmesi.</p>
            {(() => {
              const cta = getCalendlyCta('pricing-final');
              const cls =
                'inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-neutral font-bold hover:bg-amber-400 transition-all';
              return hasExternalCalendly() ? (
                <a
                  href={cta.href}
                  target={cta.target}
                  rel={cta.rel}
                  {...cta.dataAttrs}
                  onClick={() => trackEvent('Pricing', 'FinalCtaClick')}
                  className={cls}
                >
                  Görüşme Ayarlayın
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <Link
                  to={cta.href}
                  {...cta.dataAttrs}
                  onClick={() => trackEvent('Pricing', 'FinalCtaClick')}
                  className={cls}
                >
                  Görüşme Ayarlayın
                  <ArrowRight className="w-4 h-4" />
                </Link>
              );
            })()}
          </section>

          {/* ── Calendly embed ───────────────────────────────────────────── */}
          <section className="rounded-3xl p-6 md:p-8 bg-white/5 border border-white/10">
            <header className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
                Hemen Görüşme Planlayın
              </h2>
              <p className="text-slate-300">
                30 dakika ücretsiz keşif görüşmesi — uygun zamanı siz seçin.
              </p>
            </header>
            <LazyMount placeholderHeight={680}>
              <CalendlyEmbed source="pricing-page-bottom" heightPx={680} />
            </LazyMount>
          </section>
        </div>
      </PageWrapper>
    </React.Fragment>
  );
};

export default PricingPage;
