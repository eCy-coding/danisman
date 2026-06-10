import React, { Suspense, useState, useEffect } from 'react';
// P76: Lazy-load non-critical UI components to reduce main bundle size
const BookingModal = React.lazy(() =>
  import('./components/features/booking/BookingModal').then((m) => ({ default: m.BookingModal })),
);
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProviders } from './components/providers/AppProviders';
import { NotFoundPage } from './pages/NotFoundPage';
import { director } from '@/lib/director';
import { SovereignBoundary } from './components/ui/SovereignBoundary';
import { RouteContainer } from './components/error/RouteContainer';
import { Logger } from './lib/logger';

// P44: LandingPage is statically imported now. The previous lazy split
// produced /assets/lp.js which Vercel's edge cache pinned with the wrong
// MIME type (text/plain) from an earlier build, breaking every visitor's
// initial dynamic import (Failed to fetch dynamically imported module).
// Bundling it into main resolves the cache poison once and for all.
import { LandingPage } from './pages/LandingPage';

// Lazy load pages for code splitting (Dashboard & Inner pages only)
import { SchemaOrg } from './components/seo/SchemaOrg';
// P15 — Hreflang component'i kaldırıldı. SeoManager artık tek otorite
// (RFC 5646 path-based hreflang). Çift mount Google'da konfüze etmesin.
const DashboardPage = React.lazy(() =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const ServicesPage = React.lazy(() =>
  import('./pages/ServicesPage').then((module) => ({ default: module.ServicesPage })),
);
const ServiceDetailPage = React.lazy(() =>
  import('./pages/ServiceDetailPage').then((module) => ({ default: module.ServiceDetailPage })),
);
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage'));
const BlogPage = React.lazy(() => import('./pages/BlogPage'));
const InsightsPage = React.lazy(() =>
  import('./pages/InsightsPage').then((module) => ({ default: module.InsightsPage })),
);
const InsightArticle = React.lazy(() =>
  import('./pages/InsightArticle').then((module) => ({ default: module.InsightArticle })),
);
const AboutPage = React.lazy(() =>
  import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })),
);
// Static import for debugging
// import { CaseStudiesPage } from '@/pages/CaseStudiesPage';
const CaseStudiesPage = React.lazy(() =>
  import('./pages/CaseStudiesPage').then((module) => ({ default: module.CaseStudiesPage })),
);
const CaseStudyDetailPage = React.lazy(() =>
  import('./pages/CaseStudyDetailPage').then((module) => ({ default: module.CaseStudyDetailPage })),
);
const PricingPage = React.lazy(() =>
  import('./pages/PricingPage').then((module) => ({ default: module.PricingPage })),
);
const TeamPage = React.lazy(() =>
  import('./pages/TeamPage').then((module) => ({ default: module.TeamPage })),
);
const ContactPage = React.lazy(() =>
  import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })),
);
const FaqPage = React.lazy(() =>
  import('./pages/FaqPage').then((module) => ({ default: module.FaqPage })),
);
const CareersPage = React.lazy(() =>
  import('./pages/CareersPage').then((module) => ({ default: module.CareersPage })),
);
const IndustriesPage = React.lazy(() =>
  import('./pages/IndustriesPage').then((module) => ({ default: module.IndustriesPage })),
);
const MethodologyPage = React.lazy(() =>
  import('./pages/MethodologyPage').then((module) => ({ default: module.MethodologyPage })),
);
const FounderPage = React.lazy(() =>
  import('./pages/FounderPage').then((module) => ({ default: module.FounderPage })),
);
const PartnersPage = React.lazy(() =>
  import('./pages/PartnersPage').then((module) => ({ default: module.PartnersPage })),
);

const EventsPage = React.lazy(() =>
  import('./pages/EventsPage').then((module) => ({ default: module.EventsPage })),
);
const LocationsPage = React.lazy(() =>
  import('./pages/LocationsPage').then((module) => ({ default: module.LocationsPage })),
);
const PrivacyPage = React.lazy(() =>
  import('./pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })),
);
const DataRightsPage = React.lazy(() =>
  import('./pages/DataRightsPage').then((module) => ({ default: module.DataRightsPage })),
);
const TermsPage = React.lazy(() =>
  import('./pages/TermsPage').then((module) => ({ default: module.TermsPage })),
);
const CookiePage = React.lazy(() =>
  import('./pages/CookiePage').then((module) => ({ default: module.CookiePage })),
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = React.lazy(() =>
  import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })),
);
const ForgotPasswordPage = React.lazy(() =>
  import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })),
);

// Wave-3A PB-6: Perspektif secondary pages
const InsightCategory = React.lazy(() =>
  import('./pages/InsightCategory').then((m) => ({ default: m.InsightCategory })),
);
const InsightTag = React.lazy(() =>
  import('./pages/InsightTag').then((m) => ({ default: m.InsightTag })),
);
const InsightSeries = React.lazy(() =>
  import('./pages/InsightSeries').then((m) => ({ default: m.InsightSeries })),
);
const InsightAuthor = React.lazy(() =>
  import('./pages/InsightAuthor').then((m) => ({ default: m.InsightAuthor })),
);
const InsightArchive = React.lazy(() =>
  import('./pages/InsightArchive').then((m) => ({ default: m.InsightArchive })),
);
const InsightSearch = React.lazy(() =>
  import('./pages/InsightSearch').then((m) => ({ default: m.InsightSearch })),
);

// const KeystaticPage = React.lazy(() => import('./src/app/keystatic/page')); // Moved to MPA
const AssessmentPage = React.lazy(() =>
  import('./pages/AssessmentPage').then((module) => ({ default: module.AssessmentPage })),
);

