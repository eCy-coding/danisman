import React from 'react';
// P46 C2: react-helmet-async@2.x React 19'da head'e flush etmiyor. Çalışan
// imperatif shim'i kullan ki hreflang alternate'leri gerçekten render olsun.
import { Helmet } from '../../lib/seo-helmet';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildAlternateLinks } from '@/i18n/canonical';

interface SeoManagerProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
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
  // S13-P4 F2 — mirror SEO.tsx defensive append (skip suffix when the page
  // title already includes the brand). Prevents "… | eCyPro Premium
  // Consulting | eCyPro" double-brand in SERP & social previews.
  const titleHasBrand = title ? /\becypro\b/i.test(title) : false;
  const finalTitle = title ? (titleHasBrand ? title : `${title} | eCyPro`) : undefined;
  const finalDescription = description ?? undefined;
  const ogLocale = currentLang === 'tr' ? 'tr_TR' : 'en_US';
  const ogLocaleAlt = currentLang === 'tr' ? 'en_US' : 'tr_TR';

  // P39-T01: Path-based hreflang (RFC 5646) — tek merkezi util'den.
  // Doğrudan <Helmet> child olarak verilir; IIFE/Fragment ile sarmalanırsa
  // shim flatten edemez. x-default artık locale-stripped değil → /tr prefix'li.
  const alternates = buildAlternateLinks(canonicalPath);
  const hreflangTr = alternates.find((a) => a.hrefLang === 'tr-TR')!.href;
  const hreflangEn = alternates.find((a) => a.hrefLang === 'en')!.href;
  const hreflangDefault = alternates.find((a) => a.hrefLang === 'x-default')!.href;

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
