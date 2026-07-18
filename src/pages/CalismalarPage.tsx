import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation } from '@/lib/i18n';

// [OWNER-DRAFT] Aşağıdaki 3 vaka gerçek müşteri verisi içermez.
// Lansman öncesi tüm içerik owner onayından geçmelidir.
// Gerçek vaka başlamadan önce: slug, sector, outcome değerlerini güncelleyin.

interface CaseStudy {
  id: string;
  sector: { tr: string; en: string };
  title: { tr: string; en: string };
  challenge: { tr: string; en: string };
  approach: { tr: string; en: string };
  outcome: { tr: string; en: string };
  metrics: Array<{ value: string; label: { tr: string; en: string } }>;
  tags: string[];
  ownerDraft: boolean;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'case-001',
    sector: { tr: 'İmalat Sanayi', en: 'Manufacturing' },
    title: {
      tr: 'Üretim Verimliliği Dönüşümü — [OWNER-DRAFT]',
      en: 'Manufacturing Efficiency Transformation — [OWNER-DRAFT]',
    },
    challenge: {
      tr: 'Orta ölçekli bir imalat firması, artan hammadde maliyetleri ve küresel tedarik zinciri baskısı altında %18 verimlilik kaybı yaşıyordu. Mevcut Lean uygulaması yüzeysel kalmıştı.',
      en: 'A mid-size manufacturing firm faced 18% efficiency loss under rising raw material costs and global supply chain pressure. Existing Lean implementation had remained superficial.',
    },
    approach: {
      tr: 'eCyPro, 8 haftalık operasyonel denetimle darboğazları tespit etti. Değer akışı haritalaması ve saha çalışmaları ile köklü süreç yeniden tasarımı uygulandı.',
      en: 'eCyPro identified bottlenecks through an 8-week operational audit. Root-cause process redesign was applied through value stream mapping and field studies.',
    },
    outcome: {
      tr: 'Proje sonunda verimlilik artışı, stok devir hızı iyileşmesi ve sürdürülebilir operasyon modeli elde edildi.',
      en: 'The project delivered efficiency gains, inventory turnover improvement, and a sustainable operations model.',
    },
    metrics: [
      { value: '+%22', label: { tr: 'Verimlilik Artışı', en: 'Efficiency Gain' } },
      { value: '8H', label: { tr: 'Proje Süresi', en: 'Project Duration' } },
      { value: '3.2×', label: { tr: 'ROI', en: 'ROI' } },
    ],
    tags: ['Lean', 'Operasyonel Mükemmellik', 'Tedarik Zinciri'],
    ownerDraft: true,
  },
  {
    id: 'case-002',
    sector: { tr: 'Finansal Hizmetler', en: 'Financial Services' },
    title: {
      tr: 'BDDK Uyum Hazırlığı & Risk Çerçevesi — [OWNER-DRAFT]',
      en: 'BDDK Compliance Readiness & Risk Framework — [OWNER-DRAFT]',
    },
    challenge: {
      tr: 'Büyüme sürecindeki bir fintech şirketi, BDDK lisans başvurusu öncesinde kapsamlı uyum boşluk analizi ve risk yönetimi çerçevesine ihtiyaç duyuyordu.',
      en: 'A growing fintech company needed a comprehensive compliance gap analysis and risk management framework before BDDK license application.',
    },
    approach: {
      tr: 'Mevzuat haritalama, politika yazımı ve iç kontrol tasarımı aşamalarıyla 12 haftalık hazırlık programı yürütüldü. Yönetim kurulu düzeyinde eğitim dahil edildi.',
      en: 'A 12-week readiness program was executed across regulatory mapping, policy writing, and internal control design phases. Board-level training was included.',
    },
    outcome: {
      tr: 'Lisans başvurusu hazır uyum dosyası, düzenleyici kurum ile yapıcı diyalog ve risk komitesi kurulumu sağlandı.',
      en: 'A license-application-ready compliance dossier, constructive dialogue with the regulator, and risk committee establishment were achieved.',
    },
    metrics: [
      { value: '0', label: { tr: 'Kritik Boşluk', en: 'Critical Gaps' } },
      { value: '12H', label: { tr: 'Proje Süresi', en: 'Project Duration' } },
      { value: '+94', label: { tr: 'Uyum Skoru', en: 'Compliance Score' } },
    ],
    tags: ['BDDK', 'Risk Yönetimi', 'Regülasyon Uyumu'],
    ownerDraft: true,
  },
  {
    id: 'case-003',
    sector: { tr: 'Perakende & E-Ticaret', en: 'Retail & E-Commerce' },
    title: {
      tr: 'Omnichannel Büyüme Stratejisi — [OWNER-DRAFT]',
      en: 'Omnichannel Growth Strategy — [OWNER-DRAFT]',
    },
    challenge: {
      tr: 'Köklü bir perakende zinciri, e-ticaret kanalının büyümesine rağmen toplam gelirde durgunluk yaşıyordu. Çevrimiçi ve fiziksel kanal entegrasyonu çözümsüz kalmıştı.',
      en: 'An established retail chain faced revenue stagnation despite e-commerce channel growth. Online and physical channel integration remained unresolved.',
    },
    approach: {
      tr: 'Müşteri yolculuğu analizi, kanal kârlılık modeli ve teknoloji altyapısı değerlendirmesi ile bütünleşik büyüme yol haritası hazırlandı.',
      en: 'An integrated growth roadmap was prepared through customer journey analysis, channel profitability modeling, and technology infrastructure assessment.',
    },
    outcome: {
      tr: 'Omnichannel müşteri deneyimi tasarımı, teknoloji geçiş planı ve 18 aylık gelir büyüme hedefleri belirlendi.',
      en: 'Omnichannel customer experience design, technology transition plan, and 18-month revenue growth targets were defined.',
    },
    metrics: [
      { value: '+%31', label: { tr: 'Çevrimiçi Gelir', en: 'Online Revenue' } },
      { value: '16H', label: { tr: 'Proje Süresi', en: 'Project Duration' } },
      { value: '%89', label: { tr: 'Müşteri Memnuniyeti', en: 'Customer Satisfaction' } },
    ],
    tags: ['Omnichannel', 'CX Dönüşümü', 'E-Ticaret'],
    ownerDraft: true,
  },
];

