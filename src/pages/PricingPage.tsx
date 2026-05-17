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

const TIERS: Tier[] = [
  {
    id: 'starter',
    name: { tr: 'Başlangıç', en: 'Starter' },
    tagline: {
      tr: 'Hızlı bir değerlendirme ile başlayın',
      en: 'Kickstart with a rapid assessment',
    },
    priceMonthly: 1490,
    priceAnnual: 14900,
    currency: '€',
    icon: <Sparkles className="w-5 h-5" />,
    cta: { tr: 'Başlayın', en: 'Start Now' },
    features: [
      { tr: 'Olgunluk Değerlendirmesi (2 sa.)', en: 'Maturity Assessment (2 hr)' },
      { tr: 'Yönetici Özeti raporu', en: 'Executive Summary report' },
      { tr: 'Aylık 1 strateji görüşmesi', en: '1 strategy call / month' },
      { tr: 'Slack / E-posta desteği', en: 'Slack / Email support' },
    ],
  },
  {
    id: 'growth',
    name: { tr: 'Büyüme', en: 'Growth' },
    tagline: {
      tr: 'Dijital dönüşümünüzü hızlandırın',
      en: 'Accelerate your digital transformation',
    },
    priceMonthly: 4990,
    priceAnnual: 49900,
    currency: '€',
    icon: <Zap className="w-5 h-5" />,
    highlight: true,
    cta: { tr: 'En Popüler', en: 'Most Popular' },
    features: [
      { tr: 'Tüm Başlangıç özellikleri', en: 'Everything in Starter' },
      { tr: 'Haftalık 2 uzman danışmanlığı', en: '2 weekly expert sessions' },
      { tr: 'Özel yol haritası + OKR kurulumu', en: 'Custom roadmap + OKR setup' },
      { tr: 'Performans panosu (SSE real-time)', en: 'Live performance dashboard (SSE)' },
      { tr: '4 saat yanıt SLA', en: '4-hour response SLA' },
    ],
  },
  {
    id: 'enterprise',
    name: { tr: 'Kurumsal', en: 'Enterprise' },
    tagline: { tr: 'Tam dönüşüm ortaklığı', en: 'Full transformation partnership' },
    priceMonthly: 0,
    priceAnnual: 0,
    currency: '€',
    icon: <Crown className="w-5 h-5" />,
    cta: { tr: 'İletişime Geçin', en: 'Contact Sales' },
    features: [
      { tr: 'Tüm Büyüme özellikleri', en: 'Everything in Growth' },
      { tr: 'Özel ekip (Managing Partner + 3 uzman)', en: 'Dedicated team (MP + 3 experts)' },
      { tr: 'İş günü 24/7 destek', en: '24/7 business-day support' },
      { tr: 'SOC 2 / ISO 27001 uyum danışmanlığı', en: 'SOC 2 / ISO 27001 compliance advisory' },
      { tr: 'Özel sözleşme + KVKK/DPA', en: 'Custom MSA + GDPR DPA' },
      { tr: 'Yerinde çalıştaylar (quarterly)', en: 'On-site workshops (quarterly)' },
    ],
  },
];

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
      tr: 'Aylık veya yıllık olarak seçilebilir. Yıllıkta %17 indirim uygulanır.',
      en: 'Monthly or annual billing. Annual plans get 17% discount.',
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
    save: { tr: '2 ay ücretsiz', en: '2 months free' },
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
    const baseTRY = billing === 'annual' ? Math.round(tier.priceAnnual / 12) : tier.priceMonthly;
    return formatPrice(baseTRY);
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{`${t.title[lang]} | EcyPro`}</title>
        <meta name="description" content={t.subtitle[lang]} />
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
                <Link
                  to={tier.priceMonthly === 0 ? '/contact' : `/contact?plan=${tier.id}`}
                  onClick={() => trackEvent('Pricing', 'CtaClick', tier.id)}
                  data-testid={`pricing-cta-${tier.id}`}
                  className={`w-full text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    tier.highlight
                      ? 'bg-white text-neutral hover:bg-slate-100'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  <span>{tier.cta[lang]}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
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
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
              <table className="w-full text-sm">
                <thead>
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
            <Link
              to="/contact"
              onClick={() => trackEvent('Pricing', 'FinalCtaClick')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-neutral font-bold hover:bg-slate-100 transition-all"
            >
              <span>{t.bookCall[lang]}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </PageWrapper>
    </React.Fragment>
  );
};

export default PricingPage;
