import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Check, X, ArrowRight, Sparkles, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeIn } from '../components/common/FadeIn';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useTranslation } from '@/lib/i18n';
import { trackEvent } from '../lib/analytics';
import { JsonLd } from '../components/seo/JsonLd';
import { useCurrencyStore } from '../stores/currencyStore';
import { CurrencySwitcher } from '../components/ui/CurrencySwitcher';
import { buildFaqSchema, buildBreadcrumbSchema } from '../lib/structured-data';
import { getCalendlyCta, hasExternalCalendly } from '../lib/cta/calendly';
import { LazyMount } from '../components/common/LazyMount';

// Calendly pulls an external widget.js + iframe; intersection-gating it keeps
// that network + main-thread cost off the critical path until the user scrolls
// to the bottom embed, freeing CPU for the above-fold LCP <p>.
const CalendlyEmbed = React.lazy(() =>
  import('../components/booking/CalendlyEmbed').then((m) => ({ default: m.CalendlyEmbed })),
);

// P95 — ROI calculator: 3-input projection (Engagement Audit vs Quarterly
// Retainer cost ↔ projected client return). Lazy because Recharts pulls
// ~50 kB gzip; pricing page can paint before the widget hydrates.
const ROICalculator = React.lazy(() =>
  import('../components/features/roi/ROICalculator').then((m) => ({
    default: m.ROICalculator,
  })),
);

type Billing = 'monthly' | 'annual';

interface Tier {
  id: string;
  name: { tr: string; en: string };
  tagline: { tr: string; en: string };
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  icon: React.ReactNode;
  highlight?: boolean;
  cta: { tr: string; en: string };
  features: { tr: string; en: string }[];
}

// P42: Türk consulting piyasası için kalibre edilmiş 3-tier paket.
// Fiyatlar başlangıç noktasıdır; kapsama göre özelleştirilir.
const TIERS: Tier[] = [
  {
    id: 'starter',
    name: { tr: 'Strateji Oturumu', en: 'Strategy Session' },
    tagline: {
      tr: 'İki saatlik premium audit & yol haritası',
      en: 'Two-hour premium audit & roadmap',
    },
    priceMonthly: 12000,
    priceAnnual: 12000,
    currency: '₺',
    icon: <Sparkles className="w-5 h-5" />,
    cta: { tr: 'Discovery Call ile başla', en: 'Start with Discovery Call' },
    features: [
      { tr: 'Kurum bağlamı keşif çağrısı (30 dk)', en: 'Discovery call (30 min)' },
      { tr: '2 saatlik yönetici atölyesi', en: '2-hour executive workshop' },
      { tr: 'Stratejik yol haritası (özet rapor)', en: 'Strategic roadmap (summary report)' },
      { tr: '30 gün boyunca asenkron e-posta desteği', en: '30-day async email support' },
    ],
  },
  {
    id: 'growth',
    name: { tr: 'Çeyreklik Engagement', en: 'Quarterly Engagement' },
    tagline: {
      tr: '3 ay aktif danışmanlık partnerliği',
      en: '3 months of active advisory partnership',
    },
    priceMonthly: 75000,
    priceAnnual: 75000,
    currency: '₺',
    icon: <Zap className="w-5 h-5" />,
    highlight: true,
    cta: { tr: 'Discovery Call ile başla', en: 'Start with Discovery Call' },
    features: [
      { tr: 'Tüm Strateji Oturumu özellikleri', en: 'Everything in Strategy Session' },
      {
        tr: 'Haftalık çalışma oturumu (yönetim ekibiyle)',
        en: 'Weekly working session (with leadership)',
      },
      { tr: 'Aylık karar raporu + OKR ritmi', en: 'Monthly decision review + OKR cadence' },
      {
        tr: 'Özel danışman erişimi (Slack / e-posta)',
        en: 'Dedicated advisor access (Slack / email)',
      },
      { tr: 'Engagement-sonu retrospektif', en: 'End-of-engagement retrospective' },
    ],
  },
  {
    id: 'enterprise',
    name: { tr: 'Yıllık Partnerlik', en: 'Annual Partnership' },
    tagline: {
      tr: 'Sürdürülebilir transformasyon ortaklığı',
      en: 'Sustainable transformation partnership',
    },
    priceMonthly: 350000,
    priceAnnual: 350000,
    currency: '₺',
    icon: <Crown className="w-5 h-5" />,
    cta: { tr: 'Discovery Call ile başla', en: 'Start with Discovery Call' },
    features: [
      { tr: 'Tüm Çeyreklik Engagement özellikleri', en: 'Everything in Quarterly Engagement' },
      {
        tr: 'Yönetim kurulu / icra düzeyinde sürekli partnerlik',
        en: 'Ongoing board / exec-level partnership',
      },
      { tr: 'Çeyreklik yerinde çalıştay', en: 'Quarterly on-site workshop' },
      {
        tr: 'Kültür mühendisliği programı (opsiyonel modül)',
        en: 'Culture engineering program (optional module)',
      },
      { tr: 'M&A advisory desteği (kapsamlı)', en: 'M&A advisory support (scope-based)' },
      { tr: 'Özel sözleşme + KVKK/DPA çerçevesi', en: 'Custom MSA + GDPR/KVKK framework' },
    ],
  },
];

