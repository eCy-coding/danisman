import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
}) => {
  const siteTitle = 'EcyPro | Premium Kurumsal Danışmanlık';
  const siteDescription = 'Global ölçekte stratejik büyüme ve dijital dönüşüm ortağınız. Yönetim, etkinlik ve dijital çözümler.';
  const siteUrl = 'https://www.ecypro.com';
  const defaultImage = `${siteUrl}/og-image.jpg`;

  const metaTitle = title ? `${title} | EcyPro` : siteTitle;
  const metaDescription = description || siteDescription;
  const metaUrl = url ? `${siteUrl}${url}` : siteUrl;
  const metaImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : defaultImage;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={metaUrl} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};