// P52: P51 Phase 4 content pages — lazy import for code split.
const PillarPage = React.lazy(() => import('./pages/PillarPage'));
const PressKitPage = React.lazy(() => import('./pages/PressKitPage'));
const SpeakingPage = React.lazy(() => import('./pages/SpeakingPage'));
const IndustryReportPage = React.lazy(() => import('./pages/IndustryReportPage'));
const WebinarLandingPage = React.lazy(() => import('./pages/WebinarLandingPage'));
const AnnualReportPage = React.lazy(() => import('./pages/AnnualReportPage'));
const NewsletterStatusPage = React.lazy(() => import('./pages/NewsletterStatusPage'));
// P77.B: Dedicated Discovery Call landing page (Calendly embed)
const DiscoveryCallPage = React.lazy(() => import('./pages/DiscoveryCallPage'));
// L1-3: Discovery form with lead capture
const DiscoveryPage = React.lazy(() => import('./pages/Discovery'));
// Track B: post-conversion landing
const ThankYouPage = React.lazy(() => import('./pages/ThankYouPage'));
// Track 4: KVKK Quick-Check + Pricing Calculator lead magnets
const QuickCheckPage = React.lazy(() => import('./pages/QuickCheckPage'));
const PricingCalculatorPage = React.lazy(() => import('./pages/PricingCalculatorPage'));

// Competitor gap routes: sektörler hub, sektör mikro-sayfalar, güvence, araçlar, çalışmalar
const SektorlerPage = React.lazy(() =>
  import('./pages/SektorlerPage').then((m) => ({ default: m.SektorlerPage })),
);
const SektorlerImalatPage = React.lazy(() =>
  import('./pages/SektorlerImalatPage').then((m) => ({ default: m.SektorlerImalatPage })),
);
const SektorlerFinansalPage = React.lazy(() =>
  import('./pages/SektorlerFinansalPage').then((m) => ({ default: m.SektorlerFinansalPage })),
);
const SektorlerIlacPage = React.lazy(() =>
  import('./pages/SektorlerIlacPage').then((m) => ({ default: m.SektorlerIlacPage })),
);
const SektorlerPerakendePage = React.lazy(() =>
  import('./pages/SektorlerPerakendePage').then((m) => ({ default: m.SektorlerPerakendePage })),
);
const SektorlerTeknolojPage = React.lazy(() =>
  import('./pages/SektorlerTeknolojPage').then((m) => ({ default: m.SektorlerTeknolojPage })),
);
const GuvencePage = React.lazy(() =>
  import('./pages/GuvencePage').then((m) => ({ default: m.GuvencePage })),
);
const DenetimHazirlikPage = React.lazy(() =>
  import('./pages/DenetimHazirlikPage').then((m) => ({ default: m.DenetimHazirlikPage })),
);
const CalismalarPage = React.lazy(() =>
  import('./pages/CalismalarPage').then((m) => ({ default: m.CalismalarPage })),
);

const TerminalPage = React.lazy(() =>
  import('./pages/TerminalPage').then((module) => ({ default: module.TerminalPage })),
);
const LiveChat = React.lazy(() => import('./components/integrations/LiveChat'));

