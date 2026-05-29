import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation } from '@/lib/i18n';

const SECTORS = [
  {
    slug: 'imalat-sanayi',
    icon: '⚙️',
    title: { tr: 'İmalat Sanayi', en: 'Manufacturing' },
    description: {
      tr: 'Operasyonel mükemmellik, Lean dönüşümü ve tedarik zinciri optimizasyonu ile üretim verimliliğini artırıyoruz.',
      en: 'Boosting production efficiency through operational excellence, Lean transformation, and supply chain optimization.',
    },
  },
  {
    slug: 'finansal-hizmetler',
    icon: '🏦',
    title: { tr: 'Finansal Hizmetler', en: 'Financial Services' },
    description: {
      tr: 'BDDK/SPK uyumu, risk çerçeveleri ve fintech entegrasyonu ile finansal kurumları geleceğe taşıyoruz.',
      en: 'Preparing financial institutions for the future with BDDK/SPK compliance, risk frameworks, and fintech integration.',
    },
  },
  {
    slug: 'ilac-saglik',
    icon: '⚕️',
    title: { tr: 'İlaç & Sağlık', en: 'Pharma & Healthcare' },
    description: {
      tr: 'GMP uyumu, SGK süreç optimizasyonu ve dijital sağlık dönüşümü ile sektörün karmaşıklığını sadeleştiriyoruz.',
      en: 'Simplifying sector complexity with GMP compliance, SGK process optimization, and digital health transformation.',
    },
  },
  {
    slug: 'perakende-e-ticaret',
    icon: '🛍️',
    title: { tr: 'Perakende & E-Ticaret', en: 'Retail & E-Commerce' },
    description: {
      tr: 'Omnichannel strateji, müşteri deneyimi dönüşümü ve veri odaklı kararlarla büyümeyi hızlandırıyoruz.',
      en: 'Accelerating growth with omnichannel strategy, CX transformation, and data-driven decision-making.',
    },
  },
  {
    slug: 'teknoloji-saas',
    icon: '💡',
    title: { tr: 'Teknoloji & SaaS', en: 'Tech & SaaS' },
    description: {
      tr: 'GTM stratejisi, enterprise sales altyapısı ve SaaS metriklerle teknoloji şirketlerini kurumsal ölçeğe taşıyoruz.',
      en: 'Taking tech companies to enterprise scale with GTM strategy, enterprise sales infrastructure, and SaaS metrics.',
    },
  },
];

export const SektorlerPage: React.FC = () => {
  const { language: lang } = useTranslation();

  const sectorJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: lang === 'tr' ? 'eCyPro Sektör Çözümleri' : 'eCyPro Sector Solutions',
    url: 'https://www.ecypro.com/sektorler',
    numberOfItems: SECTORS.length,
    itemListElement: SECTORS.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.title[lang],
      url: `https://www.ecypro.com/sektorler/${s.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-neutral">
      <SEO
        title={
          lang === 'tr'
            ? 'Sektör Çözümleri | eCyPro Premium Danışmanlık'
            : 'Industry Solutions | eCyPro Premium Consulting'
        }
        description={
          lang === 'tr'
            ? 'İmalat, finans, ilaç, perakende ve teknoloji sektörlerinde Big4 kalitesinde bağımsız danışmanlık. Sektörünüze özel stratejik çözümler.'
            : 'Big4-quality independent consulting across manufacturing, finance, pharma, retail, and tech. Sector-specific strategic solutions.'
        }
        canonical="/sektorler"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://www.ecypro.com/' },
          {
            name: lang === 'tr' ? 'Sektörler' : 'Industries',
            url: 'https://www.ecypro.com/sektorler',
          },
        ])}
      />
      <JsonLd data={sectorJsonLd} />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <FadeIn>
          <div className="mb-16">
            <p className="text-secondary text-sm font-semibold tracking-widest uppercase mb-4">
              {lang === 'tr' ? 'Sektör Uzmanlığı' : 'Sector Expertise'}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
              {lang === 'tr'
                ? 'Sektörünüze Özel\nStratejik Danışmanlık'
                : 'Strategic Consulting\nTailored to Your Sector'}
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
              {lang === 'tr'
                ? 'Beş temel sektörde derin uzmanlaşma ile Big4 kalitesinde bağımsız danışmanlık. Genel çözümler değil — sektörünüzün dinamiklerini içselleştirmiş stratejik ortaklık.'
                : 'Deep specialization across five key sectors with Big4-quality independent consulting. Not generic solutions — strategic partnership that has internalized your sector dynamics.'}
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {SECTORS.map((sector, i) => (
            <FadeIn key={sector.slug} delay={i * 0.08}>
              <Link
                to={`/sektorler/${sector.slug}`}
                className="glass-card p-8 rounded-xl block group hover:border-secondary/40 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                aria-label={`${sector.title[lang]} sektör sayfasına git`}
              >
                <span className="text-4xl mb-4 block" aria-hidden="true">
                  {sector.icon}
                </span>
                <h2 className="text-xl font-bold text-primary mb-3 group-hover:text-secondary transition-colors">
                  {sector.title[lang]}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {sector.description[lang]}
                </p>
                <span className="text-secondary text-sm font-semibold inline-flex items-center gap-1">
                  {lang === 'tr' ? 'Daha Fazla' : 'Learn More'}
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="glass-card p-10 rounded-2xl text-center border border-secondary/20">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {lang === 'tr' ? 'Sektörünüzü Görmüyor Musunuz?' : "Don't See Your Sector?"}
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              {lang === 'tr'
                ? 'Her sektörün kendine özgü dinamikleri var. Sektörünüzü ve ihtiyacınızı anlatın — size özel bir yaklaşım tasarlayalım.'
                : 'Every sector has unique dynamics. Tell us about your sector and needs — we will design a tailored approach.'}
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
