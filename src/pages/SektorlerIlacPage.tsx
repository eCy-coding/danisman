import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation } from '@/lib/i18n';

const PAIN_POINTS = [
  {
    icon: '📜',
    title: { tr: 'GMP Uyum Karmaşıklığı', en: 'GMP Compliance Complexity' },
    desc: {
      tr: 'İyi İmalat Uygulamaları (GMP) gereklilikleri hem ulusal hem AB standartları kapsamında güncelleniyor. Sürekli dokümantasyon ve denetim hazırlığı kaynak tüketiyor.',
      en: 'Good Manufacturing Practice (GMP) requirements are updated under both national and EU standards. Continuous documentation and audit preparation consumes resources.',
    },
  },
  {
    icon: '🏥',
    title: { tr: 'SGK Süreç Optimizasyonu', en: 'SGK Process Optimization' },
    desc: {
      tr: 'Geri ödeme listesi yönetimi, eczane ve hastane kanalı koordinasyonu operasyonel darboğaz oluşturuyor. Manuel süreçler hata riskini artırıyor.',
      en: 'Reimbursement list management and pharmacy-hospital channel coordination create operational bottlenecks. Manual processes increase error risk.',
    },
  },
  {
    icon: '💊',
    title: { tr: 'Dijital Sağlık Dönüşümü', en: 'Digital Health Transformation' },
    desc: {
      tr: 'Telemedicine, sağlık verisi yönetimi ve hasta deneyimi dijitalleşmesi hem fırsat hem uyum riski taşıyor. Doğru strateji kritik.',
      en: 'Telemedicine, health data management, and patient experience digitalization carry both opportunity and compliance risk. The right strategy is critical.',
    },
  },
];

const SERVICES = [
  {
    tr: 'GMP uyum boşluk analizi ve denetim hazırlık programı',
    en: 'GMP compliance gap analysis and audit readiness program',
  },
  { tr: 'SGK geri ödeme süreci optimizasyonu', en: 'SGK reimbursement process optimization' },
  { tr: 'Klinik operasyon süreç iyileştirmesi', en: 'Clinical operations process improvement' },
  {
    tr: 'Farmakovijilans süreç tasarımı ve güçlendirme',
    en: 'Pharmacovigilance process design and strengthening',
  },
  {
    tr: 'Sağlık IT strateji ve sistem seçimi danışmanlığı',
    en: 'Health IT strategy and system selection consulting',
  },
  {
    tr: 'KVKK uyumu — hasta verisi özel kategorisi',
    en: 'KVKK compliance — special category patient data',
  },
];

export const SektorlerIlacPage: React.FC = () => {
  const { language: lang } = useTranslation();

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: lang === 'tr' ? 'İlaç & Sağlık Sektörü Danışmanlığı' : 'Pharma & Healthcare Consulting',
    url: 'https://www.ecypro.com/sektorler/ilac-saglik',
    description:
      lang === 'tr'
        ? 'GMP uyumu, SGK süreç optimizasyonu ve dijital sağlık stratejisi ile ilaç ve sağlık şirketlerine değer yaratıyoruz.'
        : 'Creating value for pharma and healthcare companies with GMP compliance, SGK process optimization, and digital health strategy.',
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
            ? 'İlaç & Sağlık Sektörü Danışmanlığı | eCyPro'
            : 'Pharma & Healthcare Consulting | eCyPro'
        }
        description={
          lang === 'tr'
            ? 'GMP uyumu, SGK süreç optimizasyonu ve dijital sağlık dönüşümü. İlaç ve sağlık şirketleri için uzman danışmanlık.'
            : 'GMP compliance, SGK process optimization, and digital health transformation. Expert consulting for pharma and healthcare companies.'
        }
        canonical="/sektorler/ilac-saglik"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://www.ecypro.com/' },
          {
            name: lang === 'tr' ? 'Sektörler' : 'Industries',
            url: 'https://www.ecypro.com/sektorler',
          },
          {
            name: lang === 'tr' ? 'İlaç & Sağlık' : 'Pharma & Healthcare',
            url: 'https://www.ecypro.com/sektorler/ilac-saglik',
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
            ⚕️ {lang === 'tr' ? 'İlaç & Sağlık' : 'Pharma & Healthcare'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            {lang === 'tr' ? 'Uyum ve İnovasyonu Dengeleyin' : 'Balance Compliance and Innovation'}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-16">
            {lang === 'tr'
              ? 'İlaç ve sağlık sektörü hem en yüksek düzenleyici yükü hem en hızlı dijital dönüşümü aynı anda yönetiyor. eCyPro bu dengeyi kurar.'
              : 'Pharma and healthcare manage the highest regulatory burden and fastest digital transformation simultaneously. eCyPro establishes this balance.'}
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
                ? 'Uyum Takviminizi Birlikte Planlayalım'
                : "Let's Plan Your Compliance Calendar Together"}
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              {lang === 'tr'
                ? 'GMP, KVKK ve dijital sağlık gündeminizdeki öncelikleri 30 dakikalık bir görüşmede netleştirelim.'
                : "Let's clarify priorities on your GMP, KVKK, and digital health agenda in a 30-minute call."}
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
