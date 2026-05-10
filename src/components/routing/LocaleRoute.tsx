/**
 * P39-T02: LocaleRoute — Path-Based Locale Routing Wrapper
 *
 * Reads the `:locale` param from the URL and syncs it with i18next.
 * All public pages under `/:locale/*` are rendered through this wrapper.
 *
 * Route tree:
 *   /:locale          → LocaleRoute (this component)
 *     index           → LandingPage  (/tr, /en)
 *     services        → ServicesPage (/tr/services, /en/services)
 *     blog/:slug      → BlogPostPage
 *     ...etc
 *
 * Supported locales: tr, en (validated against SUPPORTED_LANGS)
 * Invalid locale (e.g. /de/services): 404 redirect
 *
 * Algorithm:
 *   1. Read :locale from URL
 *   2. Validate against SUPPORTED_LANGS
 *   3. If i18n.language !== locale → i18n.changeLanguage(locale)
 *   4. Render <Outlet /> with correct language context
 *
 * SEO impact:
 *   - /tr/* and /en/* are separately crawlable
 *   - Combined with Hreflang component: Google knows each URL's language
 *   - No duplicate content penalty (hreflang signals canonical language)
 */

import React, { useEffect } from 'react';
import { useParams, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGS } from '../../lib/i18n-react';

type SupportedLocale = (typeof SUPPORTED_LANGS)[number];

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return (SUPPORTED_LANGS as readonly string[]).includes(locale);
}

export const LocaleRoute: React.FC = () => {
  const { locale } = useParams<{ locale: string }>();
  const { i18n } = useTranslation();
  const { pathname } = useLocation();

  // Redirect invalid locales to 404
  if (!locale || !isSupportedLocale(locale)) {
    return <Navigate to="/404" replace />;
  }

  // Sync i18next language with URL locale
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
    // Update document lang attribute
    document.documentElement.setAttribute('lang', locale);
  }, [locale, i18n, pathname]);

  return <Outlet />;
};

export default LocaleRoute;
