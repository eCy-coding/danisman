import React, { Suspense, useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BookingModal } from './components/features/booking/BookingModal';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProviders } from './components/providers/AppProviders';
import { NotFoundPage } from './pages/NotFoundPage';
import { director } from '@/lib/director';
import { SovereignBoundary } from './components/ui/SovereignBoundary';
import { Logger } from './lib/logger';


// Lazy load ALL pages including LandingPage for maximum code splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));

// Lazy load pages for code splitting (Dashboard & Inner pages only)
import { SchemaOrg } from './components/seo/SchemaOrg';
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const ServicesPage = React.lazy(() => import('./pages/ServicesPage').then(module => ({ default: module.ServicesPage })));
const ServiceDetailPage = React.lazy(() => import('./pages/ServiceDetailPage').then(module => ({ default: module.ServiceDetailPage })));
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage'));
const BlogPage = React.lazy(() => import('./pages/BlogPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage').then(module => ({ default: module.AboutPage })));
// Static import for debugging
// import { CaseStudiesPage } from '@/pages/CaseStudiesPage';
const CaseStudiesPage = React.lazy(() => import('./pages/CaseStudiesPage').then(module => ({ default: module.CaseStudiesPage })));
const CaseStudyDetailPage = React.lazy(() => import('./pages/CaseStudyDetailPage').then(module => ({ default: module.CaseStudyDetailPage })));
const PricingPage = React.lazy(() => import('./pages/PricingPage').then(module => ({ default: module.PricingPage })));
const TeamPage = React.lazy(() => import('./pages/TeamPage').then(module => ({ default: module.TeamPage })));
const ContactPage = React.lazy(() => import('./pages/ContactPage').then(module => ({ default: module.ContactPage })));
const FaqPage = React.lazy(() => import('./pages/FaqPage').then(module => ({ default: module.FaqPage })));
const CareersPage = React.lazy(() => import('./pages/CareersPage').then(module => ({ default: module.CareersPage })));
const IndustriesPage = React.lazy(() => import('./pages/IndustriesPage').then(module => ({ default: module.IndustriesPage })));
const MethodologyPage = React.lazy(() => import('./pages/MethodologyPage').then(module => ({ default: module.MethodologyPage })));
const PartnersPage = React.lazy(() => import('./pages/PartnersPage').then(module => ({ default: module.PartnersPage })));

