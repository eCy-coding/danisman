/**
 * P39-T02: LocaleRedirect — Root URL Language Detection + Redirect
 *
 * Placed at the root path "/". Detects user's preferred language
 * and redirects to the appropriate locale-prefixed URL.
 *
 * Detection priority:
 *   1. localStorage 'i18nextLng' — returning user preference (highest priority)
 *   2. navigator.languages — browser Accept-Language (IETF BCP 47)
 *   3. navigator.language — single browser language
 *   4. Default: 'tr' (eCyPro primary market)
 *
 * Algorithm:
 *   primaryTag = lang.toLowerCase().split(/[-_]/)[0]
 *   match to SUPPORTED_LANGS → redirect /{locale}
 *
 * Examples:
 *   navigator.language = 'en-US' → redirect /en
 *   navigator.language = 'tr-TR' → redirect /tr
 *   navigator.language = 'de-DE' → fallback /tr (unsupported)
 *   localStorage = 'en' → redirect /en (overrides navigator)
 *
 * No flash of wrong language: redirect is synchronous before first render.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { SUPPORTED_LANGS, DEFAULT_LANG } from '../../lib/i18n-react';

type SupportedLocale = (typeof SUPPORTED_LANGS)[number];

function detectLocale(): SupportedLocale {
  const supported = SUPPORTED_LANGS as readonly string[];

  // Priority 1: stored user preference
  try {
    const stored = localStorage.getItem('i18nextLng');
    if (stored) {
      const primary = stored.toLowerCase().split(/[-_]/)[0] ?? '';
      if (supported.includes(primary)) return primary as SupportedLocale;
    }
  } catch {
    // localStorage unavailable (private mode)
  }

  // Priority 2: browser language array
  const browserLangs = [...(navigator.languages ?? []), navigator.language].filter(Boolean);

  for (const lang of browserLangs) {
    const primary = lang.toLowerCase().split(/[-_]/)[0] ?? '';
    if (supported.includes(primary)) return primary as SupportedLocale;
  }

  return DEFAULT_LANG as SupportedLocale;
}

export const LocaleRedirect: React.FC = () => {
  const locale = detectLocale();
  return <Navigate to={`/${locale}`} replace />;
};

export default LocaleRedirect;