// Şeffaflık: Listelenen fiyatlar başlangıç noktasıdır.
// Kapsam, süre ve özel modüllere göre teklif özelleştirilir.

const COMPARISON_ROWS = [
  {
    feature: { tr: 'Olgunluk Değerlendirmesi', en: 'Maturity Assessment' },
    starter: true,
    growth: true,
    enterprise: true,
  },
  {
    feature: { tr: 'Aylık strateji görüşmesi', en: 'Monthly strategy call' },
    starter: '1',
    growth: '8',
    enterprise: 'Unlimited',
  },
  {
    feature: { tr: 'Gerçek zamanlı KPI panosu', en: 'Realtime KPI dashboard' },
    starter: false,
    growth: true,
    enterprise: true,
  },
  {
    feature: { tr: 'Özel yol haritası', en: 'Custom roadmap' },
    starter: false,
    growth: true,
    enterprise: true,
  },
  {
    feature: { tr: 'Yanıt SLA', en: 'Response SLA' },
    starter: '48 h',
    growth: '4 h',
    enterprise: '1 h',
  },
  {
    feature: { tr: 'SOC 2 / ISO 27001 danışmanlık', en: 'SOC 2 / ISO 27001 advisory' },
    starter: false,
    growth: false,
    enterprise: true,
  },
  {
    feature: { tr: 'Yerinde çalıştaylar', en: 'On-site workshops' },
    starter: false,
    growth: false,
    enterprise: true,
  },
  {
    feature: { tr: 'KVKK / GDPR DPA', en: 'GDPR / DPA' },
    starter: false,
    growth: 'Standard',
    enterprise: 'Custom',
  },
];

const FAQS = [
  {
    q: { tr: 'Sözleşme süresi nedir?', en: 'What is the contract length?' },
    a: {
      tr: 'Aylık veya yıllık fatura döngüsü seçebilirsiniz; toplam ücret aynı kalır, sadece fatura periyodu farklıdır. Engagement süresi (Strateji Oturumu, Çeyreklik, Yıllık) paket tipiyle belirlenir.',
      en: 'You can choose monthly or annual billing cycles; the total fee stays the same, only the invoice period differs. Engagement length (Strategy Session, Quarterly, Annual) is set by the tier you pick.',
    },
  },
  {
    q: { tr: 'İstediğim zaman iptal edebilir miyim?', en: 'Can I cancel anytime?' },
    a: {
      tr: 'Evet, aylık planlar 30 gün ihbarla iptal edilebilir.',
      en: 'Yes, monthly plans can be cancelled with 30 days notice.',
    },
  },
  {
    q: { tr: 'Ödeme yöntemleri?', en: 'Payment methods?' },
    a: {
      tr: 'Kredi kartı, banka transferi (SEPA) ve özel sözleşmelerde fatura.',
      en: 'Credit card, bank transfer (SEPA), invoice for enterprise.',
    },
  },
  {
    q: { tr: 'Verilerim nerede saklanır?', en: 'Where is my data stored?' },
    a: {
      tr: 'AB içi (Frankfurt) Render + Vercel altyapısı. KVKK + GDPR uyumlu.',
      en: 'EU region (Frankfurt) on Render + Vercel. GDPR/KVKK compliant.',
    },
  },
];

