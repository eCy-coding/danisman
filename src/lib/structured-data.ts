/**
 * src/lib/structured-data.ts — Phase 20.5 H1 + P39-T05
 *
 * schema.org JSON-LD builders. Used by per-page `JsonLd` injections.
 *
 * P39-T05 additions (International SEO):
 *   - buildOrganizationSchema() — full Organization with address, areaServed,
 *     availableLanguage (TR+EN), contactPoint
 *   - GSC validation: https://search.google.com/test/rich-results
 *   - ISO 3166-1 alpha-2 country codes for areaServed
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

// ─── P39-T05: International Organization Schema ──────────────

/**
 * Full Organization JSON-LD for the homepage / global scope.
 *
 * Includes:
 *   - address: Istanbul, Türkiye (schema.org PostalAddress)
 *   - areaServed: TR, EU, US — signals global availability
 *   - availableLanguage: tr-TR + en-US
 *   - contactPoint: booking form + email
 *   - sameAs: social profiles for entity disambiguation
 *
 * GSC validation: https://search.google.com/test/rich-results
 *   → Type: Organization → "Items detected" + 0 errors
 */
export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ORG_ID,
    name: 'eCyPro Premium Consulting',
    alternateName: 'eCyPro',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/pwa-512x512.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/og-image.jpg`,
    description:
      'Stratejik danışmanlık, operasyonel verimlilik ve dijital dönüşüm için premium konsültasyon hizmetleri.',
    foundingDate: '2024',

    // P39-T05: Physical address (İstanbul)
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'İstanbul',
      addressRegion: 'İstanbul',
      addressCountry: 'TR',
    },

    // P39-T05: Areas served (ISO 3166-1 alpha-2)
    areaServed: [
      {
        '@type': 'Country',
        '@id': 'https://www.wikidata.org/entity/Q43',
        name: 'Türkiye',
        identifier: 'TR',
      },
      {
        '@type': 'Country',
        '@id': 'https://www.wikidata.org/entity/Q458',
        name: 'Avrupa Birliği',
        identifier: 'EU',
      },
      {
        '@type': 'Country',
        '@id': 'https://www.wikidata.org/entity/Q30',
        name: 'Amerika Birleşik Devletleri',
        identifier: 'US',
      },
    ],

    // P39-T05: Languages offered
    availableLanguage: [
      { '@type': 'Language', name: 'Turkish', alternateName: 'tr-TR' },
      { '@type': 'Language', name: 'English', alternateName: 'en-US' },
    ],

    // Contact
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Turkish', 'English'],
        contactOption: 'TollFree',
        url: `${SITE_URL}/contact`,
      },
    ],

    // Social entity disambiguation (sameAs)
    sameAs: [
      'https://www.linkedin.com/company/ecypro',
      'https://twitter.com/ecypro',
      'https://www.crunchbase.com/organization/ecypro',
    ],

    priceRange: '₺₺₺',
    currenciesAccepted: 'TRY, USD, EUR',
    paymentAccepted: 'Invoice, Bank Transfer',
  };
}

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
      name: 'eCyPro Premium Consulting',
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
    provider: { '@type': 'Organization', '@id': ORG_ID, name: 'eCyPro Premium Consulting' },
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

/**
 * Sprint 7 P42 — canonical AudioObject schema for NotebookLM Audio Overview
 * embeds (originally inlined in `src/components/blog/AudioOverview.tsx`).
 *
 * Codifies the JSON-LD AudioObject pattern flagged by the Coding Patterns
 * Librarian as an "Architect codification gap" during Sprint 6. Centralises
 * the encodingFormat auto-detection (mp3 → `audio/mpeg`, m4a → `audio/mp4`)
 * and the ISO-8601 duration encoding so future audio embeds reuse this
 * helper instead of growing ad-hoc inline schemas.
 */
export interface AudioObjectSchemaInput {
  /** Direct URL to the audio asset (mp3/m4a/wav). */
  audioUrl: string;
  /** Human-readable title — used as schema headline. */
  title: string;
  /** Canonical page URL — used as schema `url`. */
  url: string;
  /** Duration in seconds — serialised to ISO-8601 (PT…M…S). */
  durationSec?: number;
  /** ISO-8601 publish date — used as schema `uploadDate`. */
  publishedAt?: string;
  /** One-line description (≤160 chars). */
  description?: string;
  /** Override the auto-detected encodingFormat (e.g. `audio/wav`). */
  encodingFormat?: string;
}

/** Serialise a duration in seconds to schema.org ISO-8601 (PT…). */
function toIsoDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return 'PT0S';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m && s) return `PT${m}M${s}S`;
  if (m) return `PT${m}M`;
  return `PT${s}S`;
}

export function buildAudioObjectSchema(input: AudioObjectSchemaInput): Record<string, unknown> {
  const encodingFormat =
    input.encodingFormat ?? (input.audioUrl.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg');
  const obj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AudioObject',
    name: input.title,
    contentUrl: input.audioUrl,
    encodingFormat,
    url: input.url,
  };
  if (input.durationSec) obj.duration = toIsoDuration(input.durationSec);
  if (input.publishedAt) obj.uploadDate = input.publishedAt;
  if (input.description) obj.description = input.description;
  return obj;
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
      name: 'eCyPro Premium Consulting',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/pwa-512x512.png` },
    },
    ...(input.goLive ? { datePublished: input.goLive } : {}),
    ...(input.category ? { articleSection: input.category } : {}),
  };
}