// Admin Modules (Lazy)
const AdminLoginPage = React.lazy(() =>
  import('./pages/admin/AdminLogin').then((module) => ({ default: module.AdminLoginPage })),
);
const AdminLayout = React.lazy(() =>
  import('./components/admin/layout/AdminLayout').then((module) => ({
    default: module.AdminLayout,
  })),
);
const AdminDashboard = React.lazy(() =>
  import('./pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })),
);
const AdminServicesPage = React.lazy(() =>
  import('./pages/admin/AdminServicesPage').then((module) => ({
    default: module.AdminServicesPage,
  })),
);
const AdminBookingsPage = React.lazy(() =>
  import('./pages/admin/AdminBookingsPage').then((module) => ({
    default: module.AdminBookingsPage,
  })),
);
const AdminAIPage = React.lazy(() =>
  import('./pages/admin/AdminAIPage').then((module) => ({ default: module.AdminAIPage })),
);
const AdminContactsPage = React.lazy(() =>
  import('./pages/admin/AdminContactsPage').then((module) => ({
    default: module.AdminContactsPage,
  })),
);
const AdminNewsletterPage = React.lazy(() =>
  import('./pages/admin/AdminNewsletterPage').then((module) => ({
    default: module.AdminNewsletterPage,
  })),
);
const AdminCampaignsPage = React.lazy(() => import('./pages/admin/AdminCampaignsPage'));
const AdminOverviewPage = React.lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminBlogEditPage = React.lazy(() => import('./pages/admin/AdminBlogEditPage'));
const AdminServiceEditPage = React.lazy(() => import('./pages/admin/AdminServiceEditPage'));
const AdminPagesListPage = React.lazy(() => import('./pages/admin/AdminPagesListPage'));
const AdminCollectionPage = React.lazy(() => import('./pages/admin/AdminCollectionPage'));
const AdminLeadDetailPage = React.lazy(() => import('./pages/admin/AdminLeadDetailPage'));
const AdminLeadsPage = React.lazy(() =>
  import('./pages/admin/AdminLeadsPage').then((m) => ({ default: m.AdminLeadsPage })),
);
const AdminCampaignWizardPage = React.lazy(() => import('./pages/admin/AdminCampaignWizardPage'));
const AdminMediaLibraryPage = React.lazy(() => import('./pages/admin/AdminMediaLibraryPage'));
const AdminSettingsTabsPage = React.lazy(() => import('./pages/admin/AdminSettingsTabsPage'));
const AdminSecurityPage = React.lazy(() => import('./pages/admin/AdminSecurityPage'));
const AdminProfilePage = React.lazy(() => import('./pages/admin/AdminProfilePage'));
const AdminHelpPage = React.lazy(() => import('./pages/admin/AdminHelpPage'));
const AdminRBACPage = React.lazy(() =>
  import('./pages/admin/AdminRBACPage').then((m) => ({ default: m.AdminRBACPage })),
);
const AdminFounderLetterPage = React.lazy(() =>
  import('./pages/admin/AdminFounderLetterPage').then((m) => ({
    default: m.AdminFounderLetterPage,
  })),
);
// Phase 3 — KVKK Compliance Shield
const AdminDSARPage = React.lazy(() =>
  import('./pages/admin/AdminDSARPage').then((m) => ({ default: m.AdminDSARPage })),
);
const AdminConsentLedgerPage = React.lazy(() =>
  import('./pages/admin/AdminConsentLedgerPage').then((m) => ({
    default: m.AdminConsentLedgerPage,
  })),
);
const AdminROPAPage = React.lazy(() =>
  import('./pages/admin/AdminROPAPage').then((m) => ({ default: m.AdminROPAPage })),
);
const AdminBreachPage = React.lazy(() =>
  import('./pages/admin/AdminBreachPage').then((m) => ({ default: m.AdminBreachPage })),
);
const AdminVERBISPage = React.lazy(() =>
  import('./pages/admin/AdminVERBISPage').then((m) => ({ default: m.AdminVERBISPage })),
);
const AdminRetentionPage = React.lazy(() =>
  import('./pages/admin/AdminRetentionPage').then((m) => ({ default: m.AdminRetentionPage })),
);
// P44-T07 Round-4: ESG / Fintech / Succession were orphan pages (UI built,
// no route, no sidebar link). Pages and Prisma models existed; backend
// stubs added this round. Lazy-loaded to keep the admin bundle slim.
const AdminESGPage = React.lazy(() =>
  import('./pages/admin/AdminESGPage').then((m) => ({ default: m.AdminESGPage })),
);
const AdminFintechCompliancePage = React.lazy(() =>
  import('./pages/admin/AdminFintechCompliancePage').then((m) => ({
    default: m.AdminFintechCompliancePage,
  })),
);
const AdminSuccessionPage = React.lazy(() =>
  import('./pages/admin/AdminSuccessionPage').then((m) => ({ default: m.AdminSuccessionPage })),
);
const AdminPageEditPage = React.lazy(() => import('./pages/admin/AdminPageEditPage'));
const AdminBlogPage = React.lazy(() =>
  import('./pages/admin/AdminBlogPage').then((module) => ({ default: module.AdminBlogPage })),
);
const AdminAnalyticsPage = React.lazy(() =>
  import('./pages/admin/AdminAnalyticsPage').then((module) => ({
    default: module.AdminAnalyticsPage,
  })),
);
const AdminSettingsPage = React.lazy(() =>
  import('./pages/admin/AdminSettingsPage').then((module) => ({
    default: module.AdminSettingsPage,
  })),
);
const AdminUsersPage = React.lazy(() =>
  import('./pages/admin/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })),
);
const BookingManagePage = React.lazy(() =>
  import('./pages/BookingManagePage').then((module) => ({ default: module.BookingManagePage })),
);
const BookingFeedbackPage = React.lazy(() =>
  import('./pages/BookingFeedbackPage').then((module) => ({ default: module.BookingFeedbackPage })),
);
const VerifyEmailPage = React.lazy(() =>
  import('./pages/VerifyEmailPage').then((module) => ({ default: module.VerifyEmailPage })),
);
const AdminSessionsPage = React.lazy(() =>
  import('./pages/admin/AdminSessionsPage').then((module) => ({
    default: module.AdminSessionsPage,
  })),
);
const AdminAuditLogPage = React.lazy(() =>
  import('./pages/admin/AdminAuditLogPage').then((module) => ({
    default: module.AdminAuditLogPage,
  })),
);
const AdminCrmPage = React.lazy(() =>
  import('./pages/admin/AdminCrmPage').then((module) => ({ default: module.AdminCrmPage })),
);
// Phase 2 Revenue Core pages
const AdminDealsPage = React.lazy(() => import('./pages/admin/AdminDealsPage'));
const AdminRetainersPage = React.lazy(() =>
  import('./pages/admin/AdminRetainersPage').then((module) => ({
    default: module.AdminRetainersPage,
  })),
);
const AdminOutreachPage = React.lazy(() =>
  import('./pages/admin/AdminOutreachPage').then((module) => ({
    default: module.AdminOutreachPage,
  })),
);
const AdminDevAnalyticsPage = React.lazy(() =>
  import('./pages/admin/AdminDevAnalyticsPage').then((module) => ({
    default: module.AdminDevAnalyticsPage,
  })),
);
const AdminInsightsPage = React.lazy(() =>
  import('./pages/admin/AdminInsightsPage').then((module) => ({
    default: module.AdminInsightsPage,
  })),
);
const AdminInsightsCategoriesPage = React.lazy(() =>
  import('./pages/admin/AdminInsightsCategoriesPage').then((module) => ({
    default: module.AdminInsightsCategoriesPage,
  })),
);
const AdminInsightsPostsPage = React.lazy(() =>
  import('./pages/admin/AdminInsightsPostsPage').then((module) => ({
    default: module.AdminInsightsPostsPage,
  })),
);
const AdminInsightsPostEditPage = React.lazy(() =>
  import('./pages/admin/AdminInsightsPostEditPage').then((module) => ({
    default: module.AdminInsightsPostEditPage,
  })),
);
const AdminInsightsMetadataPage = React.lazy(() =>
  import('./pages/admin/AdminInsightsMetadataPage').then((module) => ({
    default: module.AdminInsightsMetadataPage,
  })),
);
const StatusPage = React.lazy(() =>
  import('./pages/StatusPage').then((module) => ({ default: module.StatusPage })),
);
const ServerErrorPage = React.lazy(() =>
  import('./pages/ServerErrorPage').then((module) => ({ default: module.ServerErrorPage })),
);
import { ProtectedRoute } from './components/admin/auth/ProtectedRoute';
import { AdminGuard } from './components/admin/auth/AdminGuard';
import { Navigate } from 'react-router-dom';
import { LocaleRoute } from './components/routing/LocaleRoute';
import { LocaleRedirect } from './components/routing/LocaleRedirect';

// Admin panel exposure flag — disabled by default in production builds. Public
// `/admin/*` would otherwise leak the login form to brute-force scanners on
// Day 1 of launch. Production access goes through Cloudflare Access / IP
// allowlist + a one-shot `VITE_ENABLE_ADMIN=1` build (or DEV mode locally).
const ADMIN_ROUTES_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === '1';

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

import { MainLayout } from './components/layout/MainLayout';

import { AnimatePresence } from 'motion/react';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Pages wrapped in Main Layout (Standard Navigation & Footer) */}
        <Route element={<MainLayout />}>
          {/* Legacy "/" route — renders LandingPage (backward compat + E2E) */}
          <Route
            path="/"
            element={
              <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050810' }} />}>
                <LandingPage />
              </Suspense>
            }
          />
          <Route path="/services">
            <Route
              index
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ServicesPage />
                </Suspense>
              }
            />
            <Route
              path=":slug"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ServiceDetailPage />
                </Suspense>
              }
            />
          </Route>
          {/* Flattening the routes for simplicity as per original structure */}
          <Route
            path="/blog/:slug"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <BlogPostPage />
              </Suspense>
            }
          />
          <Route
            path="/blog"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <BlogPage />
              </Suspense>
            }
          />
          {/* /perspektifler canonical alias → /blog */}
          <Route path="/perspektifler" element={<Navigate to="/blog" replace />} />
          {/*
            Sprint 9 P44-T02b — Localized TR slug aliases.
            Türkçe yüksek-niyetli anahtar kelimeler için 301-style SPA redirect.
            Foundation slug map: src/i18n/localized-slugs.ts (PR #168).
            Canonical EN slug page'inde yaşamaya devam ediyor; sonraki atomic PR
            bu yönü ters çevirecek (TR canonical + EN 301 alias) ve SeoManager
            canonical href'lerini güncelleyecek.
          */}
          <Route path="/hizmetler/*" element={<Navigate to="/services" replace />} />
          <Route path="/iletisim" element={<Navigate to="/contact" replace />} />
          <Route path="/fiyatlandirma" element={<Navigate to="/pricing" replace />} />
          <Route path="/hakkimizda" element={<Navigate to="/about" replace />} />
          <Route path="/hizli-kontrol" element={<Navigate to="/quick-check" replace />} />
          <Route
            path="/fiyatlandirma-hesabi"
            element={<Navigate to="/pricing-calculator" replace />}
          />
          <Route path="/kariyer" element={<Navigate to="/careers" replace />} />
          <Route path="/vaka-calismalari" element={<Navigate to="/case-studies" replace />} />
          <Route path="/metodoloji" element={<Navigate to="/methodology" replace />} />
          <Route path="/ekip" element={<Navigate to="/team" replace />} />
          <Route path="/is-ortaklari" element={<Navigate to="/partners" replace />} />
          <Route path="/basin" element={<Navigate to="/press" replace />} />
          <Route path="/etkinlikler" element={<Navigate to="/events" replace />} />
          <Route path="/lokasyonlar" element={<Navigate to="/locations" replace />} />
          <Route path="/gizlilik" element={<Navigate to="/privacy" replace />} />
          <Route path="/kosullar" element={<Navigate to="/terms" replace />} />
          <Route path="/cerezler" element={<Navigate to="/cookies" replace />} />
          <Route path="/sss" element={<Navigate to="/faq" replace />} />
          <Route path="/konusmalar" element={<Navigate to="/speaking" replace />} />
          {/* --- Perspektif Wave-3A PB-6 routes --- */}
          <Route
            path="/insights/search"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <InsightSearch />
              </Suspense>
            }
          />
          <Route
            path="/insights/tag/:slug"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <InsightTag />
              </Suspense>
            }
          />
          <Route
            path="/insights/series/:slug/:part?"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <InsightSeries />
              </Suspense>
            }
          />
          <Route
            path="/insights/author/:slug"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <InsightAuthor />
              </Suspense>
            }
          />
          <Route
            path="/insights/archive/:year?/:month?"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <InsightArchive />
              </Suspense>
            }
          />
          {/* R12-P8 — route order swap. React Router v7 ranks */}
          {/* `/insights/:domain/:subDomain?` higher than `/insights/:slug` */}
          {/* even on a single-segment URL because the optional segment is */}
          {/* still part of the score. Putting `:slug` first ensures real */}
          {/* article URLs hit InsightArticle; domain landing pages remain */}
          {/* reachable via their canonical `/insights/:domain/:subDomain` */}
          {/* two-segment form which is more specific. */}
          <Route
            path="/insights/:slug"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <InsightArticle />
              </Suspense>
            }
          />
          <Route
            path="/insights/:domain/:subDomain?"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <InsightCategory />
              </Suspense>
            }
          />
          {/* --- end Perspektif --- */}
          <Route
            path="/insights"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <InsightsPage />
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AboutPage />
              </Suspense>
            }
          />
          {/* SEO alias for /about — keeps /about-us resolvable */}
          <Route
            path="/about-us"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AboutPage />
              </Suspense>
            }
          />
          <Route
            path="/team"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <TeamPage />
              </Suspense>
            }
          />
          <Route
            path="/contact"
            element={
              <RouteContainer name="ContactPage" fallback={<LoadingFallback />}>
                <ContactPage />
              </RouteContainer>
            }
          />
          <Route
            path="/discovery"
            element={
              <RouteContainer name="DiscoveryPage" fallback={<LoadingFallback />}>
                <DiscoveryPage />
              </RouteContainer>
            }
          />
          <Route
            path="/discovery-call"
            element={
              <RouteContainer name="DiscoveryCallPage" fallback={<LoadingFallback />}>
                <DiscoveryCallPage />
              </RouteContainer>
            }
          />
          <Route
            path="/thank-you"
            element={
              <RouteContainer name="ThankYouPage" fallback={<LoadingFallback />}>
                <ThankYouPage />
              </RouteContainer>
            }
          />
          <Route
            path="/faq"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <FaqPage />
              </Suspense>
            }
          />
          <Route
            path="/careers"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CareersPage />
              </Suspense>
            }
          />
          <Route
            path="/industries"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <IndustriesPage />
              </Suspense>
            }
          />
          {/* Competitor gap routes: /sektorler hub + 5 micro-pages */}
          <Route
            path="/sektorler"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SektorlerPage />
              </Suspense>
            }
          />
          <Route
            path="/sektorler/imalat-sanayi"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SektorlerImalatPage />
              </Suspense>
            }
          />
          <Route
            path="/sektorler/finansal-hizmetler"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SektorlerFinansalPage />
              </Suspense>
            }
          />
          <Route
            path="/sektorler/ilac-saglik"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SektorlerIlacPage />
              </Suspense>
            }
          />
          <Route
            path="/sektorler/perakende-e-ticaret"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SektorlerPerakendePage />
              </Suspense>
            }
          />
          <Route
            path="/sektorler/teknoloji-saas"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SektorlerTeknolojPage />
              </Suspense>
            }
          />
          {/* /guvence — KVKK + bağımsızlık trust page */}
          <Route
            path="/guvence"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <GuvencePage />
              </Suspense>
            }
          />
          {/* /araclar/denetim-hazirlik-skoru — audit readiness calculator */}
          <Route
            path="/araclar/denetim-hazirlik-skoru"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <DenetimHazirlikPage />
              </Suspense>
            }
          />
          {/* /calismalar — TR-canonical case studies hub */}
          <Route
            path="/calismalar"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CalismalarPage />
              </Suspense>
            }
          />
          <Route
            path="/methodology"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <MethodologyPage />
              </Suspense>
            }
          />
          <Route
            path="/partners"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PartnersPage />
              </Suspense>
            }
          />
          <Route
            path="/case-studies"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CaseStudiesPage />
              </Suspense>
            }
          />
          <Route
            path="/case-studies/:slug"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CaseStudyDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/pricing"
            element={
              <RouteContainer name="PricingPage" fallback={<LoadingFallback />}>
                <PricingPage />
              </RouteContainer>
            }
          />
          <Route
            path="/events"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <EventsPage />
              </Suspense>
            }
          />
          <Route
            path="/locations"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <LocationsPage />
              </Suspense>
            }
          />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PrivacyPage />
              </Suspense>
            }
          />
          <Route
            path="/privacy/data-rights"
            element={
              <RouteContainer name="DataRightsPage" fallback={<LoadingFallback />}>
                <DataRightsPage />
              </RouteContainer>
            }
          />
          <Route
            path="/terms"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <TermsPage />
              </Suspense>
            }
          />
          <Route
            path="/cookies"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CookiePage />
              </Suspense>
            }
          />
          <Route
            path="/maturity-assessment"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AssessmentPage />
              </Suspense>
            }
          />
          <Route
            path="/quick-check"
            element={
              <RouteContainer name="QuickCheckPage" fallback={<LoadingFallback />}>
                <QuickCheckPage />
              </RouteContainer>
            }
          />
          <Route
            path="/pricing-calculator"
            element={
              <RouteContainer name="PricingCalculatorPage" fallback={<LoadingFallback />}>
                <PricingCalculatorPage />
              </RouteContainer>
            }
          />
          <Route path="/antigravity-terminal" element={<TerminalPage />} />
          {/* P52: P51 Phase 4 content pages inside MainLayout */}
          <Route
            path="/pillar/:slug"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PillarPage />
              </Suspense>
            }
          />
          <Route
            path="/press"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PressKitPage />
              </Suspense>
            }
          />
          <Route
            path="/speaking"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SpeakingPage />
              </Suspense>
            }
          />
          <Route
            path="/industry-reports/:slug"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <IndustryReportPage />
              </Suspense>
            }
          />
          <Route
            path="/webinars/:slug"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <WebinarLandingPage />
              </Suspense>
            }
          />
          <Route
            path="/annual-report/2025"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AnnualReportPage />
              </Suspense>
            }
          />
          <Route
            path="/newsletter/confirmed"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <NewsletterStatusPage />
              </Suspense>
            }
          />
          <Route
            path="/newsletter/unsubscribed"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <NewsletterStatusPage />
              </Suspense>
            }
          />
          <Route
            path="/newsletter/invalid-token"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <NewsletterStatusPage />
              </Suspense>
            }
          />
          <Route
            path="/status"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <StatusPage />
              </Suspense>
            }
          />
        </Route>

        {/* P45 D5: /404 explicit route. Without this, /:locale wildcard catches
            "404" as a locale → LocaleRoute redirects to /404 → infinite loop →
            blank screen. Specific path matches before wildcard, breaking the loop. */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route
          path="/500"
          element={
            <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050810' }} />}>
              <ServerErrorPage />
            </Suspense>
          }
        />

        {/* P39-T02: Locale-prefixed routes — /tr/* and /en/* */}
        {/* These parallel the existing routes and set i18next language from URL */}
        <Route path="/:locale" element={<LocaleRoute />}>
          <Route element={<MainLayout />}>
            <Route
              index
              element={
                <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050810' }} />}>
                  <LandingPage />
                </Suspense>
              }
            />
            <Route
              path="services"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ServicesPage />
                </Suspense>
              }
            />
            <Route
              path="services/:slug"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ServiceDetailPage />
                </Suspense>
              }
            />
            <Route
              path="blog/:slug"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <BlogPostPage />
                </Suspense>
              }
            />
            <Route
              path="blog"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <BlogPage />
                </Suspense>
              }
            />
            {/* --- Perspektif Wave-3A PB-6 locale routes --- */}
            <Route
              path="insights/search"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <InsightSearch />
                </Suspense>
              }
            />
            <Route
              path="insights/tag/:slug"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <InsightTag />
                </Suspense>
              }
            />
            <Route
              path="insights/series/:slug/:part?"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <InsightSeries />
                </Suspense>
              }
            />
            <Route
              path="insights/author/:slug"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <InsightAuthor />
                </Suspense>
              }
            />
            <Route
              path="insights/archive/:year?/:month?"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <InsightArchive />
                </Suspense>
              }
            />
            <Route
              path="insights/:domain/:subDomain?"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <InsightCategory />
                </Suspense>
              }
            />
            {/* --- end Perspektif --- */}
            <Route
              path="about"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AboutPage />
                </Suspense>
              }
            />
            <Route
              path="team"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <TeamPage />
                </Suspense>
              }
            />
            <Route
              path="contact"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ContactPage />
                </Suspense>
              }
            />
            <Route
              path="faq"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <FaqPage />
                </Suspense>
              }
            />
            <Route
              path="careers"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <CareersPage />
                </Suspense>
              }
            />
            <Route
              path="industries"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <IndustriesPage />
                </Suspense>
              }
            />
            <Route
              path="methodology"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <MethodologyPage />
                </Suspense>
              }
            />
            <Route
              path="partners"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <PartnersPage />
                </Suspense>
              }
            />
            <Route
              path="case-studies"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <CaseStudiesPage />
                </Suspense>
              }
            />
            <Route
              path="case-studies/:slug"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <CaseStudyDetailPage />
                </Suspense>
              }
            />
            <Route
              path="pricing"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <PricingPage />
                </Suspense>
              }
            />
            <Route
              path="events"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <EventsPage />
                </Suspense>
              }
            />
            <Route
              path="locations"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <LocationsPage />
                </Suspense>
              }
            />
            <Route
              path="privacy"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <PrivacyPage />
                </Suspense>
              }
            />
            <Route
              path="privacy/data-rights"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <DataRightsPage />
                </Suspense>
              }
            />
            <Route
              path="terms"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <TermsPage />
                </Suspense>
              }
            />
            <Route
              path="cookies"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <CookiePage />
                </Suspense>
              }
            />
            <Route
              path="maturity-assessment"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AssessmentPage />
                </Suspense>
              }
            />
            {/* SEO alias for /about — keeps /:locale/about-us resolvable */}
            <Route
              path="about-us"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AboutPage />
                </Suspense>
              }
            />
            <Route
              path="quick-check"
              element={
                <RouteContainer name="QuickCheckPage" fallback={<LoadingFallback />}>
                  <QuickCheckPage />
                </RouteContainer>
              }
            />
            <Route
              path="pricing-calculator"
              element={
                <RouteContainer name="PricingCalculatorPage" fallback={<LoadingFallback />}>
                  <PricingCalculatorPage />
                </RouteContainer>
              }
            />
          </Route>
        </Route>

        {/* Standalone Pages */}
        <Route
          path="/app/*"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <RegisterPage />
            </Suspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ForgotPasswordPage />
            </Suspense>
          }
        />

        {/* P37-T05: Booking management (reschedule/cancel via email link) */}
        <Route
          path="/booking/manage"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BookingManagePage />
            </Suspense>
          }
        />

        {/* P37-T10: NPS Feedback (public, token-gated) */}
        <Route
          path="/feedback/:bookingId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BookingFeedbackPage />
            </Suspense>
          }
        />

        {/* P35-T03: Email verification (public, token-gated) */}
        <Route
          path="/verify-email"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <VerifyEmailPage />
            </Suspense>
          }
        />

        {/* Keystatic Admin moved to /admin.html (MPA) */}

        {/* --- ADMIN PANEL ROUTES (Lazy Loaded & Protected) ---
            ADMIN_ROUTES_ENABLED gates the entire tree at build time.
            When disabled, every `/admin/*` request 302s to "/" so the login
            form, password-reset endpoints, and route names are not even
            announced to crawlers / scanners. */}
        {!ADMIN_ROUTES_ENABLED && <Route path="/admin/*" element={<Navigate to="/" replace />} />}
        {ADMIN_ROUTES_ENABLED && (
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AdminLoginPage />
              </Suspense>
            }
          />
        )}

        {ADMIN_ROUTES_ENABLED && (
          <Route element={<ProtectedRoute />}>
            <Route
              path="/admin"
              element={
                <AdminGuard requiredRole="ADMIN">
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminLayout />
                  </Suspense>
                </AdminGuard>
              }
            >
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route
                path="overview"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminOverviewPage />
                  </Suspense>
                }
              />
              <Route
                path="dashboard"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminDashboard />
                  </Suspense>
                }
              />
              <Route
                path="services"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminServicesPage />
                  </Suspense>
                }
              />
              <Route
                path="bookings"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminBookingsPage />
                  </Suspense>
                }
              />
              <Route
                path="ai"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminAIPage />
                  </Suspense>
                }
              />
              <Route
                path="contacts"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminContactsPage />
                  </Suspense>
                }
              />
              <Route
                path="newsletter"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminNewsletterPage />
                  </Suspense>
                }
              />
              <Route
                path="newsletter/campaigns"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminCampaignsPage />
                  </Suspense>
                }
              />
              <Route
                path="newsletter/campaigns/new"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminCampaignWizardPage />
                  </Suspense>
                }
              />
              <Route
                path="media"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminMediaLibraryPage />
                  </Suspense>
                }
              />
              <Route
                path="settings/tabs"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminSettingsTabsPage />
                  </Suspense>
                }
              />
              <Route
                path="security"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminSecurityPage />
                  </Suspense>
                }
              />
              <Route
                path="rbac"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminRBACPage />
                  </Suspense>
                }
              />
              <Route
                path="founder-letter"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminFounderLetterPage />
                  </Suspense>
                }
              />
              <Route
                path="profile"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminProfilePage />
                  </Suspense>
                }
              />
              <Route
                path="help"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminHelpPage />
                  </Suspense>
                }
              />
              {/* Phase 3 — KVKK Compliance Shield */}
              <Route
                path="dsar"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminDSARPage />
                  </Suspense>
                }
              />
              <Route
                path="consent"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminConsentLedgerPage />
                  </Suspense>
                }
              />
              <Route
                path="ropa"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminROPAPage />
                  </Suspense>
                }
              />
              <Route
                path="breach"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminBreachPage />
                  </Suspense>
                }
              />
              <Route
                path="verbis"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminVERBISPage />
                  </Suspense>
                }
              />
              <Route
                path="retention"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminRetentionPage />
                  </Suspense>
                }
              />
              {/* P44-T07 Round-4: previously orphan KVKK/regulatory pages */}
              <Route
                path="esg"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminESGPage />
                  </Suspense>
                }
              />
              <Route
                path="fintech-compliance"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminFintechCompliancePage />
                  </Suspense>
                }
              />
              <Route
                path="succession"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminSuccessionPage />
                  </Suspense>
                }
              />
              <Route
                path="blog"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminBlogPage />
                  </Suspense>
                }
              />
              <Route
                path="blog/:slug/edit"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminBlogEditPage />
                  </Suspense>
                }
              />
              <Route
                path="services/:slug/edit"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminServiceEditPage />
                  </Suspense>
                }
              />
              <Route
                path="pages"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminPagesListPage />
                  </Suspense>
                }
              />
              <Route
                path="pages/:id/edit"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminPageEditPage />
                  </Suspense>
                }
              />
              <Route
                path="collections/:type"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminCollectionPage />
                  </Suspense>
                }
              />
              <Route
                path="leads"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminLeadsPage />
                  </Suspense>
                }
              />
              <Route
                path="leads/:id"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminLeadDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="analytics"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminAnalyticsPage />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminSettingsPage />
                  </Suspense>
                }
              />
              <Route
                path="users"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminUsersPage />
                  </Suspense>
                }
              />
              {/* P35-T09: Session management */}
              <Route
                path="sessions"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminSessionsPage />
                  </Suspense>
                }
              />
              {/* P36-T07: Audit log */}
              <Route
                path="audit-log"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminAuditLogPage />
                  </Suspense>
                }
              />
              <Route
                path="crm"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminCrmPage />
                  </Suspense>
                }
              />
              <Route
                path="deals"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminDealsPage />
                  </Suspense>
                }
              />
              <Route
                path="retainers"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminRetainersPage />
                  </Suspense>
                }
              />
              <Route
                path="outreach"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminOutreachPage />
                  </Suspense>
                }
              />
              <Route
                path="dev-analytics"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminDevAnalyticsPage />
                  </Suspense>
                }
              />
              <Route
                path="insights"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminInsightsPage />
                  </Suspense>
                }
              />
              <Route
                path="insights/categories"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminInsightsCategoriesPage />
                  </Suspense>
                }
              />
              <Route
                path="insights/posts"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminInsightsPostsPage />
                  </Suspense>
                }
              />
              <Route
                path="insights/posts/new"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminInsightsPostEditPage />
                  </Suspense>
                }
              />
              <Route
                path="insights/posts/:id/edit"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminInsightsPostEditPage />
                  </Suspense>
                }
              />
              <Route
                path="insights/metadata"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminInsightsMetadataPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>
        )}
        {/* P39-T02: /locale-detect → redirects root domain to /tr or /en */}
        <Route path="/locale-detect" element={<LocaleRedirect />} />
        {/* L1-6: /founder → real FounderPage (bio + Big4 vs Boutique + manifesto) */}
        <Route
          path="/founder"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FounderPage />
            </Suspense>
          }
        />
        {/* P45 C1: /data-rights → kanonik konuma yönlensin */}
        <Route path="/data-rights" element={<Navigate to="/privacy/data-rights" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
};

