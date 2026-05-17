import React, { Suspense } from 'react';
import { Hero } from '../components/sections/Hero';
import { SEO } from '../components/common/SEO';
import { useTranslation } from '../lib/i18n';

// P44: trivial content change forces a new lp.js content hash/etag so Vercel's
// edge cache can no longer serve the poisoned text/plain response that broke
// every visitor's dynamic import on the homepage. See vercel.json MIME fix.
// Lazy load heavy below-fold content
const LandingContent = React.lazy(() => import('@/components/sections/LandingContent'));

export const LandingPage: React.FC = () => {
  // P46 C2: Homepage SEO — was relying on SeoManager defaults; now sets per-page
  // title/description/canonical so SeoManager fallback isn't needed.
  const { language: lang } = useTranslation();
  const title =
    lang === 'tr'
      ? 'EcyPro Premium Consulting — Stratejik Yönetim & Dijital Dönüşüm'
      : 'EcyPro Premium Consulting — Strategic Management & Digital Transformation';
  const description =
    lang === 'tr'
      ? 'eCyverse ekosisteminin premium danışmanlık kolu. Organizasyonel dönüşüm, stratejik danışmanlık ve kültür mühendisliği ile Türkiye merkezli, AB pazarlarında engagement deneyimi.'
      : 'The premium consulting arm of the eCyverse ecosystem. Organizational transformation, strategic advisory, and culture engineering — Türkiye-based with engagement experience across EU markets.';

  return (
    <>
      <SEO title={title} description={description} canonical="/" />
      <Hero />
      <Suspense fallback={<div className="min-h-screen" />}>
        <LandingContent />
      </Suspense>
    </>
  );
};
