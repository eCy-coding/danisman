import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
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
  // Perf: 'lenis' (+ its GSAP ScrollTrigger wiring) is a scroll-feel
  // enhancement, not needed for first paint/LCP. Statically importing
  // startLenis/stopLenis pulled the whole lenis-config module — and the
  // 'lenis' package — into the initial bundle graph even though startLenis()
  // often bails immediately (reduced-motion / coarse-mobile guards inside
  // lenis-config.ts). Dynamic-import it, deferred to browser idle, so it
  // ships in its own chunk fetched after the critical path is done.
  useEffect(() => {
    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let stopFn: (() => void) | null = null;

    const load = () => {
      import('@/lib/motion/lenis-config').then(({ startLenis, stopLenis }) => {
        if (cancelled) return;
        startLenis();
        stopFn = stopLenis;
      });
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(load, { timeout: 2000 });
    } else {
      // Safari (no requestIdleCallback) fallback.
      timeoutId = setTimeout(load, 200);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      stopFn?.();
    };
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