const EventsPage = React.lazy(() => import('./pages/EventsPage').then(module => ({ default: module.EventsPage })));
const LocationsPage = React.lazy(() => import('./pages/LocationsPage').then(module => ({ default: module.LocationsPage })));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage').then(module => ({ default: module.PrivacyPage })));
const TermsPage = React.lazy(() => import('./pages/TermsPage').then(module => ({ default: module.TermsPage })));
const CookiePage = React.lazy(() => import('./pages/CookiePage').then(module => ({ default: module.CookiePage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then(module => ({ default: module.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));

// const KeystaticPage = React.lazy(() => import('./src/app/keystatic/page')); // Moved to MPA
const AssessmentPage = React.lazy(() => import('./pages/AssessmentPage').then(module => ({ default: module.AssessmentPage })));

const TerminalPage = React.lazy(() => import('./pages/TerminalPage').then(module => ({ default: module.TerminalPage })));
import LiveChat from './components/integrations/LiveChat';

// Admin Modules (Lazy)
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLogin').then(module => ({ default: module.AdminLoginPage })));
const AdminLayout = React.lazy(() => import('./components/admin/layout/AdminLayout').then(module => ({ default: module.AdminLayout })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminServicesPage = React.lazy(() => import('./pages/admin/AdminServicesPage').then(module => ({ default: module.AdminServicesPage })));
const AdminBookingsPage = React.lazy(() => import('./pages/admin/AdminBookingsPage').then(module => ({ default: module.AdminBookingsPage })));
import { ProtectedRoute } from './components/admin/auth/ProtectedRoute';
import { Navigate } from 'react-router-dom';

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
            <Route path="/" element={
              <Suspense fallback={<div style={{minHeight:'100vh',background:'#050810'}} />}>
                <LandingPage />
              </Suspense>
            } />
            <Route path="/services">
                <Route index element={
                    <Suspense fallback={<LoadingFallback />}>
                        <ServicesPage />
                    </Suspense>
                } />
                <Route path=":slug" element={
                    <Suspense fallback={<LoadingFallback />}>
                        <ServiceDetailPage />
                    </Suspense>
                } />
            </Route>
            {/* Flattening the routes for simplicity as per original structure */}
            <Route path="/blog/:slug" element={
                <Suspense fallback={<LoadingFallback />}>
                   <BlogPostPage />
                </Suspense>
            } />
            <Route path="/blog" element={
                <Suspense fallback={<LoadingFallback />}>
                   <BlogPage />
                </Suspense>
            } />
            <Route path="/about" element={
               <Suspense fallback={<LoadingFallback />}>
                   <AboutPage />
               </Suspense>
            } />
            <Route path="/team" element={
               <Suspense fallback={<LoadingFallback />}>
                   <TeamPage />
               </Suspense>
            } />
            <Route path="/contact" element={
               <Suspense fallback={<LoadingFallback />}>
                   <ContactPage />
               </Suspense>
            } />
            <Route path="/faq" element={
               <Suspense fallback={<LoadingFallback />}>
                   <FaqPage />
               </Suspense>
            } />
            <Route path="/careers" element={
               <Suspense fallback={<LoadingFallback />}>
                   <CareersPage />
               </Suspense>
            } />
            <Route path="/industries" element={
               <Suspense fallback={<LoadingFallback />}>
                   <IndustriesPage />
               </Suspense>
            } />
            <Route path="/methodology" element={
               <Suspense fallback={<LoadingFallback />}>
                   <MethodologyPage />
               </Suspense>
            } />
            <Route path="/partners" element={
               <Suspense fallback={<LoadingFallback />}>
                   <PartnersPage />
               </Suspense>
            } />
            <Route path="/case-studies" element={
               <Suspense fallback={<LoadingFallback />}>
                   <CaseStudiesPage />
               </Suspense>
            } />
            <Route path="/case-studies/:slug" element={
               <Suspense fallback={<LoadingFallback />}>
                   <CaseStudyDetailPage />
               </Suspense>
            } />
            <Route path="/pricing" element={
               <Suspense fallback={<LoadingFallback />}>
                   <PricingPage />
               </Suspense>
            } />
            <Route path="/events" element={
               <Suspense fallback={<LoadingFallback />}>
                   <EventsPage />
               </Suspense>
            } />
            <Route path="/locations" element={
               <Suspense fallback={<LoadingFallback />}>
                   <LocationsPage />
               </Suspense>
            } />
            <Route path="/privacy" element={
               <Suspense fallback={<LoadingFallback />}>
                   <PrivacyPage />
               </Suspense>
            } />
            <Route path="/terms" element={
               <Suspense fallback={<LoadingFallback />}>
                   <TermsPage />
               </Suspense>
            } />
            <Route path="/cookies" element={
               <Suspense fallback={<LoadingFallback />}>
                   <CookiePage />
               </Suspense>
            } />
            <Route path="/maturity-assessment" element={
               <Suspense fallback={<LoadingFallback />}>
                   <AssessmentPage />
               </Suspense>
            } />
            <Route path="/antigravity-terminal" element={
                <TerminalPage />
            } />
        </Route>

        {/* Standalone Pages */}
        <Route path="/app/*" element={
            <Suspense fallback={<div>Loading...</div>}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route path="/login" element={
           <Suspense fallback={<LoadingFallback />}>
               <LoginPage />
           </Suspense>
        } />
        <Route path="/register" element={
           <Suspense fallback={<LoadingFallback />}>
               <RegisterPage />
           </Suspense>
        } />
        <Route path="/forgot-password" element={
           <Suspense fallback={<LoadingFallback />}>
               <ForgotPasswordPage />
           </Suspense>
        } />

        {/* Keystatic Admin moved to /admin.html (MPA) */}

        {/* --- ADMIN PANEL ROUTES (Lazy Loaded & Protected) --- */}
        <Route path="/admin/login" element={
            <Suspense fallback={<LoadingFallback />}>
                <AdminLoginPage />
            </Suspense>
        } />
        
        <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={
                <Suspense fallback={<LoadingFallback />}>
                    <AdminLayout />
                </Suspense>
            }>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={
                    <Suspense fallback={<LoadingFallback />}>
                        <AdminDashboard />
                    </Suspense>
                } />
                <Route path="services" element={
                    <Suspense fallback={<LoadingFallback />}>
                        <AdminServicesPage />
                    </Suspense>
                } />
                <Route path="bookings" element={
                    <Suspense fallback={<LoadingFallback />}>
                        <AdminBookingsPage />
                    </Suspense>
                } />
                {/* Future Admin Routes will go here */}
            </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
};

import { initMonitoring } from './lib/monitor';
import { PrivacyAnalytics } from './components/analytics/PrivacyAnalytics';

import '@/lib/i18n'; // Initialize i18n
import { CommandMenu } from './components/ui/CommandMenu';
import { ZenToggle } from './components/ui/ZenToggle';
import { LanguageToggle } from './components/ui/LanguageToggle';

import { useWebVitals } from '@/hooks/useWebVitals';

import { SeoManager } from './components/seo/SeoManager';

import { MissionControl } from './components/debug/MissionControl';
import { analyticsConsumer } from './lib/director/analytics-consumer';
import { personalization } from './lib/director/personalization';
import { sentry } from './lib/sentry';
import { processDirectorActions } from './lib/notifications/toast-manager';
import { initPerformance } from './lib/performance';
import { Toaster } from './components/ui/Toast';

const App: React.FC = () => {
  useWebVitals();
  
  React.useEffect(() => {
    initMonitoring();

    // Initialize Sentry Error Reporting
    sentry.init();
    sentry.addBreadcrumb({ category: 'lifecycle', message: 'App mounted', level: 'info' });

    // Initialize The Automatic Director
    Logger.info('[App] Initializing Director...');
    director.init();
    director.scheduleTask('ONE_TIME', { status: 'DRAFT', daysSinceUpdate: 45 }, 5000);

    // Initialize Analytics Consumer + Personalization Engine
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
    analyticsConsumer.start();

    // Initialize Performance Optimizations (resource hints, prefetch, lazy images)
    initPerformance();

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
      <HelmetProvider>
        <AppProviders>
          <BrowserRouter>
            <MissionControl />
            <PrivacyAnalytics />
            <SeoManager />
            <SchemaOrg />
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
      </HelmetProvider>
      <Toaster position="bottom-right" richColors closeButton />
    </SovereignBoundary>
  );
};

export default App;
