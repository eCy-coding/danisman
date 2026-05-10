import React from 'react';
import { Helmet } from 'react-helmet-async';
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
  image = '/og-image.jpg',
  type = 'website',
  noIndex = false,
}) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const currentLang = (i18n.language ?? 'en').split('-')[0];

  const canonicalPath = location.pathname;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  const defaultTitle =
    currentLang === 'tr'
      ? 'EcyPro | Stratejik Yönetim Danışmanlığı'
      : 'EcyPro | Premium Management Consulting';
  const defaultDescription =
    currentLang === 'tr'
      ? 'Global ölçekte stratejik büyüme ve dijital dönüşüm ortağınız.'
      : 'Elite management consulting: strategy, operations, and technology transformation.';

  const finalTitle = title ? `${title} | EcyPro` : defaultTitle;
  const finalDescription = description ?? defaultDescription;
  const ogLocale = currentLang === 'tr' ? 'tr_TR' : 'en_US';
  const ogLocaleAlt = currentLang === 'tr' ? 'en_US' : 'tr_TR';

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* P39-T01: Path-based hreflang (RFC 5646) */}
      {/* /tr/... for Turkish, /en/... for English, bare path for x-default */}
      {(() => {
        const clean = stripLocale(canonicalPath);
        const normalize = (seg: string) =>
          `${SITE_URL}/${seg}`.replace(/\/+/g, '/').replace(':/', '://');
        return (
          <>
            <link rel="alternate" hrefLang="tr-TR" href={normalize(`tr${clean}`)} />
            <link rel="alternate" hrefLang="en" href={normalize(`en${clean}`)} />
            <link
              rel="alternate"
              hrefLang="x-default"
              href={normalize(clean === '/' ? '' : clean)}
            />
          </>
        );
      })()}

      {/* Open Graph */}
      <meta property="og:site_name" content="EcyPro Consulting" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={`${SITE_URL}${image}`} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlt} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={`${SITE_URL}${image}`} />
    </Helmet>
  );
};
