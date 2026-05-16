import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation, getLang, type MultiLang } from '@/lib/i18n';
import { CONTACT_CONFIG } from '../../constants';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: 'website' | 'article' | 'profile';
  image?: string;
  jsonLd?: Record<string, unknown>;
  /** P15 — auth/booking/admin/util route'lar için SERP indeksi engelle. */
  noIndex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  type = 'website',
  image = 'https://www.ecypro.com/og-image.jpg',
  jsonLd,
  noIndex = false,
}) => {
  const { i18n } = useTranslation();
  const language = (i18n.language || 'en') as 'tr' | 'en';
  
  const siteTitle = 'EcyPro | Premium Kurumsal Danışmanlık';
  const finalTitle = title ? `${title} | EcyPro` : siteTitle;
  
  const siteDescription =
    language === 'tr'
      ? 'Global ölçekte stratejik büyüme ve dijital dönüşüm ortağınız. Yönetim, etkinlik ve dijital çözümler.'
      : 'Your strategic partner for global growth and digital transformation. Management, events, and digital solutions.';

  const finalDescription = description || siteDescription;
  const siteUrl = 'https://www.ecypro.com';
  const finalCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;

  // Default JSON-LD for the organization from constants
  const defaultJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EcyPro',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://www.linkedin.com/company/ecypro',
      'https://twitter.com/ecypro',
      'https://instagram.com/ecypro'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: CONTACT_CONFIG.phone,
      contactType: 'customer service',
      areaServed: ['TR', 'GB', 'US', 'DE'],
      availableLanguage: ['Turkish', 'English'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: getLang(CONTACT_CONFIG.address as MultiLang, language),
      addressCountry: language === 'tr' ? 'TR' : 'TR' // Assuming HQ is TR
    }
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={language} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={finalCanonical} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content="EcyPro" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd || defaultJsonLd)}
      </script>
    </Helmet>
  );
};
