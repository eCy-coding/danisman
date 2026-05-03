/**
 * src/lib/structured-data.ts — Phase 20.5 H1
 *
 * schema.org JSON-LD builders. Used by per-page `JsonLd` injections.
 *
 * Why builders (not raw objects)?
 *   - Ensure required fields are always set (Google rich-results validation).
 *   - Single source of truth for `@context`, `@id`, organization profile.
 *   - Type-safe call sites — devs cannot accidentally omit `headline` on Article.
 *
 * Companion to `SchemaOrg.tsx` (global ProfessionalService + Service + FAQPage)
 * and `JsonLd.tsx` (Helmet wrapper).
 */

const SITE_URL = 'https://ecypro.com';
const ORG_ID = `${SITE_URL}#organization`;

export interface ArticleSchemaInput {
  url: string;
  title: string;
  description: string;
  image: string;
  publishedAt: string; // ISO 8601
  modifiedAt?: string;
  author: string;
  category?: string;
  language?: 'tr' | 'en';
}

export function buildArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    headline: input.title,
    description: input.description,
    image: input.image,
    datePublished: input.publishedAt,
    dateModified: input.modifiedAt ?? input.publishedAt,
    inLanguage: input.language ?? 'tr',
    author: { '@type': 'Person', name: input.author },
    publisher: {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: 'EcyPro Premium Consulting',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/pwa-512x512.png` },
    },
    ...(input.category ? { articleSection: input.category } : {}),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface ServiceDetailSchemaInput {
  url: string;
  name: string;
  description: string;
  serviceType: string;
}

export function buildServiceSchema(input: ServiceDetailSchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    url: input.url,
    provider: { '@type': 'Organization', '@id': ORG_ID, name: 'EcyPro Premium Consulting' },
    areaServed: { '@type': 'Country', name: 'Global' },
  };
}

export interface FaqSchemaInput {
  questions: Array<{ q: string; a: string }>;
}

export function buildFaqSchema(input: FaqSchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: input.questions.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export interface CaseStudySchemaInput {
  url: string;
  title: string;
  client: string;
  description: string;
  image: string;
  category?: string;
  goLive?: string;
  language?: 'tr' | 'en';
}

export function buildCaseStudySchema(input: CaseStudySchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': input.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    headline: input.title,
    description: input.description,
    image: input.image,
    inLanguage: input.language ?? 'tr',
    about: { '@type': 'Organization', name: input.client },
    publisher: {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: 'EcyPro Premium Consulting',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/pwa-512x512.png` },
    },
    ...(input.goLive ? { datePublished: input.goLive } : {}),
    ...(input.category ? { articleSection: input.category } : {}),
  };
}
