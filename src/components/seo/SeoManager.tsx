import React from 'react';
// P46 C2: react-helmet-async@2.x React 19'da head'e flush etmiyor. Çalışan
// imperatif shim'i kullan ki hreflang alternate'leri gerçekten render olsun.
import { Helmet } from '../../lib/seo-helmet';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SeoManagerProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

const SITE_URL = 'https://www.ecypro.com';

// P39-T01: Path-based hreflang (RFC 5646 + Google spec)
// Pattern: /tr/... | /en/... | x-default = bare canonical
const LOCALE_PREFIXES = ['/tr', '/en'] as const;

function stripLocale(pathname: string): string {
  for (const prefix of LOCALE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length) || '/';
    }
  }
  return pathname;
}

export const SeoManager: React.FC<SeoManagerProps> = ({
  title,
  description,
  type = 'website',
  noIndex = false,
}) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const currentLang = (i18n.language ?? 'en').split('-')[0];

  const canonicalPath = location.pathname;

  // P46 C2: Default title/description ARTıK BURADA SET EDİLMEZ. SeoManager
  // global olarak App.tsx'te prop'suz mount oluyor; per-page <SEO /> başlık,
  // açıklama, canonical, og:url ve og:image'ı sahipleniyor. SeoManager artık
  // SADECE locale-agnostik global sinyalleri yönetir: html lang, path-based
  // hreflang (P39-T01 — bilingual SEO'nun çekirdeği) ve sabit OG/Twitter
  // varsayılanları. Path'e bağlı canonical/og:url buradan KALDIRILDI ki
  // per-page değerleri ezmesin.
  const finalTitle = title ? `${title} | eCyPro` : undefined;
  const finalDescription = description ?? undefined;
  const ogLocale = currentLang === 'tr' ? 'tr_TR' : 'en_US';
  const ogLocaleAlt = currentLang === 'tr' ? 'en_US' : 'tr_TR';

  // P39-T01: Path-based hreflang (RFC 5646). Doğrudan <Helmet> child olarak
  // verilir; IIFE/Fragment ile sarmalanırsa shim flatten edemez.
  const cleanPath = stripLocale(canonicalPath);
  const normalizeUrl = (seg: string) => `${SITE_URL}/${seg}`.replace(/([^:]\/)\/+/g, '$1');
  const hreflangTr = normalizeUrl(`tr${cleanPath}`);
  const hreflangEn = normalizeUrl(`en${cleanPath}`);
  const hreflangDefault = normalizeUrl(cleanPath === '/' ? '' : cleanPath);

  return (
    <Helmet>
      <html lang={currentLang} />
      {finalTitle && <title>{finalTitle}</title>}
      {finalDescription && <meta name="description" content={finalDescription} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* P39-T01: Path-based hreflang — direct children (shim flatten gereği) */}
      <link rel="alternate" hrefLang="tr-TR" href={hreflangTr} />
      <link rel="alternate" hrefLang="en" href={hreflangEn} />
      <link rel="alternate" hrefLang="x-default" href={hreflangDefault} />

      {/* Locale-agnostik OG/Twitter varsayılanları (path'e bağlı olanlar
          per-page <SEO />'da). */}
      <meta property="og:site_name" content="eCyPro Consulting" />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlt} />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
};
