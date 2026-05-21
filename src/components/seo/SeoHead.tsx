
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SeoProps {
  title: string;
  description: string;
  type?: 'website' | 'article' | 'profile';
  imageUrl?: string;
  publishedTime?: string;
  schema?: Record<string, any>;
}

export const SeoHead: React.FC<SeoProps> = ({
  title,
  description,
  type = 'website',
  imageUrl = '/og-default.jpg',
  publishedTime,
  schema
}) => {
  const { pathname } = useLocation();
  const canonicalUrl = `https://ecypro.com${pathname}`;
  const fullTitle = `${title} | eCyPro Premium Consulting`;

  // Default Organization Schema
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "ConsultingService",
    "name": "eCyPro",
    "url": "https://ecypro.com",
    "logo": "https://ecypro.com/logo.png",
    "description": "Premium Business Consulting for Global Scale.",
    "priceRange": "$$$",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    }
  };

  const activeSchema = schema || defaultSchema;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="eCyPro" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(activeSchema)}
      </script>
    </Helmet>
  );
};
