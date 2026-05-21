import React, { Suspense } from 'react';
import { Hero } from '../components/sections/Hero';
import { SEO } from '../components/common/SEO';
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
  const title =
    lang === 'tr'
      ? 'eCyPro Premium Consulting — Stratejik Yönetim & Dijital Dönüşüm'
      : 'eCyPro Premium Consulting — Strategic Management & Digital Transformation';
  const description =
    lang === 'tr'
      ? 'eCyverse ekosisteminin premium danışmanlık kolu. Organizasyonel dönüşüm, stratejik danışmanlık ve kültür mühendisliği ile Türkiye merkezli, AB pazarlarında engagement deneyimi.'
      : 'The premium consulting arm of the eCyverse ecosystem. Organizational transformation, strategic advisory, and culture engineering — Türkiye-based with engagement experience across EU markets.';

  return (
    <>
      <SEO title={title} description={description} canonical="/" />
      <Hero />
      <TrustBar />
      <Suspense fallback={<div className="min-h-screen" />}>
        <LandingContent />
      </Suspense>
    </>
  );
};
