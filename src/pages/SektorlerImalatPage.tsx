import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation } from '@/lib/i18n';

const PAIN_POINTS = [
  {
    icon: '📉',
    title: { tr: 'Artan Üretim Maliyetleri', en: 'Rising Production Costs' },
    desc: {
      tr: 'Enerji, hammadde ve işgücü maliyetleri üretim marjlarını sıkıştırıyor. Verimlilik iyileştirmeleri olmadan rekabet gücü azalıyor.',
      en: 'Energy, raw material, and labor costs are squeezing production margins. Without efficiency improvements, competitiveness declines.',
    },
  },
  {
    icon: '🔗',
    title: { tr: 'Tedarik Zinciri Kırılganlığı', en: 'Supply Chain Fragility' },
    desc: {
      tr: 'Küresel aksaklıklar ve tek tedarikçi bağımlılığı operasyonel riskleri artırıyor. Esneklik ve çeşitlendirme stratejik zorunluluk.',
      en: 'Global disruptions and single-supplier dependency increase operational risks. Flexibility and diversification become strategic imperatives.',
    },
  },
  {
    icon: '🏭',
    title: { tr: 'Dijital Fabrika Boşluğu', en: 'Smart Factory Gap' },
    desc: {
      tr: 'Endüstri 4.0 yatırımları planlı ama uygulama tutarsız. OT/IT entegrasyonu ve veri odaklı üretim henüz hayata geçirilemiyor.',
      en: 'Industry 4.0 investments are planned but implementation is inconsistent. OT/IT integration and data-driven manufacturing have yet to be realized.',
    },
  },
];

const SERVICES = [
  {
    tr: 'Lean Manufacturing & Six Sigma dönüşümü',
    en: 'Lean Manufacturing & Six Sigma transformation',
  },
  {
    tr: 'Değer akışı haritalama (VSM) ve darboğaz analizi',
    en: 'Value stream mapping (VSM) and bottleneck analysis',
  },
  {
    tr: 'Tedarik zinciri çeşitlendirme ve risk değerlendirmesi',
    en: 'Supply chain diversification and risk assessment',
  },
  {
    tr: 'OEE ölçümü ve ekipman verimliliği optimizasyonu',
    en: 'OEE measurement and equipment efficiency optimization',
  },
  {
    tr: 'Üretim maliyeti yapısı analizi ve tasarruf hedefleri',
    en: 'Production cost structure analysis and savings targets',
  },
  {
    tr: 'Dijital fabrika yol haritası ve teknoloji seçimi',
    en: 'Smart factory roadmap and technology selection',
  },
];

export const SektorlerImalatPage: React.FC = () => {
  const { language: lang } = useTranslation();

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: lang === 'tr' ? 'İmalat Sanayi Danışmanlığı' : 'Manufacturing Sector Consulting',
    url: 'https://www.ecypro.com/sektorler/imalat-sanayi',
    description:
      lang === 'tr'
        ? 'Lean dönüşümü, tedarik zinciri optimizasyonu ve endüstri 4.0 hazırlığı ile üretim şirketlerine değer yaratıyoruz.'
        : 'Creating value for manufacturing companies with Lean transformation, supply chain optimization, and Industry 4.0 readiness.',
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
            ? 'İmalat Sanayi Danışmanlığı | eCyPro'
            : 'Manufacturing Sector Consulting | eCyPro'
        }
        description={
          lang === 'tr'
            ? 'Lean dönüşümü, tedarik zinciri optimizasyonu ve endüstri 4.0 hazırlığı. İmalat şirketlerine Big4 kalitesinde bağımsız danışmanlık.'
            : 'Lean transformation, supply chain optimization, and Industry 4.0 readiness. Big4-quality independent consulting for manufacturing companies.'
        }
        canonical="/sektorler/imalat-sanayi"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://www.ecypro.com/' },
          {
            name: lang === 'tr' ? 'Sektörler' : 'Industries',
            url: 'https://www.ecypro.com/sektorler',
          },
          {
            name: lang === 'tr' ? 'İmalat Sanayi' : 'Manufacturing',
            url: 'https://www.ecypro.com/sektorler/imalat-sanayi',
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
            ⚙️ {lang === 'tr' ? 'İmalat Sanayi' : 'Manufacturing'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            {lang === 'tr'
              ? 'Üretim Verimliliğini Yeniden Tanımlayın'
              : 'Redefine Production Efficiency'}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-16">
            {lang === 'tr'
              ? 'İmalat şirketleri bugün daha fazla baskıyla, daha az marjla çalışıyor. eCyPro, sektörün dinamiklerini içselleştirmiş bir ekibiyle operasyonel mükemmelliği kalıcı hale getirir.'
              : 'Manufacturing companies today operate with more pressure and thinner margins. eCyPro makes operational excellence permanent with a team that has internalized sector dynamics.'}
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
                ? 'Üretim Operasyonunuzu İnceleyelim'
                : "Let's Review Your Production Operations"}
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              {lang === 'tr'
                ? '30 dakikalık discovery çağrısında mevcut durumu, hedefleri ve kısa vadeli kazanım fırsatlarını konuşalım.'
                : "In a 30-minute discovery call, let's discuss the current state, goals, and short-term win opportunities."}
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
