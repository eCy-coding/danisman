import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { startLenis, stopLenis } from '@/lib/motion/lenis-config';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
// P46 C2: SeoHead layout seviyesinden kaldırıldı — generic title flush per-page'i eziyordu.
// import { SeoHead } from '../seo/SeoHead';
import { BackToTop } from '../common/BackToTop';
import { SmartCTA } from '../common/SmartCTA';
import { GeoBanner } from '../common/GeoBanner';
// P45: UrgencyBanner disabled — "Bu ay yalnızca 3 danışmanlık slotu kaldı +
// haftalık geri sayım" sahte kıtlık göstergesiydi. Premium consulting brand
// pozisyonuna uygun değil.
// import { UrgencyBanner } from '../common/UrgencyBanner';
import { SocialProofToast } from '../common/SocialProofToast';
import { ExitIntentModal } from '../common/ExitIntentModal';
import { MobileBottomNav } from './MobileBottomNav';
import { PageLoadingBar } from './PageLoadingBar';
import { AnalyticsDevOverlay } from '../dev/AnalyticsDevOverlay';
import { InstallPrompt } from '../pwa/InstallPrompt';
import { UpdatePrompt } from '../pwa/UpdatePrompt';
import { SkipLinks } from '../common/SkipLinks';
import { MobileStickyCTA } from '../common/MobileStickyCTA';

export const MainLayout: React.FC = () => {
  useEffect(() => {
    startLenis();
    return stopLenis;
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-neutral text-slate-300 selection:bg-secondary selection:text-white">
      {/* P15 — i18n skip link (TR + EN, single source via SkipLinks). */}
      <SkipLinks />
      {/* P46 C2: Layout seviyesinde <SeoHead /> kaldırıldı — her route'ta aynı
          default başlığı flush ediyor, per-page <SEO /> başlığını eziyordu.
          Title/desc/canonical artık her sayfanın kendi <SEO />'su ile yönetiliyor. */}
      {/* P45: <UrgencyBanner /> kaldırıldı — sahte kıtlık göstergesi. */}
      <GeoBanner />
      {/* A11y: banner landmark — Navbar tek başına <nav>'dı, sayfada <header>
          landmark'ı yoktu (render tanısı: headers:0). */}
      <header>
        <Navbar />
      </header>
      <main className="grow pt-24" role="main" id="main-content">
        <Outlet />
      </main>
      <Footer />
      <aside aria-label="Utilities">
        <BackToTop />
        <SmartCTA />
        <SocialProofToast />
        <ExitIntentModal />
        <MobileBottomNav />
        <MobileStickyCTA />
        <InstallPrompt />
        <UpdatePrompt />
      </aside>
      <PageLoadingBar />
      {import.meta.env.DEV && <AnalyticsDevOverlay />}
    </div>
  );
};