const CellIcon: React.FC<{ v: boolean | string }> = ({ v }) => {
  if (v === true)
    return <Check className="w-5 h-5 text-emerald-400 mx-auto" aria-label="included" />;
  if (v === false)
    return <X className="w-5 h-5 text-slate-600 mx-auto" aria-label="not included" />;
  return <span className="text-slate-200 text-sm font-medium">{v}</span>;
};

export const PricingPage: React.FC = () => {
  const { i18n } = useTranslation();
  const lang: 'tr' | 'en' = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const [billing, setBilling] = useState<Billing>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const t = {
    title: { tr: 'Şeffaf Fiyatlandırma', en: 'Transparent Pricing' },
    subtitle: {
      tr: 'Ölçeklenen işiniz için şeffaf, öngörülebilir danışmanlık paketleri.',
      en: 'Transparent, predictable consulting packages that scale with your business.',
    },
    monthly: { tr: 'Aylık', en: 'Monthly' },
    annual: { tr: 'Yıllık', en: 'Annual' },
    // P45 D1: "2 ay ücretsiz" iddiası kaldırıldı — priceAnnual === priceMonthly
    // olduğu için gerçek bir indirim yok. Toggle sadece fatura periyodu seçimi.
    save: { tr: '', en: '' },
    perMonth: { tr: '/ay', en: '/mo' },
    custom: { tr: 'Özel Teklif', en: 'Custom Quote' },
    compare: { tr: 'Detaylı Karşılaştırma', en: 'Detailed Comparison' },
    feature: { tr: 'Özellik', en: 'Feature' },
    faqTitle: { tr: 'Sıkça Sorulan Sorular', en: 'Frequently Asked Questions' },
    readyTitle: { tr: 'Hazır mısınız?', en: 'Ready to get started?' },
    readySub: {
      tr: '15 dakikalık ücretsiz strateji görüşmesi.',
      en: '15-minute free strategy call.',
    },
    bookCall: { tr: 'Görüşme Ayarlayın', en: 'Book a Call' },
  };

  const { formatPrice } = useCurrencyStore();

  const getPrice = (tier: Tier) => {
    if (tier.priceMonthly === 0) return t.custom[lang];
    // P45 D1: Toggle artık fatura periyodu (aylık vs yıllık) seçimini gösteriyor;
    // fiyat aynı kalır. Eski "annual = priceAnnual / 12" 12x'lik sahte indirim
    // yaratıyordu. priceAnnual ve priceMonthly aynı engagement birim fiyatıdır.
    const baseTRY = tier.priceMonthly;
    return formatPrice(baseTRY);
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{lang === 'tr' ? 'Paketler ve Fiyatlandırma' : 'Packages & Pricing'} | eCyPro</title>
        <meta
          name="description"
          content={
            lang === 'tr'
              ? 'eCyPro engagement paketleri ve şeffaf fiyatlandırma. Discovery, Sprint, Programme ve Retainer modelleri — kapsam, süre ve teslimatlarla.'
              : 'eCyPro engagement packages and transparent pricing. Discovery, Sprint, Programme, and Retainer models — with scope, duration, and deliverables.'
          }
        />
        <link rel="canonical" href="https://ecypro.com/pricing" />
      </Helmet>

      <JsonLd
        data={buildFaqSchema({
          questions: FAQS.map((f) => ({ q: f.q[lang], a: f.a[lang] })),
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
          { name: t.title[lang], url: 'https://ecypro.com/pricing' },
        ])}
      />

      <PageWrapper className="bg-neutral pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            {/* P31-T02: immediate — LCP element <p.text-xl> below */}
            <FadeIn immediate>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight">
                {t.title[lang]}
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                {t.subtitle[lang]}
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  to="/pricing-calculator"
                  data-cta="pricing-calc"
                  data-cta-source="pricing-banner"
                  data-track="cta-click"
                  onClick={() => trackEvent('Pricing', 'Click', 'Pricing Banner Calc')}
                  className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-5 py-2 text-sm text-secondary hover:bg-secondary hover:text-neutral transition-colors font-semibold"
                >
                  {lang === 'tr'
                    ? 'Hangi paket size uygun? — 4 soruda öğrenin'
                    : 'Which package fits? — 4-question calculator'}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </FadeIn>

            {/* Billing + Currency controls */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {/* Currency switcher — right of billing toggle */}
              <CurrencySwitcher />
            </div>

            {/* Billing toggle */}
            <div className="mt-3 inline-flex items-center gap-2 p-1 rounded-full bg-white/5 border border-white/10">
              {(['monthly', 'annual'] as Billing[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    setBilling(b);
                    trackEvent('Pricing', 'BillingToggle', b);
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    billing === b
                      ? 'bg-white text-neutral shadow-lg'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  aria-pressed={billing === b}
                >
                  {t[b][lang]}
                  {b === 'annual' && (
                    <span className="ml-2 text-xs text-emerald-400 font-semibold">
                      {t.save[lang]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tier grid */}
          <div
            className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-24"
            role="list"
            aria-label="Fiyatlandırma paketleri"
          >
            {TIERS.map((tier, idx) => (
              <motion.div
                key={tier.id}
                role="listitem"
                data-testid={`pricing-tier-${tier.id}`}
                data-highlight={tier.highlight ? 'true' : 'false'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative rounded-3xl border p-8 flex flex-col ${
                  tier.highlight
                    ? 'bg-linear-to-b from-primary/20 to-white/5 border-primary/50 shadow-[0_0_60px_rgba(59,130,246,0.15)]'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider">
                    {lang === 'tr' ? 'Önerilen' : 'Recommended'}
                  </div>
                )}
                <div className="flex items-center gap-2 text-primary mb-3">
                  {tier.icon}
                  <h3 className="text-lg font-semibold text-white">{tier.name[lang]}</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6 min-h-10">{tier.tagline[lang]}</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-white tracking-tight">
                    {getPrice(tier)}
                  </span>
                  {tier.priceMonthly > 0 && (
                    <span className="text-sm text-slate-400 ml-2">{t.perMonth[lang]}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8 grow">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                      <Check
                        className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{f[lang]}</span>
                    </li>
                  ))}
                </ul>
                {(() => {
                  const tierMap: Record<string, 'audit' | 'retainer' | 'custom'> = {
                    starter: 'audit',
                    growth: 'retainer',
                    enterprise: 'custom',
                  };
                  const tierKey = tierMap[tier.id] ?? 'audit';
                  const cta = getCalendlyCta('pricing-tier', {
                    'data-tier': tierKey,
                    'data-plan': tier.id,
                  });
                  const sharedClass = `w-full text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    tier.highlight
                      ? 'bg-white text-neutral hover:bg-slate-100'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`;
                  return hasExternalCalendly() ? (
                    <a
                      href={cta.href}
                      target={cta.target}
                      rel={cta.rel}
                      {...cta.dataAttrs}
                      onClick={() => trackEvent('Pricing', 'CtaClick', tier.id)}
                      data-testid={`pricing-cta-${tier.id}`}
                      className={sharedClass}
                    >
                      <span>{tier.cta[lang]}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link
                      to={cta.href}
                      onClick={() => trackEvent('Pricing', 'CtaClick', tier.id)}
                      {...cta.dataAttrs}
                      data-testid={`pricing-cta-${tier.id}`}
                      className={sharedClass}
                    >
                      <span>{tier.cta[lang]}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  );
                })()}
              </motion.div>
            ))}
          </div>

          {/* Comparison table */}
          <section aria-labelledby="compare-heading" className="mb-24">
            <h2
              id="compare-heading"
              className="text-3xl font-serif font-bold text-white text-center mb-10"
            >
              {t.compare[lang]}
            </h2>
            {/* Track C #7 — Sticky thead so column tiers stay visible as the
                user scrolls a long comparison matrix. Navbar above is
                fixed at z-50 (py-3 → ~48px when scrolled, py-6 → ~72px
                idle); thead sits at top-20 (80px) with z-30 so it is
                always anchored just under the navbar without overlap. */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead className="sticky top-20 z-30 bg-neutral shadow-[0_1px_0_0_rgba(255,255,255,0.08)]">
                  <tr className="border-b border-white/10">
                    <th scope="col" className="text-left p-4 text-slate-400 font-semibold">
                      {t.feature[lang]}
                    </th>
                    {TIERS.map((tier) => (
                      <th key={tier.id} scope="col" className="p-4 text-white font-semibold">
                        {tier.name[lang]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="p-4 text-slate-300">{row.feature[lang]}</td>
                      <td className="p-4 text-center">
                        <CellIcon v={row.starter} />
                      </td>
                      <td className="p-4 text-center">
                        <CellIcon v={row.growth} />
                      </td>
                      <td className="p-4 text-center">
                        <CellIcon v={row.enterprise} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* P95 — ROI projeksiyonu (Engagement Audit / Quarterly Retainer / Custom) */}
          <section aria-labelledby="roi-heading" className="mb-20 max-w-4xl mx-auto">
            <h2
              id="roi-heading"
              className="text-3xl font-serif font-bold text-white text-center mb-3"
            >
              ROI Projeksiyonu
            </h2>
            <p className="text-center text-slate-400 mb-8">
              Engagement maliyetinizi 12 aylık beklenen geri dönüşle karşılaştırın.
            </p>
            <LazyMount placeholderHeight={192}>
              <ROICalculator />
            </LazyMount>
          </section>

          {/* FAQ */}
          <section aria-labelledby="faq-heading" className="mb-20 max-w-3xl mx-auto">
            <h2
              id="faq-heading"
              className="text-3xl font-serif font-bold text-white text-center mb-10"
            >
              {t.faqTitle[lang]}
            </h2>
            <div className="space-y-3">
              {FAQS.map((f, i) => {
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
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      <span>{f.q[lang]}</span>
                      <span
                        aria-hidden="true"
                        className={`transition-transform ${open ? 'rotate-45' : ''}`}
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
                      {f.a[lang]}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-3xl p-10 md:p-14 text-center bg-linear-to-br from-primary/20 via-white/5 to-secondary/10 border border-white/10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
              {t.readyTitle[lang]}
            </h2>
            <p className="text-slate-300 mb-8">{t.readySub[lang]}</p>
            {(() => {
              const cta = getCalendlyCta('pricing-final');
              const sharedClass =
                'inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-neutral font-bold hover:bg-slate-100 transition-all';
              return hasExternalCalendly() ? (
                <a
                  href={cta.href}
                  target={cta.target}
                  rel={cta.rel}
                  {...cta.dataAttrs}
                  onClick={() => trackEvent('Pricing', 'FinalCtaClick')}
                  className={sharedClass}
                >
                  <span>{t.bookCall[lang]}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <Link
                  to={cta.href}
                  {...cta.dataAttrs}
                  onClick={() => trackEvent('Pricing', 'FinalCtaClick')}
                  className={sharedClass}
                >
                  <span>{t.bookCall[lang]}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              );
            })()}
          </section>

          {/* P77.B — Calendly inline embed: high-intent users at end of pricing review */}
          <section className="mt-12 rounded-3xl p-6 md:p-8 bg-white/5 border border-white/10">
            <header className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
                {lang === 'tr' ? 'Hemen Görüşme Planlayın' : 'Book a Call Now'}
              </h2>
              <p className="text-slate-300">
                {lang === 'tr'
                  ? '30 dakika ücretsiz keşif görüşmesi — uygun zamanı siz seçin.'
                  : '30-minute free discovery call — pick the time that suits you.'}
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
