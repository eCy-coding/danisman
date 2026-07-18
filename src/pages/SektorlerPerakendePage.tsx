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
    icon: '🛒',
    title: { tr: 'Kanal Parçalanması', en: 'Channel Fragmentation' },
    desc: {
      tr: 'Fiziksel mağaza, web sitesi, mobil uygulama ve marketplace kanalları birbirinden kopuk çalışıyor. Müşteri tutarsız bir deneyim yaşıyor, marka değeri aşınıyor.',
      en: 'Physical stores, website, mobile app, and marketplace channels operate disconnected from each other. Customers experience inconsistency, eroding brand value.',
    },
  },
  {
    icon: '📊',
    title: { tr: 'Veri Değer Uçurumu', en: 'Data Value Gap' },
    desc: {
      tr: 'Büyük miktarda müşteri ve işlem verisi toplanıyor ama aksiyonlanabilir içgörüye dönüştürülemiyor. Kararlar hâlâ sezgiye dayalı.',
      en: 'Large amounts of customer and transaction data are collected but cannot be converted into actionable insights. Decisions are still based on intuition.',
    },
  },
  {
    icon: '⚡',
    title: { tr: 'Hız ve Esneklik Paradoksu', en: 'Speed and Flexibility Paradox' },
    desc: {
      tr: 'E-ticaret hızında hareket etmek gerekiyor ama mevcut organizasyon ve süreçler hızlı adaptasyona izin vermiyor. Fırsat pencereleri kapanıyor.',
      en: "Moving at e-commerce speed is necessary but existing organization and processes don't allow rapid adaptation. Opportunity windows are closing.",
    },
  },
];

const SERVICES = [
  {
    tr: 'Omnichannel strateji tasarımı ve yol haritası',
    en: 'Omnichannel strategy design and roadmap',
  },
  {
    tr: 'Müşteri yolculuğu haritalama ve CX dönüşümü',
    en: 'Customer journey mapping and CX transformation',
  },
  {
    tr: 'Stok optimizasyonu ve talep tahmini modelleri',
    en: 'Inventory optimization and demand forecasting models',
  },
  { tr: 'Fiyatlandırma stratejisi ve marj yönetimi', en: 'Pricing strategy and margin management' },
  {
    tr: 'Müşteri yaşam boyu değeri (CLV) artırma programı',
    en: 'Customer lifetime value (CLV) enhancement program',
  },
  {
    tr: 'E-ticaret büyüme stratejisi ve kanal yönetimi',
    en: 'E-commerce growth strategy and channel management',
  },
];

export const SektorlerPerakendePage: React.FC = () => {
  const { language: lang } = useTranslation();
  const sectorDepth = getSectorContent('perakende-e-ticaret');

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: lang === 'tr' ? 'Perakende & E-Ticaret Danışmanlığı' : 'Retail & E-Commerce Consulting',
    url: 'https://ecypro.com/sektorler/perakende-e-ticaret',
    description:
      lang === 'tr'
        ? 'Omnichannel strateji, CX dönüşümü ve veri odaklı büyüme ile perakende ve e-ticaret şirketlerine değer yaratıyoruz.'
        : 'Creating value for retail and e-commerce companies with omnichannel strategy, CX transformation, and data-driven growth.',
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
            ? 'Perakende & E-Ticaret Danışmanlığı | eCyPro'
            : 'Retail & E-Commerce Consulting | eCyPro'
        }
        description={
          lang === 'tr'
            ? 'Omnichannel strateji, müşteri deneyimi dönüşümü ve veri odaklı büyüme. Perakende ve e-ticaret için uzman danışmanlık.'
            : 'Omnichannel strategy, customer experience transformation, and data-driven growth. Expert consulting for retail and e-commerce.'
        }
        canonical="/sektorler/perakende-e-ticaret"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
          {
            name: lang === 'tr' ? 'Sektörler' : 'Industries',
            url: 'https://ecypro.com/sektorler',
          },
          {
            name: lang === 'tr' ? 'Perakende & E-Ticaret' : 'Retail & E-Commerce',
            url: 'https://ecypro.com/sektorler/perakende-e-ticaret',
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
            🛍️ {lang === 'tr' ? 'Perakende & E-Ticaret' : 'Retail & E-Commerce'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            {lang === 'tr'
              ? 'Kanalları Birleştirin, Büyümeyi Hızlandırın'
              : 'Unify Channels, Accelerate Growth'}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-16">
            {lang === 'tr'
              ? 'Perakendenin geleceği bütünleşik kanallarda. eCyPro fiziksel ve dijital deneyimi müşteri değerine dönüştüren stratejik dönüşüm ortağınız.'
              : 'The future of retail is integrated channels. eCyPro is your strategic transformation partner converting physical and digital experience into customer value.'}
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
            items={getSectorFaqItems('perakende-e-ticaret', lang)}
            title={lang === 'tr' ? 'Sık Sorulan Sorular' : 'Frequently Asked Questions'}
          />
        </FadeIn>

        <FadeIn>
          <div className="glass-card p-10 rounded-2xl text-center border border-secondary/20">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {lang === 'tr'
                ? 'Büyüme Fırsatlarını Birlikte Haritalayalım'
                : "Let's Map Growth Opportunities Together"}
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              {lang === 'tr'
                ? 'Mevcut kanal yapınızı, müşteri verilerinizi ve büyüme hedeflerinizi 30 dakikalık bir görüşmede değerlendirelim.'
                : "Let's evaluate your current channel structure, customer data, and growth targets in a 30-minute call."}
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
