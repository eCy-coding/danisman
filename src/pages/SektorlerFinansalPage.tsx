import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation } from '@/lib/i18n';

const PAIN_POINTS = [
  {
    icon: '📋',
    title: { tr: 'Düzenleyici Uyum Yükü', en: 'Regulatory Compliance Burden' },
    desc: {
      tr: 'BDDK, SPK, FATF düzenlemeleri hızla değişiyor. Uyum ekipleri sürekli güncelleme baskısı altında, stratejik işe zaman kalmıyor.',
      en: 'BDDK, SPK, FATF regulations change rapidly. Compliance teams are under constant update pressure, leaving no time for strategic work.',
    },
  },
  {
    icon: '⚠️',
    title: { tr: 'Risk Yönetimi Olgunluk Boşluğu', en: 'Risk Management Maturity Gap' },
    desc: {
      tr: 'Operasyonel, kredi ve piyasa riskleri arasındaki entegrasyon eksik. Üst yönetim için konsolide risk görünürlüğü yetersiz.',
      en: 'Integration between operational, credit, and market risks is lacking. Consolidated risk visibility for senior management is insufficient.',
    },
  },
  {
    icon: '🚀',
    title: { tr: 'Dijital Dönüşüm Hızı', en: 'Digital Transformation Speed' },
    desc: {
      tr: 'Fintech rakipleri hız kazanırken geleneksel kurumlar legacy sistemlerle yavaşlıyor. Müşteri beklentileri ile altyapı arasındaki uçurum genişliyor.',
      en: 'While fintech competitors gain speed, traditional institutions slow down with legacy systems. The gap between customer expectations and infrastructure widens.',
    },
  },
];

const SERVICES = [
  {
    tr: 'BDDK / SPK uyum boşluk analizi ve yol haritası',
    en: 'BDDK / SPK compliance gap analysis and roadmap',
  },
  {
    tr: 'Entegre risk yönetimi çerçevesi (ERM) tasarımı',
    en: 'Integrated risk management framework (ERM) design',
  },
  {
    tr: 'AML/CFT süreç değerlendirmesi ve güçlendirme',
    en: 'AML/CFT process assessment and strengthening',
  },
  {
    tr: 'Dijital bankacılık strateji ve teknoloji seçimi',
    en: 'Digital banking strategy and technology selection',
  },
  {
    tr: 'Fintech ortaklık ve entegrasyon değerlendirmesi',
    en: 'Fintech partnership and integration assessment',
  },
  {
    tr: 'İç denetim etkinlik değerlendirmesi ve geliştirme',
    en: 'Internal audit effectiveness assessment and development',
  },
];

export const SektorlerFinansalPage: React.FC = () => {
  const { language: lang } = useTranslation();

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: lang === 'tr' ? 'Finansal Hizmetler Danışmanlığı' : 'Financial Services Consulting',
    url: 'https://www.ecypro.com/sektorler/finansal-hizmetler',
    description:
      lang === 'tr'
        ? 'BDDK/SPK uyumu, entegre risk yönetimi ve dijital bankacılık stratejisi ile finansal kurumları geleceğe taşıyoruz.'
        : 'Taking financial institutions to the future with BDDK/SPK compliance, integrated risk management, and digital banking strategy.',
    provider: {
      '@type': 'Organization',
      name: 'eCyPro Premium Consulting',
      url: 'https://www.ecypro.com',
    },
    areaServed: { '@type': 'Country', name: 'Türkiye', identifier: 'TR' },
    serviceType: 'Management Consulting',
  };

  return (
    <div className="min-h-screen bg-neutral">
      <SEO
        title={
          lang === 'tr'
            ? 'Finansal Hizmetler Danışmanlığı | eCyPro'
            : 'Financial Services Consulting | eCyPro'
        }
        description={
          lang === 'tr'
            ? 'BDDK/SPK uyumu, risk yönetimi ve dijital bankacılık dönüşümü. Finansal kurumlar için bağımsız, uzman danışmanlık.'
            : 'BDDK/SPK compliance, risk management, and digital banking transformation. Independent, expert consulting for financial institutions.'
        }
        canonical="/sektorler/finansal-hizmetler"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://www.ecypro.com/' },
          {
            name: lang === 'tr' ? 'Sektörler' : 'Industries',
            url: 'https://www.ecypro.com/sektorler',
          },
          {
            name: lang === 'tr' ? 'Finansal Hizmetler' : 'Financial Services',
            url: 'https://www.ecypro.com/sektorler/finansal-hizmetler',
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
            🏦 {lang === 'tr' ? 'Finansal Hizmetler' : 'Financial Services'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            {lang === 'tr'
              ? 'Uyum ve Büyümeyi Birlikte Yönetin'
              : 'Manage Compliance and Growth Together'}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-16">
            {lang === 'tr'
              ? 'Finansal hizmetler sektöründe uyum yükü ve dijital dönüşüm eş zamanlı yönetilmek zorunda. eCyPro bu ikiliyi strateji avantajına dönüştürür.'
              : 'In financial services, compliance burden and digital transformation must be managed simultaneously. eCyPro turns this duality into strategic advantage.'}
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

        <FadeIn>
          <div className="glass-card p-10 rounded-2xl text-center border border-secondary/20">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {lang === 'tr'
                ? 'Kurumunuzu Birlikte Değerlendirelim'
                : "Let's Assess Your Institution Together"}
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              {lang === 'tr'
                ? 'Uyum takvimi, risk iştahı ve dijital dönüşüm hedeflerinizi 30 dakikalık bir görüşmede konuşalım.'
                : "Let's discuss your compliance calendar, risk appetite, and digital transformation goals in a 30-minute call."}
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