import { initMonitoring } from './lib/monitor';
import { initRUM } from './lib/rum';
import { PrivacyAnalytics } from './components/analytics/PrivacyAnalytics';

import '@/lib/i18n'; // Initialize i18n
// P76: CommandMenu + ZenToggle lazy — only triggered by keyboard/interaction
const CommandMenu = React.lazy(() =>
  import('./components/ui/CommandMenu').then((m) => ({ default: m.CommandMenu })),
);
const ZenToggle = React.lazy(() =>
  import('./components/ui/ZenToggle').then((m) => ({ default: m.ZenToggle })),
);
import { LanguageToggle } from './components/ui/LanguageToggle';

import { useWebVitals } from '@/hooks/useWebVitals';
import { useScrollDepth } from '@/hooks/useScrollDepth';

import { SeoManager } from './components/seo/SeoManager';

// P76: Lazy-load marketing/debug overlays — none are needed for initial paint
const MissionControl = React.lazy(() =>
  import('./components/debug/MissionControl').then((m) => ({ default: m.MissionControl })),
);
import { OfflineBanner } from './components/common/OfflineBanner';
import { WhatsAppButton } from './components/contact/WhatsAppButton';
import { CookieBanner } from './components/CookieBanner';
const SimpleChatWidget = React.lazy(() =>
  import('./components/chat/SimpleChatWidget').then((m) => ({ default: m.SimpleChatWidget })),
);
const ExitIntentModalP53 = React.lazy(() =>
  import('./components/marketing/ExitIntentModal').then((m) => ({ default: m.ExitIntentModalP53 })),
);
const MobileCtaBar = React.lazy(() =>
  import('./components/marketing/MobileCtaBar').then((m) => ({ default: m.MobileCtaBar })),
);
import { analyticsConsumer } from './lib/director/analytics-consumer';
import { personalization } from './lib/director/personalization';
import { sentry } from './lib/sentry';
import { processDirectorActions } from './lib/notifications/toast-manager';
import { initPerformance } from './lib/performance';
import { bindAutoFlush as bindRetryQueueFlush } from './lib/network/retry-queue';

