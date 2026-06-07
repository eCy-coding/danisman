import React, { Suspense } from 'react';
import { Hero } from '../components/sections/Hero';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { useTranslation } from '../lib/i18n';
import { ShieldCheck, Clock, Target, Globe } from 'lucide-react';

// P44: trivial content change forces a new lp.js content hash/etag so Vercel's
// edge cache can no longer serve the poisoned text/plain response that broke
// every visitor's dynamic import on the homepage. See vercel.json MIME fix.
// Lazy load heavy below-fold content
const LandingContent = React.lazy(() => import('@/components/sections/LandingContent'));

// P46 C6: Trust signals mini-bar — homepage hero altında konservatif sosyal
// kanıt sıralaması. Conversion için trust signal sahnelemesi ama "fake" yok:
// sayılar P42 doctrine ile sync (5+ yıl, 120+ stratejik karar).
const TRUST_PILLS = [
  { icon: Clock, tr: '5+ yıl pratik', en: '5+ years practice' },
  { icon: Target, tr: '120+ stratejik karar', en: '120+ strategic decisions' },
  { icon: ShieldCheck, tr: 'KVKK & GDPR uyumlu', en: 'KVKK & GDPR compliant' },
  { icon: Globe, tr: '24 saat içinde yanıt', en: '24h response SLA' },
];

const TrustBar: React.FC = () => {
  const { language: lang } = useTranslation();
  return (
    <section
      aria-label={lang === 'tr' ? 'Güven göstergeleri' : 'Trust signals'}
      className="border-y border-white/5 bg-white/2"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-5">
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs md:text-sm text-slate-400">
          {TRUST_PILLS.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.tr} className="inline-flex items-center gap-2 min-h-[44px]">
                <Icon size={14} className="text-secondary" aria-hidden="true" />
                <span className="font-medium tracking-wide">{lang === 'tr' ? p.tr : p.en}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export const LandingPage: React.FC = () => {
  // P46 C2: Homepage SEO — was relying on SeoManager defaults; now sets per-page
  // title/description/canonical so SeoManager fallback isn't needed.
  const { language: lang } = useTranslation();
  // P32-T12: keyword-optimised title/description per keyword matrix (brain/seo/keywords-2026-05.md).
  // TR primary: "stratejik danışmanlık" + "KVKK danışmanlık" | EN primary: "KVKK compliance consulting".
  // S13-R3-S4 — TR title was 63 chars and got truncated in mobile SERP
  // (~580px ≈ 60 chars). Trimmed to ~43 chars without losing the keyword
  // pair or the brand token.
  // S13-R3-S13 — descriptions were 165/168 chars. Both trimmed to ≤155
  // (Google snippet cap before truncation indicator).
  const title =
    lang === 'tr'
      ? 'Stratejik Danışmanlık & KVKK Uyumu | eCyPro'
      : 'KVKK Compliance & Strategic Consulting | eCyPro';
  const description =
    lang === 'tr'
      ? 'eCyPro: Stratejik danışmanlık, KVKK ve AB regülasyon uyumu, operasyonel verimlilik. Boutique Big4-alternatif — Emre Can Yalçın doğrudan eşlik eder.'
      : 'eCyPro: KVKK compliance consulting, GDPR advisory, strategic management & digital transformation. Turkey–EU boutique firm, founder-led.';

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical="/"
        image="https://www.ecypro.com/og/home.png"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': 'https://www.ecypro.com/#website',
          name: 'eCyPro Premium Consulting',
          url: 'https://www.ecypro.com',
          description:
            lang === 'tr'
              ? 'Stratejik danışmanlık, KVKK ve AB regülasyon uyumu, operasyonel verimlilik.'
              : 'Strategic management consulting, KVKK compliance, and EU regulatory advisory.',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://www.ecypro.com/insights?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
          },
          publisher: { '@id': 'https://www.ecypro.com/#organization' },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: lang === 'tr' ? 'Anasayfa' : 'Home',
              item: 'https://www.ecypro.com/',
            },
          ],
        }}
      />
      <Hero />
      <TrustBar />
      <Suspense fallback={<div className="min-h-screen" />}>
        <LandingContent />
      </Suspense>
    </>
  );
};
