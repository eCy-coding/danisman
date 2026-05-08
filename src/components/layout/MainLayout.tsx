import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { SeoHead } from '../seo/SeoHead';
import { BackToTop } from '../common/BackToTop';
import { SmartCTA } from '../common/SmartCTA';
import { GeoBanner } from '../common/GeoBanner';
import { UrgencyBanner } from '../common/UrgencyBanner';
import { SocialProofToast } from '../common/SocialProofToast';
import { ExitIntentModal } from '../common/ExitIntentModal';
import { MobileBottomNav } from './MobileBottomNav';
import { PageLoadingBar } from './PageLoadingBar';
import { AnalyticsDevOverlay } from '../dev/AnalyticsDevOverlay';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-neutral text-slate-300 selection:bg-secondary selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:font-bold focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        Jump to main content
      </a>
      <SeoHead
        title="EcyPro | Stratejik Yönetim Danışmanlığı"
        description="EcyPro, kurumsal yönetim danışmanlığı, etkinlik yönetimi ve dijital marka çözümleriyle işinizi büyütür. Global standartlarda stratejik iş ortağınız."
      />
      <UrgencyBanner />
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
      </aside>
      <PageLoadingBar />
      {import.meta.env.DEV && <AnalyticsDevOverlay />}
    </div>
  );
};