const RouterDependentHooks: React.FC = () => {
  useScrollDepth();
  return null;
};

const App: React.FC = () => {
  useWebVitals();

  React.useEffect(() => {
    initMonitoring();

    // P7 Round A — Sentry boot-time path moved to requestIdleCallback so it
    // does NOT block first-paint hydration. Error reporting trades the first
    // ~1-2s of capture (which is dominated by build-time errors we already
    // catch in CI) for measurable TBT/FCP gains on cold start.
    const idle: (cb: () => void) => void =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? (cb) =>
            (
              window as unknown as {
                requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
              }
            ).requestIdleCallback(cb, { timeout: 2000 })
        : (cb) => setTimeout(cb, 1500);

    idle(async () => {
      // P76: sentry.init() is now async (dynamic import of @sentry/react).
      // The 259KB Sentry chunk loads here, NOT during initial paint.
      await sentry.init();
      sentry.addBreadcrumb({ category: 'lifecycle', message: 'App mounted', level: 'info' });
      // P13/2 — RUM goes online after Sentry so Web Vitals can attach as
      // measurements to the in-flight pageload transaction.
      initRUM();
    });

    // Initialize The Automatic Director (kept eager — required for ONE_TIME task scheduling)
    Logger.info('[App] Initializing Director...');
    director.init();
    director.scheduleTask('ONE_TIME', { status: 'DRAFT', daysSinceUpdate: 45 }, 5000);

    // Initialize Analytics Consumer + Personalization Engine — also deferred to idle
    Logger.info('[App] Starting Analytics Consumer...');
    personalization.onAction((actions) => {
      // Route personalization actions to Sonner toast notifications
      processDirectorActions(actions);

      // Also log to Sentry as breadcrumbs for debugging
      for (const action of actions) {
        sentry.addBreadcrumb({
          category: 'personalization',
          message: `Director action: ${action.type}`,
          level: 'info',
          data: action.payload as Record<string, unknown>,
        });
      }
    });
    idle(() => {
      analyticsConsumer.start();
    });

    // Initialize Performance Optimizations (resource hints, prefetch, lazy images)
    initPerformance();

    // P15 — Bind auto-flush for offline retry queue.
    bindRetryQueueFlush();

    // Phase 30: Matrix Init
    Logger.info('[App] Matrix Engine Online.');

    // Cleanup on unmount
    return () => {
      analyticsConsumer.stop();
      personalization.reset();
    };
  }, []);

  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const handler = () => setBookingOpen(true);
    window.addEventListener('open-booking', handler);
    return () => window.removeEventListener('open-booking', handler);
  }, []);

  return (
    <SovereignBoundary name="RootApp">
      <AppProviders>
        <BrowserRouter>
          <RouterDependentHooks />
          {/* P76: Lazy overlays wrapped in Suspense with null fallback (invisible until loaded) */}
          <Suspense fallback={null}>
            <MissionControl />
          </Suspense>
          <PrivacyAnalytics />
          <SeoManager />
          <SchemaOrg />
          {/* P15 — Offline banner: navigator.onLine değiştiğinde görünür. */}
          <OfflineBanner />
          <Suspense fallback={null}>
            <CommandMenu />
            <ZenToggle />
          </Suspense>
          <LanguageToggle />
          <Suspense fallback={<LoadingFallback />}>
            <AnimatedRoutes />
          </Suspense>
          <Suspense fallback={null}>
            <LiveChat />
          </Suspense>
          {/* P52: WhatsApp + simple chat — admin/auth route'larında gizli */}
          <WhatsAppButton />
          <Suspense fallback={null}>
            <SimpleChatWidget />
            {/* P53: exit-intent + mobile sticky CTA */}
            <ExitIntentModalP53 />
            <MobileCtaBar />
            <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
          </Suspense>
          <CookieBanner />
        </BrowserRouter>
      </AppProviders>
    </SovereignBoundary>
  );
};

export default App;
