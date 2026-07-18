import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { FadeIn } from '../components/common/FadeIn';
import { FAQSection } from '../components/blog/FAQSection';
import { getSectorFaqItems } from '../data/sectorFaqs';
import { SectorDepth } from '../components/sections/SectorDepth';
import { getSectorContent } from '../data/sectorContent';
import { useTranslation } from '@/lib/i18n';

const PAIN_POINTS = [
  {
    icon: '🎯',
    title: { tr: 'Ürün-Pazar Uyumu Belirsizliği', en: 'Product-Market Fit Uncertainty' },
    desc: {
      tr: 'Teknik ürün güçlü ama hedef segment ve fiyatlandırma modeli optimize edilmemiş. Satış döngüleri uzuyor, NRR hedeflerin altında kalıyor.',
      en: 'Technical product is strong but target segment and pricing model are not optimized. Sales cycles lengthen, NRR falls below targets.',
    },
  },
  {
    icon: '🏢',
    title: {
      tr: 'Enterprise Satış Altyapısı Eksikliği',
      en: 'Enterprise Sales Infrastructure Gap',
    },
    desc: {
      tr: 'SMB satış hızından enterprise müşterilere geçiş sürecinde metodoloji boşluğu var. RFP yönetimi, procurement süreci ve stakeholder haritası net değil.',
      en: 'Methodology gap exists in transitioning from SMB sales speed to enterprise customers. RFP management, procurement process, and stakeholder mapping are unclear.',
    },
  },
  {
    icon: '📈',
    title: { tr: 'SaaS Metrik Görünürlüğü', en: 'SaaS Metrics Visibility' },
    desc: {
      tr: 'MRR, churn, CAC, LTV metrikleri toplanıyor ama karar almayı yönlendiren bir içgörü sistemine dönüştürülemiyor. Board raporlaması ad hoc.',
      en: "MRR, churn, CAC, LTV metrics are collected but can't be converted into an insight system that guides decisions. Board reporting is ad hoc.",
    },
  },
];

const SERVICES = [
  { tr: 'GTM strateji tasarımı ve kanal seçimi', en: 'GTM strategy design and channel selection' },
  {
    tr: 'Enterprise satış metodolojisi ve playbook geliştirme',
    en: 'Enterprise sales methodology and playbook development',
  },
  {
    tr: 'SaaS metrik çerçevesi ve board dashboard tasarımı',
    en: 'SaaS metrics framework and board dashboard design',
  },
  {
    tr: 'Fiyatlandırma modeli optimizasyonu (freemium/PLG/enterprise)',
    en: 'Pricing model optimization (freemium/PLG/enterprise)',
  },
  {
    tr: 'Kurumsal yapı ve ölçeklenme organizasyon tasarımı',
    en: 'Corporate structure and scaling organization design',
  },
  {
    tr: 'Yatırımcı hazırlık ve due diligence süreç desteği',
    en: 'Investor readiness and due diligence process support',
  },
];

