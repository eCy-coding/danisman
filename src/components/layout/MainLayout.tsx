import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { SeoHead } from '../seo/SeoHead';
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

export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-neutral text-slate-300 selection:bg-secondary selection:text-white">
      {/* P15 — i18n skip link (TR + EN, single source via SkipLinks). */}
      <SkipLinks />
      <SeoHead
        title="EcyPro | Stratejik Yönetim Danışmanlığı"
        description="EcyPro, kurumsal yönetim danışmanlığı, etkinlik yönetimi ve dijital marka çözümleriyle işinizi büyütür. Global standartlarda stratejik iş ortağınız."
      />
      {/* P45: <UrgencyBanner /> kaldırıldı — sahte kıtlık göstergesi. */}
      <GeoBanner />
      <Navbar />
      <main className="grow pt-24" role="main" id="main-content">
        <Outlet />
      </main>
      <Footer />
      <aside aria-label="Utilities">
        <CookieBanner />
        <BackToTop />
        <SmartCTA />
        <SocialProofToast />
        <ExitIntentModal />
        <MobileBottomNav />
        <InstallPrompt />
        <UpdatePrompt />
      </aside>
      <PageLoadingBar />
      {import.meta.env.DEV && <AnalyticsDevOverlay />}
    </div>
  );
};
