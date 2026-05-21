import React, { useEffect } from 'react';
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

/**
 * P46 C2: SEO component direct DOM manipulation kullanır.
 *
 * Eski sürüm `react-helmet-async@2.0.5` kullanıyordu — React 19.2.6 ile
 * uyumsuz: Helmet hiçbir DOM tag'i yazmıyordu (`hrhCount: 0`). Sonuç:
 * site genelinde title/canonical/description/og statik index.html'den
 * geliyordu ve tüm sayfalar duplicate content olarak tarandı.
 *
 * Bu sürüm useEffect ile document.title, meta tags ve link tags'i
 * doğrudan güncellemektedir. Helmet dependency kaldırılmıştır.
 */

const SITE_URL = 'https://www.ecypro.com';

function upsertMeta(
  selector: string,
  attrName: 'name' | 'property',
  attrValue: string,
  content: string,
): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return el;
}

function upsertLink(rel: string, href: string): HTMLLinkElement {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return el;
}

function upsertJsonLd(id: string, data: Record<string, unknown>): HTMLScriptElement {
  let el = document.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-seo-id', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
  return el;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  type = 'website',
  image = 'https://www.ecypro.com/og-image.svg',
  jsonLd,
  noIndex = false,
}) => {
  const { i18n } = useTranslation();
  const language = (i18n.language || 'en') as 'tr' | 'en';

  const siteTitle =
    language === 'tr'
      ? 'eCyPro | Premium Kurumsal Danışmanlık'
      : 'eCyPro | Premium Management Consulting';
  const finalTitle = title ? `${title} | eCyPro` : siteTitle;

  const siteDescription =
    language === 'tr'
      ? 'Global ölçekte stratejik büyüme ve dijital dönüşüm ortağınız. Yönetim, etkinlik ve dijital çözümler.'
      : 'Your strategic partner for global growth and digital transformation. Management, events, and digital solutions.';

  const finalDescription = description || siteDescription;
  const finalCanonical = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  // Default JSON-LD for the organization from constants
  const defaultJsonLd = React.useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'eCyPro',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [
        'https://www.linkedin.com/company/ecypro',
        'https://twitter.com/ecypro',
        'https://instagram.com/ecypro',
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
        addressCountry: 'TR',
      },
    }),
    [language],
  );

  useEffect(() => {
    // Title
    document.title = finalTitle;
    document.documentElement.setAttribute('lang', language);

    // Standard meta
    upsertMeta('meta[name="description"]', 'name', 'description', finalDescription);
    if (noIndex) {
      upsertMeta('meta[name="robots"]', 'name', 'robots', 'noindex,nofollow');
    } else {
      upsertMeta('meta[name="robots"]', 'name', 'robots', 'index,follow');
    }

    // Canonical
    upsertLink('canonical', finalCanonical);

    // Open Graph
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'eCyPro');
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', finalTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', finalDescription);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', finalCanonical);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', image);

    // Twitter
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', finalTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', finalDescription);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    // Per-page JSON-LD
    upsertJsonLd('page-default', jsonLd || defaultJsonLd);
  }, [
    finalTitle,
    finalDescription,
    finalCanonical,
    type,
    image,
    noIndex,
    language,
    jsonLd,
    defaultJsonLd,
  ]);

  return null;
};
