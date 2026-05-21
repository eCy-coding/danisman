/**
 * P51.2 — Organization + Service nested + Person worksFor + WebSite schema.
 *
 * Google Knowledge Graph + Rich Results. Site-wide @id reference chain:
 *   Organization (@id /#organization)
 *     → founder Person (@id /#founder)
 *     → makesOffer Service (per-service)
 *     → provider WebSite (@id /#website)
 */

const SITE_URL = 'https://www.ecypro.com';

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ProfessionalService', 'ConsultingService'],
    '@id': `${SITE_URL}/#organization`,
    name: 'eCyPro Premium Consulting',
    alternateName: ['eCyverse', 'eCyPro'],
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/pwa-512x512.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/brand/og-share.svg`,
    description:
      'Premium kurumsal danışmanlık. Organizasyonel dönüşüm, stratejik danışmanlık, kültür mühendisliği.',
    email: 'info@ecypro.com',
    foundingDate: '2020',
    founder: { '@id': `${SITE_URL}/#founder` },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'info@ecypro.com',
        availableLanguage: ['Turkish', 'English'],
        areaServed: ['TR', 'EU', 'GB'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'data protection officer',
        email: 'kvkk@ecypro.com',
        availableLanguage: ['Turkish', 'English'],
      },
    ],
    areaServed: [
      { '@type': 'Country', name: 'Turkey', identifier: 'TR' },
      { '@type': 'Country', name: 'Germany', identifier: 'DE' },
      { '@type': 'Country', name: 'United Kingdom', identifier: 'GB' },
      { '@type': 'Country', name: 'United Arab Emirates', identifier: 'AE' },
    ],
    knowsLanguage: ['tr', 'en'],
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'eCyPro Premium Consulting',
    description:
      'eCyverse premium consulting hub — strategic management, organizational transformation, culture engineering.',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['tr-TR', 'en-US'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Service nested in Organization (Service.provider = Organization).
 * Per-service detail page'de inject edilir.
 */
export function buildServiceSchema(input: {
  slug: string;
  name: string;
  description: string;
  serviceType?: string;
  priceRangeTRY?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/services/${input.slug}#service`,
    serviceType: input.serviceType ?? input.name,
    name: input.name,
    description: input.description,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: [
      { '@type': 'Country', name: 'Turkey', identifier: 'TR' },
      { '@type': 'Country', name: 'European Union', identifier: 'EU' },
    ],
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Corporate executives, family business owners, fintech, manufacturing',
    },
    ...(input.priceRangeTRY
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'TRY',
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: input.priceRangeTRY,
              priceCurrency: 'TRY',
            },
          },
        }
      : {}),
  };
}
