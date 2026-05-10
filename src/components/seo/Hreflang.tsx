/**
 * P39-T01: Hreflang — Route-Aware Multilingual Alternate Tags
 *
 * Injects hreflang <link> tags into <head> for every page.
 * Required by Google to serve correct language version to users.
 *
 * Spec (RFC 5646 + Google hreflang docs):
 *   <link rel="alternate" hreflang="tr-TR" href="https://ecypro.com/tr/..." />
 *   <link rel="alternate" hreflang="en"    href="https://ecypro.com/en/..." />
 *   <link rel="alternate" hreflang="x-default" href="https://ecypro.com/..." />
 *
 * Algorithm:
 *   1. Take current pathname (from react-router useLocation)
 *   2. Strip any existing locale prefix (/tr, /en)
 *   3. Generate 3 alternates: tr-TR, en, x-default (canonical)
 *
 * x-default: points to locale-free URL (Google will serve based on user locale).
 *
 * GSC validation: https://technicalseo.com/tools/hreflang/
 * After deploy: GSC → International Targeting → "No errors"
 *
 * Usage: Drop <Hreflang /> inside any page layout (above-fold, inside <HelmetProvider>)
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_PROD_URL ?? 'https://ecypro.com';
const LOCALE_PREFIXES = ['/tr', '/en'];

function stripLocalePrefix(pathname: string): string {
  for (const prefix of LOCALE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length) || '/';
    }
  }
  return pathname;
}

interface HreflangProps {
  /** Override canonical path (default: current route) */
  canonicalPath?: string;
}

export const Hreflang: React.FC<HreflangProps> = ({ canonicalPath }) => {
  const { pathname } = useLocation();
  const cleanPath = canonicalPath ?? stripLocalePrefix(pathname);

  // Normalize: avoid double slashes
  const normalize = (segment: string) =>
    `${BASE_URL}/${segment}`.replace(/\/+/g, '/').replace(':/', '://');

  const trUrl = normalize(`tr${cleanPath}`);
  const enUrl = normalize(`en${cleanPath}`);
  const defaultUrl = normalize(cleanPath === '/' ? '' : cleanPath);

  return (
    <Helmet>
      <link rel="alternate" hrefLang="tr-TR" href={trUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={defaultUrl} />
    </Helmet>
  );
};

export default Hreflang;