export const SektorlerTeknolojPage: React.FC = () => {
  const { language: lang } = useTranslation();
  const sectorDepth = getSectorContent('teknoloji-saas');

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: lang === 'tr' ? 'Teknoloji & SaaS Danışmanlığı' : 'Tech & SaaS Consulting',
    url: 'https://ecypro.com/sektorler/teknoloji-saas',
    description:
      lang === 'tr'
        ? 'GTM stratejisi, enterprise satış altyapısı ve SaaS metriklerle teknoloji şirketlerini kurumsal ölçeğe taşıyoruz.'
        : 'Taking tech companies to enterprise scale with GTM strategy, enterprise sales infrastructure, and SaaS metrics.',
    provider: {
      '@type': 'Organization',
      name: 'eCyPro Premium Consulting',
      url: 'https://ecypro.com',
    },
    areaServed: { '@type': 'Country', name: 'Türkiye', identifier: 'TR' },
    serviceType: 'Management Consulting',
  };

  return (
    <div className="min-h-screen bg-neutral">
      <SEO
        title={
          lang === 'tr'
            ? 'Teknoloji & SaaS Danışmanlığı | eCyPro'
            : 'Tech & SaaS Consulting | eCyPro'
        }
        description={
          lang === 'tr'
            ? 'GTM stratejisi, enterprise satış altyapısı ve SaaS metrik çerçevesi. Teknoloji şirketleri için büyüme danışmanlığı.'
            : 'GTM strategy, enterprise sales infrastructure, and SaaS metrics framework. Growth consulting for technology companies.'
        }
        canonical="/sektorler/teknoloji-saas"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
          {
            name: lang === 'tr' ? 'Sektörler' : 'Industries',
            url: 'https://ecypro.com/sektorler',
          },
          {
            name: lang === 'tr' ? 'Teknoloji & SaaS' : 'Tech & SaaS',
            url: 'https://ecypro.com/sektorler/teknoloji-saas',
          },
        ])}
      />
      <JsonLd data={serviceJsonLd} />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <FadeIn>
          <Link
            to="/sektorler"
            className="text-secondary text-sm hover:underline inline-flex items-center gap-1 mb-8 outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
            aria-label={lang === 'tr' ? 'Sektörler sayfasına dön' : 'Back to Sectors'}
          >
            <span aria-hidden="true">←</span> {lang === 'tr' ? 'Sektörler' : 'Sectors'}
          </Link>
          <p className="text-secondary text-sm font-semibold tracking-widest uppercase mb-4">
            💡 {lang === 'tr' ? 'Teknoloji & SaaS' : 'Tech & SaaS'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            {lang === 'tr'
              ? 'Ürün Gücünüzü Piyasa Kazanımına Dönüştürün'
              : 'Convert Product Strength to Market Wins'}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-16">
            {lang === 'tr'
              ? "Teknoloji şirketleri için en büyük engel genellikle teknik değil stratejik. eCyPro, GTM'den enterprise satışa, SaaS metriklerden yatırımcı hazırlığına tam spektrum destek sunar."
              : 'For tech companies, the biggest obstacle is usually strategic, not technical. eCyPro provides full spectrum support from GTM to enterprise sales, SaaS metrics to investor readiness.'}
          </p>
        </FadeIn>

        <FadeIn>
          <h2 className="text-2xl font-bold text-primary mb-8">
            {lang === 'tr' ? 'Sektörün Gerçek Sorunları' : 'Real Sector Challenges'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {PAIN_POINTS.map((pp, i) => (
              <div key={i} className="glass-card p-6 rounded-xl">
                <span className="text-3xl mb-3 block" aria-hidden="true">
                  {pp.icon}
                </span>
                <h3 className="font-bold text-primary mb-2">{pp.title[lang]}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{pp.desc[lang]}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn>
          <h2 className="text-2xl font-bold text-primary mb-8">
            {lang === 'tr' ? "eCyPro'nun Yaklaşımı" : "eCyPro's Approach"}
          </h2>
          <div className="glass-card p-8 rounded-xl mb-20">
            <ul className="space-y-4">
              {SERVICES.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                  <span className="text-secondary mt-0.5" aria-hidden="true">
                    ✓
                  </span>
                  {s[lang]}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>

        {sectorDepth && (
          <FadeIn>
            <SectorDepth content={sectorDepth} lang={lang} />
          </FadeIn>
        )}

        <FadeIn>
          <FAQSection
            items={getSectorFaqItems('teknoloji-saas', lang)}
            title={lang === 'tr' ? 'Sık Sorulan Sorular' : 'Frequently Asked Questions'}
          />
        </FadeIn>

        <FadeIn>
          <div className="glass-card p-10 rounded-2xl text-center border border-secondary/20">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {lang === 'tr'
                ? 'Büyüme Engelinizi Birlikte Tespit Edelim'
                : "Let's Identify Your Growth Blocker Together"}
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              {lang === 'tr'
                ? 'GTM tıkanıklığınızı, enterprise satış boşluğunuzu veya metrik altyapınızı 30 dakikada netleştirelim.'
                : "Let's clarify your GTM bottleneck, enterprise sales gap, or metrics infrastructure in 30 minutes."}
            </p>
            <Link
              to="/discovery"
              className="inline-block bg-secondary text-neutral font-bold py-4 px-10 rounded-lg hover:bg-secondary/90 transition-colors min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary"
            >
              {lang === 'tr' ? 'Discovery Çağrısı Al' : 'Book a Discovery Call'}
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};
