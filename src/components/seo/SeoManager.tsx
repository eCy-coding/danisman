
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SeoManagerProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
}

export const SeoManager: React.FC<SeoManagerProps> = ({
  title,
  description,
  image = '/og-image.jpg',
  type = 'website',
}) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const currentLang = (i18n.language || 'en-US').split('-')[0];
  
  const siteUrl = 'https://www.ecypro.com';
  const fullUrl = `${siteUrl}${location.pathname}`;
  
  const defaultTitle = 'EcyPro - Premium Consulting';
  const defaultDescription = 'Elite management consulting for the digital age. Strategy, Operations, and Technology transformation.';

  const finalTitle = title ? `${title} | EcyPro` : defaultTitle;
  const finalDescription = description || defaultDescription;

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content="EcyPro Consulting" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={`${siteUrl}${image}`} />
      <meta property="og:locale" content={currentLang === 'tr' ? 'tr_TR' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={`${siteUrl}${image}`} />
    </Helmet>
  );
};
