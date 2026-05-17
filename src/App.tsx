import React, { Suspense, useState, useEffect } from 'react';
import { BookingModal } from './components/features/booking/BookingModal';
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

// const KeystaticPage = React.lazy(() => import('./src/app/keystatic/page')); // Moved to MPA
const AssessmentPage = React.lazy(() =>
  import('./pages/AssessmentPage').then((module) => ({ default: module.AssessmentPage })),
);

const TerminalPage = React.lazy(() =>
  import('./pages/TerminalPage').then((module) => ({ default: module.TerminalPage })),
);
import LiveChat from './components/integrations/LiveChat';

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
const AdminDevAnalyticsPage = React.lazy(() =>
  import('./pages/admin/AdminDevAnalyticsPage').then((module) => ({
    default: module.AdminDevAnalyticsPage,
  })),
);
const StatusPage = React.lazy(() =>
  import('./pages/StatusPage').then((module) => ({ default: module.StatusPage })),
);
import { ProtectedRoute } from './components/admin/auth/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import { LocaleRoute } from './components/routing/LocaleRoute';
import { LocaleRedirect } from './components/routing/LocaleRedirect';

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
          <Route
            path="/about"
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
          <Route path="/antigravity-terminal" element={<TerminalPage />} />
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

        {/* --- ADMIN PANEL ROUTES (Lazy Loaded & Protected) --- */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminLoginPage />
            </Suspense>
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/admin"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
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
              path="blog"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminBlogPage />
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
              path="dev-analytics"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminDevAnalyticsPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
        {/* P39-T02: /locale-detect → redirects root domain to /tr or /en */}
        <Route path="/locale-detect" element={<LocaleRedirect />} />
        {/* P45 C1: Bare /founder ve /data-rights URL'leri NotFoundPage'e değil
            kanonik konumlarına yönlensin. Eski linkler ve harici referanslar için. */}
        <Route path="/founder" element={<Navigate to="/about" replace />} />
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
import { CommandMenu } from './components/ui/CommandMenu';
import { ZenToggle } from './components/ui/ZenToggle';
import { LanguageToggle } from './components/ui/LanguageToggle';

import { useWebVitals } from '@/hooks/useWebVitals';
import { useScrollDepth } from '@/hooks/useScrollDepth';

import { SeoManager } from './components/seo/SeoManager';

import { MissionControl } from './components/debug/MissionControl';
import { OfflineBanner } from './components/common/OfflineBanner';
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

    idle(() => {
      // Initialize Sentry Error Reporting (deferred)
      sentry.init();
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
          <MissionControl />
          <PrivacyAnalytics />
          <SeoManager />
          <SchemaOrg />
          {/* P15 — Offline banner: navigator.onLine değiştiğinde görünür. */}
          <OfflineBanner />
          <CommandMenu />
          <ZenToggle />
          <LanguageToggle />
          <Suspense fallback={<LoadingFallback />}>
            <AnimatedRoutes />
          </Suspense>
          <LiveChat />
          <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
        </BrowserRouter>
      </AppProviders>
    </SovereignBoundary>
  );
};

export default App;
