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

  // P46 C2: Default title/description ARTıK BURADA SET EDİLMEZ. SeoManager
  // global olarak App.tsx'te prop'suz mount oluyordu; her route'ta default
  // title'ı flush ediyor, per-page <SEO /> başlığını eziyordu. Şimdi prop
  // gelmezse sadece hreflang + locale meta'yı yönetir, title/desc/canonical
  // tag'lerini per-page SEO'ya bırakır.
  const finalTitle = title ? `${title} | EcyPro` : undefined;
  const finalDescription = description ?? undefined;
  const ogLocale = currentLang === 'tr' ? 'tr_TR' : 'en_US';
  const ogLocaleAlt = currentLang === 'tr' ? 'en_US' : 'tr_TR';

  return (
    <Helmet>
      <html lang={currentLang} />
      {finalTitle && <title>{finalTitle}</title>}
      {finalDescription && <meta name="description" content={finalDescription} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* P46 C1: Canonical — SeoManager hala fallback olarak set ediyor ama
          per-page <SEO canonical="..." /> override ediyor (react-helmet-async
          son tag'i tutar). */}
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

      {/* Open Graph — only when title/desc passed (per-page sets own OG via <SEO />) */}
      <meta property="og:site_name" content="EcyPro Consulting" />
      {finalTitle && <meta property="og:title" content={finalTitle} />}
      {finalDescription && <meta property="og:description" content={finalDescription} />}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlt} />
      {(finalTitle || finalDescription) && (
        <meta property="og:image" content={`${SITE_URL}${image}`} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {finalTitle && <meta name="twitter:title" content={finalTitle} />}
      {finalDescription && <meta name="twitter:description" content={finalDescription} />}
      {(finalTitle || finalDescription) && (
        <meta name="twitter:image" content={`${SITE_URL}${image}`} />
      )}
    </Helmet>
  );
};