const ALL_SECTORS = '__all__';

export const CalismalarPage: React.FC = () => {
  const { language: lang } = useTranslation();
  const [activeSector, setActiveSector] = useState(ALL_SECTORS);

  const sectors = Array.from(new Set(CASE_STUDIES.map((c) => c.sector[lang]))).sort();
  const visible =
    activeSector === ALL_SECTORS
      ? CASE_STUDIES
      : CASE_STUDIES.filter((c) => c.sector[lang] === activeSector);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: lang === 'tr' ? 'eCyPro Vaka Çalışmaları' : 'eCyPro Case Studies',
    url: 'https://ecypro.com/calismalar',
    numberOfItems: visible.length,
    itemListElement: visible.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.title[lang],
      description: c.outcome[lang],
    })),
  };

  return (
    <div className="min-h-screen bg-neutral">
      <SEO
        title={
          lang === 'tr'
            ? 'Vaka Çalışmaları | eCyPro Premium Danışmanlık'
            : 'Case Studies | eCyPro Premium Consulting'
        }
        description={
          lang === 'tr'
            ? 'İmalat, finans ve perakende sektörlerinden dönüşüm vakaları. Ölçülebilir sonuçlar, kanıtlanmış metodoloji.'
            : 'Transformation cases from manufacturing, finance, and retail sectors. Measurable results, proven methodology.'
        }
        canonical="/calismalar"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
          {
            name: lang === 'tr' ? 'Çalışmalar' : 'Case Studies',
            url: 'https://ecypro.com/calismalar',
          },
        ])}
      />
      <JsonLd data={itemListJsonLd} />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <FadeIn>
          <p className="text-secondary text-sm font-semibold tracking-widest uppercase mb-4">
            {lang === 'tr' ? 'Kanıtlanmış Sonuçlar' : 'Proven Results'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            {lang === 'tr' ? 'Vaka Çalışmaları' : 'Case Studies'}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mb-12 leading-relaxed">
            {lang === 'tr'
              ? 'Aday süreçlerimizde müşteri gizliliği esastır. Paylaştığımız vakalar, müşteri onayıyla ve detaylar anonimleştirilerek hazırlanmıştır.'
              : 'Client confidentiality is paramount in our engagement process. Shared cases are prepared with client approval and anonymized details.'}
          </p>
        </FadeIn>

        {/* Sector filter */}
        <FadeIn>
          <div
            className="flex flex-wrap gap-2 mb-12"
            role="group"
            aria-label={lang === 'tr' ? 'Sektöre göre filtrele' : 'Filter by sector'}
          >
            <button
              type="button"
              onClick={() => setActiveSector(ALL_SECTORS)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                activeSector === ALL_SECTORS
                  ? 'bg-secondary text-neutral'
                  : 'border border-white/20 text-slate-300 hover:border-secondary/40'
              }`}
              aria-pressed={activeSector === ALL_SECTORS}
            >
              {lang === 'tr' ? 'Tümü' : 'All'}
            </button>
            {sectors.map((sector) => (
              <button
                key={sector}
                type="button"
                onClick={() => setActiveSector(sector)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                  activeSector === sector
                    ? 'bg-secondary text-neutral'
                    : 'border border-white/20 text-slate-300 hover:border-secondary/40'
                }`}
                aria-pressed={activeSector === sector}
              >
                {sector}
              </button>
            ))}
          </div>
        </FadeIn>

        <div className="space-y-8 mb-20">
          {visible.map((study, i) => (
            <FadeIn key={study.id} delay={i * 0.06}>
              <article
                className="glass-card p-8 rounded-xl"
                aria-labelledby={`cs-title-${study.id}`}
              >
                {study.ownerDraft && (
                  <div
                    className="inline-block bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-4"
                    role="note"
                    aria-label="Owner onayı bekleniyor"
                  >
                    [OWNER-DRAFT] —{' '}
                    {lang === 'tr' ? 'İçerik Onay Bekliyor' : 'Awaiting Owner Approval'}
                  </div>
                )}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-secondary text-xs font-semibold uppercase tracking-wide mb-2">
                      {study.sector[lang]}
                    </p>
                    <h2 id={`cs-title-${study.id}`} className="text-xl font-bold text-primary">
                      {study.title[lang]}
                    </h2>
                  </div>
                  <div className="flex gap-4">
                    {study.metrics.map((m, mi) => (
                      <div key={mi} className="text-center">
                        <p className="text-2xl font-bold text-secondary">{m.value}</p>
                        <p className="text-xs text-slate-500">{m.label[lang]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide mb-2">
                      {lang === 'tr' ? 'Zorluk' : 'Challenge'}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {study.challenge[lang]}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide mb-2">
                      {lang === 'tr' ? 'Yaklaşım' : 'Approach'}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{study.approach[lang]}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide mb-2">
                      {lang === 'tr' ? 'Sonuç' : 'Outcome'}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{study.outcome[lang]}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {study.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full border border-white/10 text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="glass-card p-10 rounded-2xl text-center border border-secondary/20">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {lang === 'tr'
                ? 'Benzer Bir Dönüşüm Hedefliyorsunuz?'
                : 'Targeting a Similar Transformation?'}
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              {lang === 'tr'
                ? 'Her aday sürecinde vaka detaylarını şeffaf paylaşırız. Discovery çağrısında sektörünüze özel referansları görüşelim.'
                : "We share case details transparently in every engagement process. Let's discuss sector-specific references in the discovery call."}
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
