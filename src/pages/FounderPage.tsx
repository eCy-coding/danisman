/**
 * L1-6 — /founder page
 *
 * Emre Can Yalçın bio + Big4 vs Boutique comparison + manifesto + career timeline.
 * Replaces the Navigate-to-/about redirect.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from '@/lib/seo-helmet';
import { ArrowRight, CheckCircle2, Clock, Target, ExternalLink, Award } from 'lucide-react';
import { JsonLd } from '../components/seo/JsonLd';
import { buildFounderSchema } from '../lib/seo/founder-schema';
import { buildCanonical } from '@/i18n/canonical';
import { FOUNDER_BIOS } from '@/data/founder-bios';
import { FounderPortrait } from '@/components/common/FounderPortrait';
import { PageWrapper } from '../components/layout/PageWrapper';
import { FadeIn } from '../components/common/FadeIn';

const PHILOSOPHY = [
  {
    title: 'Boutique Hız, Big4 Derinliği',
    desc: 'Bürokratik süreçleri ortadan kaldırarak kurumsal düzeyde analitik kaliteyi gerçek zamanlı sunuyoruz. Kararlar hızlı alınır; uygulama hızlı başlar.',
    icon: '⚡',
  },
  {
    title: 'Türkiye-AB Köprüsü',
    desc: "İstanbul'dan Londra'ya çift pazardaki yerel bağlam ve küresel standartları tek çatıda birleştiriyoruz. Bu köprü, müşterilerimizin rekabet avantajıdır.",
    icon: '🌉',
  },
  {
    title: 'Sonuca Taahhüt',
    desc: 'Her engagement sabit fiyat ve ölçülebilir KPI ile başlar. Founder seviyesinde taahhüt — junior analist değil, stratejist sahada.',
    icon: '🎯',
  },
];

const BIG4_COMPARISON = [
  {
    criterion: 'Ekip',
    big4: '15-40 kişi (çoğu junior analist)',
    boutique: 'Founder direkt katılım',
  },
  {
    criterion: 'Fiyatlandırma',
    big4: 'Saatlik 3.000-8.000 USD/gün',
    boutique: 'Sabit fiyat (fixed-scope)',
  },
  {
    criterion: 'Süre',
    big4: '6-18 ay ortalama',
    boutique: '12 hafta ortalama',
  },
  {
    criterion: 'Esneklik',
    big4: 'Standart playbook',
    boutique: 'Şirkete özel metodoloji',
  },
  {
    criterion: 'Taahhüt',
    big4: 'Sürece taahhüt',
    boutique: 'Sonuca taahhüt',
  },
  {
    criterion: 'Minimum bütçe',
    big4: '1.000.000 USD+',
    boutique: "₺150.000'dan başlayan",
  },
];

const TIMELINE = [
  { year: '2015', event: 'Danışmanlık kariyerinin başlangıcı — Kurumsal strateji' },
  { year: '2017', event: 'İlk M&A projesi: Türk sanayi holdingi çıkış stratejisi' },
  { year: '2019', event: 'Londra ofisi — Türkiye-AB yatırım köprüsü çalışmaları' },
  { year: '2021', event: "eCyPro Premium Consulting'in kuruluşu" },
  { year: '2023', event: 'ESG & Sürdürülebilirlik pratiğinin genişletilmesi' },
  { year: '2025', event: '40+ tamamlanan proje; 5 sektör, 2 kıta' },
];

const CREDENTIALS = ['MBA · Stratejik Yönetim', '10+ Yıl Danışmanlık', 'İstanbul · Londra · AB'];

export const FounderPage: React.FC = () => {
  const bio300 = FOUNDER_BIOS.tr['300w'].text;
  const founderSchema = buildFounderSchema();

  return (
    <>
      <Helmet>
        {/* P32-T12: keyword-optimised title (primary: "stratejik danışman" / "strategy consultant Turkey") */}
        <title>Emre Can Yalçın — Kurucu Stratejik Danışman | eCyPro Consulting</title>
        <meta
          name="description"
          content="Emre Can Yalçın — eCyPro kurucusu, Türkiye-AB köprüsünde stratejik danışman. 10+ yıl deneyim, 120+ karar, Big4 metodolojisi boutique çevikliğiyle. Her projede doğrudan eşlik eder."
        />
        <link rel="canonical" href={buildCanonical('/founder', 'tr')} />
        <meta property="og:title" content="Emre Can Yalçın — Kurucu Stratejik Danışman | eCyPro" />
        <meta
          property="og:description"
          content="10+ yıl danışmanlık, 120+ stratejik karar. Türkiye-AB köprüsünde Big4-alternatif boutique lider."
        />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={buildCanonical('/founder', 'tr')} />
        <meta property="og:image" content="https://www.ecypro.com/og/founder.png" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Emre Can Yalçın — Kurucu & Baş Stratejist | eCyPro" />
        <meta
          name="twitter:description"
          content="10+ yıl danışmanlık, 120+ stratejik karar. Big4 metodolojisi boutique çevikliğiyle."
        />
        <meta name="twitter:image" content="https://www.ecypro.com/og/founder.png" />
      </Helmet>
      <JsonLd data={founderSchema} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Anasayfa', item: 'https://www.ecypro.com/' },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Kurucu',
              item: 'https://www.ecypro.com/founder',
            },
          ],
        }}
      />

      <PageWrapper className="bg-neutral">
        {/* ── Hero ── */}
        <section className="relative pt-32 pb-16 px-6 md:px-12 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_30%_0%,rgba(37,99,235,0.08),transparent)] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto">
            <FadeIn>
              <nav className="text-sm text-slate-500 mb-10" aria-label="Breadcrumb">
                <Link to="/" className="hover:text-secondary transition-colors">
                  Anasayfa
                </Link>
                <span className="mx-2 text-slate-700">/</span>
                <span className="text-slate-300">Kurucu</span>
              </nav>
            </FadeIn>

            <div className="grid md:grid-cols-[1.5fr_1fr] gap-12 items-start">
              <FadeIn>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-[10px] font-bold tracking-[0.25em] text-secondary uppercase mb-6">
                  <Award size={11} aria-hidden="true" />
                  Kurucu & Baş Stratejist
                </span>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-3 leading-tight">
                  Emre Can Yalçın
                </h1>
                <p className="text-xl text-slate-400 mb-6">Kurucu & Yönetim Danışmanı</p>

                <ul className="flex flex-wrap gap-2 mb-8" aria-label="Uzmanlık alanları">
                  {CREDENTIALS.map((c) => (
                    <li
                      key={c}
                      className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-300"
                    >
                      {c}
                    </li>
                  ))}
                </ul>

                <p className="text-slate-300 leading-relaxed mb-8 text-lg">{bio300}</p>

                <div className="flex flex-wrap gap-4 mb-10">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20"
                    data-cta="founder-contact"
                    data-track="cta-click"
                  >
                    Keşif Görüşmesi Al <ArrowRight size={18} />
                  </Link>
                  <a
                    href="https://linkedin.com/in/emrecnyalcin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 hover:border-white/30 transition-colors"
                    data-cta="founder-linkedin"
                    data-track="cta-click"
                  >
                    LinkedIn <ExternalLink size={16} />
                  </a>
                </div>

                <ul className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
                  <li className="inline-flex items-center gap-2">
                    <Clock size={14} className="text-secondary" aria-hidden="true" />
                    10+ yıl pratik
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <Target size={14} className="text-secondary" aria-hidden="true" />
                    120+ stratejik karar
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-secondary" aria-hidden="true" />
                    12+ sektör
                  </li>
                </ul>
              </FadeIn>

              <div className="flex justify-center md:justify-end">
                <FounderPortrait size="xl" className="max-w-[320px] w-full" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Big4 vs Boutique Comparison ── */}
        <section
          aria-labelledby="comparison-title"
          className="px-6 md:px-12 py-20 border-t border-white/10"
        >
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-12">
                <h2
                  id="comparison-title"
                  className="text-3xl md:text-4xl font-serif font-bold text-white mb-4"
                >
                  Big4 Danışmanlığı mı, <span className="text-secondary">Boutique mi?</span>
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Mid-market şirketler için doğru seçim neden eCyPro gibi boutique firmalardan
                  geçiyor.
                </p>
              </div>
            </FadeIn>

            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table
                className="w-full text-sm"
                aria-label="Big4 vs eCyPro Boutique karşılaştırması"
              >
                <thead>
                  <tr className="border-b border-white/10">
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500 w-32"
                    >
                      Kriter
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500"
                    >
                      Big4 Danışmanlığı
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-secondary"
                    >
                      eCyPro Boutique
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {BIG4_COMPARISON.map(({ criterion, big4, boutique }, i) => (
                    <tr
                      key={criterion}
                      className={i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}
                    >
                      <td className="px-6 py-4 font-medium text-slate-400 whitespace-nowrap">
                        {criterion}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{big4}</td>
                      <td className="px-6 py-4 text-slate-200 font-medium">{boutique}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              Big4 metodolojisi + boutique çevikliği. Üst yönetim seviyesinde stratejik karar destek
              ve sahada uygulama disiplini birlikte.
            </p>
          </div>
        </section>

        {/* ── Philosophy ── */}
        <section
          aria-labelledby="philosophy-title"
          className="px-6 md:px-12 py-20 border-t border-white/10"
        >
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <h2
                id="philosophy-title"
                className="text-3xl md:text-4xl font-serif font-bold text-white mb-12 text-center"
              >
                Danışmanlık Felsefesi
              </h2>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-6">
              {PHILOSOPHY.map(({ title, desc, icon }) => (
                <FadeIn key={title}>
                  <div className="h-full bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-secondary/30 transition-colors">
                    <div className="text-3xl mb-4" aria-hidden="true">
                      {icon}
                    </div>
                    <h3 className="font-bold text-white mb-3">{title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Career Timeline ── */}
        <section
          aria-labelledby="timeline-title"
          className="px-6 md:px-12 py-20 border-t border-white/10"
        >
          <div className="max-w-3xl mx-auto">
            <FadeIn>
              <h2
                id="timeline-title"
                className="text-3xl md:text-4xl font-serif font-bold text-white mb-12"
              >
                Kariyer Yolculuğu
              </h2>
            </FadeIn>

            <ol aria-label="Kariyer zaman çizelgesi" className="space-y-0">
              {TIMELINE.map(({ year, event }, i) => (
                <li key={year} className="relative flex gap-6 pb-8 last:pb-0">
                  <div className="flex flex-col items-center" aria-hidden="true">
                    <div className="w-3 h-3 rounded-full bg-secondary z-10 mt-1 shrink-0" />
                    {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                  </div>
                  <div className="pb-2">
                    <time dateTime={year} className="text-xs font-bold text-secondary">
                      {year}
                    </time>
                    <p className="text-sm text-slate-300 mt-1">{event}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Founder Letters CTA ── */}
        <section className="px-6 md:px-12 py-20 border-t border-white/10">
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn>
              <span className="inline-block text-xs font-bold tracking-widest text-secondary uppercase mb-4">
                Kurucu Mektupları
              </span>
              <h2 className="text-3xl font-serif font-bold text-white mb-4">
                Düşünceler, Analizler, Sektörel Gözlemler
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Strateji, yönetişim ve Türkiye-AB iş dünyasına dair çeyreklik bakış açıları.
                LinkedIn'de 2.000+ profesyonele ulaşan içerikler.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/insights"
                  className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20"
                  data-cta="founder-insights"
                  data-track="cta-click"
                >
                  İçgörüleri İncele <ArrowRight size={18} />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 hover:border-white/30 transition-colors"
                  data-cta="founder-discovery"
                  data-track="cta-click"
                >
                  Discovery Call · 45dk Ücretsiz
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      </PageWrapper>
    </>
  );
};

export default FounderPage;
