/**
 * Sprint 7 P42 — canonical structured-data helper unit tests.
 *
 * Co-located vitest (`*.test.ts`) per WEB_STANDARDS §7. Covers every named
 * builder exported from `structured-data.ts` so future schema callers can
 * rely on a single verified set of helpers (Coding Patterns Librarian
 * canonical SHOULD coverage).
 */
import { describe, it, expect } from 'vitest';

import {
  buildArticleSchema,
  buildAudioObjectSchema,
  buildBreadcrumbSchema,
  buildCaseStudySchema,
  buildFaqSchema,
  buildOrganizationSchema,
  buildServiceSchema,
} from './structured-data';

describe('buildAudioObjectSchema', () => {
  const base = {
    audioUrl: 'https://cdn.ecypro.com/audio/trifecta.mp3',
    title: 'Fintech Trifecta — Audio Deep Dive',
    url: 'https://ecypro.com/blog/fintech-trifecta',
  };

  it('returns @context and @type for any input', () => {
    const schema = buildAudioObjectSchema(base);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('AudioObject');
  });

  it('includes the required name + contentUrl + url fields', () => {
    const schema = buildAudioObjectSchema(base);
    expect(schema.name).toBe(base.title);
    expect(schema.contentUrl).toBe(base.audioUrl);
    expect(schema.url).toBe(base.url);
  });

  it('auto-detects audio/mpeg for mp3 URLs', () => {
    expect(buildAudioObjectSchema(base).encodingFormat).toBe('audio/mpeg');
  });

  it('auto-detects audio/mp4 for m4a URLs', () => {
    const schema = buildAudioObjectSchema({
      ...base,
      audioUrl: 'https://cdn.ecypro.com/audio/foo.m4a',
    });
    expect(schema.encodingFormat).toBe('audio/mp4');
  });

  it('honours an explicit encodingFormat override', () => {
    const schema = buildAudioObjectSchema({ ...base, encodingFormat: 'audio/wav' });
    expect(schema.encodingFormat).toBe('audio/wav');
  });

  it('serialises durationSec to ISO-8601 PT…M…S', () => {
    expect(buildAudioObjectSchema({ ...base, durationSec: 482 }).duration).toBe('PT8M2S');
  });

  it('drops seconds when the duration is a whole minute', () => {
    expect(buildAudioObjectSchema({ ...base, durationSec: 360 }).duration).toBe('PT6M');
  });

  it('serialises sub-minute durations as PT…S', () => {
    expect(buildAudioObjectSchema({ ...base, durationSec: 45 }).duration).toBe('PT45S');
  });

  it('omits duration when durationSec is not provided', () => {
    expect(buildAudioObjectSchema(base).duration).toBeUndefined();
  });

  it('omits uploadDate when publishedAt is not provided', () => {
    expect(buildAudioObjectSchema(base).uploadDate).toBeUndefined();
  });

  it('omits description when not provided', () => {
    expect(buildAudioObjectSchema(base).description).toBeUndefined();
  });

  it('threads optional uploadDate + description through to the schema', () => {
    const schema = buildAudioObjectSchema({
      ...base,
      durationSec: 482,
      publishedAt: '2026-07-07',
      description: 'SPK + MASAK + KVKK kesişimi.',
    });
    expect(schema.duration).toBe('PT8M2S');
    expect(schema.uploadDate).toBe('2026-07-07');
    expect(schema.description).toBe('SPK + MASAK + KVKK kesişimi.');
  });
});

describe('buildOrganizationSchema', () => {
  const schema = buildOrganizationSchema();

  it('emits ProfessionalService with the canonical @id', () => {
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('ProfessionalService');
    expect(schema['@id']).toBe('https://ecypro.com#organization');
  });

  it('keeps the eCyPro brand name verbatim (brand casing rule)', () => {
    expect(schema.name).toBe('eCyPro Premium Consulting');
    expect(schema.alternateName).toBe('eCyPro');
  });

  it('declares Istanbul as the postal address (TR)', () => {
    const address = schema.address as Record<string, unknown>;
    expect(address['@type']).toBe('PostalAddress');
    expect(address.addressLocality).toBe('İstanbul');
    expect(address.addressCountry).toBe('TR');
  });

  it('serves TR + EU + US (ISO 3166-1 alpha-2)', () => {
    const areas = schema.areaServed as Array<{ identifier: string }>;
    expect(areas.map((a) => a.identifier)).toEqual(['TR', 'EU', 'US']);
  });

  it('offers Turkish + English language entries', () => {
    const langs = schema.availableLanguage as Array<{ alternateName: string }>;
    expect(langs.map((l) => l.alternateName)).toEqual(['tr-TR', 'en-US']);
  });
});

describe('buildArticleSchema', () => {
  const base = {
    url: 'https://ecypro.com/blog/cfo-ai-rehberi',
    title: 'CFO için AI Rehberi',
    description: 'Strateji + risk + governance.',
    image: 'https://cdn.ecypro.com/blog/cfo-ai.jpg',
    publishedAt: '2026-05-01T00:00:00Z',
    author: 'Emre Can Yalçın',
  };

  it('emits Article with mainEntityOfPage pointing at the canonical url', () => {
    const schema = buildArticleSchema(base);
    expect(schema['@type']).toBe('Article');
    expect(schema.headline).toBe(base.title);
    const main = schema.mainEntityOfPage as Record<string, unknown>;
    expect(main['@id']).toBe(base.url);
  });

  it('reuses publishedAt as dateModified when modifiedAt is not provided', () => {
    expect(buildArticleSchema(base).dateModified).toBe(base.publishedAt);
  });

  it('honours modifiedAt when supplied', () => {
    const schema = buildArticleSchema({ ...base, modifiedAt: '2026-05-30T00:00:00Z' });
    expect(schema.dateModified).toBe('2026-05-30T00:00:00Z');
  });

  it('defaults inLanguage to tr', () => {
    expect(buildArticleSchema(base).inLanguage).toBe('tr');
  });

  it('threads language override through to inLanguage', () => {
    expect(buildArticleSchema({ ...base, language: 'en' }).inLanguage).toBe('en');
  });

  it('omits articleSection when no category is provided', () => {
    expect(buildArticleSchema(base).articleSection).toBeUndefined();
  });

  it('emits articleSection when category is provided', () => {
    expect(buildArticleSchema({ ...base, category: 'Strateji' }).articleSection).toBe('Strateji');
  });
});

describe('buildBreadcrumbSchema', () => {
  it('emits BreadcrumbList with sequential 1-based positions', () => {
    const schema = buildBreadcrumbSchema([
      { name: 'Anasayfa', url: 'https://ecypro.com/' },
      { name: 'Blog', url: 'https://ecypro.com/blog' },
      { name: 'Yazı', url: 'https://ecypro.com/blog/yazi' },
    ]);
    expect(schema['@type']).toBe('BreadcrumbList');
    const items = schema.itemListElement as Array<{ position: number; name: string; item: string }>;
    expect(items).toHaveLength(3);
    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
    expect(items[2].position).toBe(3);
    expect(items[0].item).toBe('https://ecypro.com/');
  });

  it('handles an empty list without throwing', () => {
    const schema = buildBreadcrumbSchema([]);
    expect(schema.itemListElement).toEqual([]);
  });
});

describe('buildServiceSchema', () => {
  const base = {
    url: 'https://ecypro.com/services/kvkk-audit',
    name: 'KVKK Audit',
    description: 'KVKK m.4 + m.12 uyumluluk denetimi.',
    serviceType: 'Regulatory Compliance',
  };

  it('emits Service with the eCyPro organization as provider', () => {
    const schema = buildServiceSchema(base);
    expect(schema['@type']).toBe('Service');
    expect(schema.name).toBe(base.name);
    const provider = schema.provider as Record<string, unknown>;
    expect(provider['@id']).toBe('https://ecypro.com#organization');
  });

  it('declares Global areaServed by default', () => {
    const area = buildServiceSchema(base).areaServed as Record<string, unknown>;
    expect(area['@type']).toBe('Country');
    expect(area.name).toBe('Global');
  });
});

describe('buildFaqSchema', () => {
  it('maps each Q/A pair to a Question + Answer entity', () => {
    const schema = buildFaqSchema({
      questions: [
        { q: 'KVKK nedir?', a: 'Türkiye veri koruma kanunu.' },
        { q: 'GDPR farkı?', a: 'AB karşılığı.' },
      ],
    });
    expect(schema['@type']).toBe('FAQPage');
    const entities = schema.mainEntity as Array<{
      '@type': string;
      name: string;
      acceptedAnswer: { '@type': string; text: string };
    }>;
    expect(entities).toHaveLength(2);
    expect(entities[0]['@type']).toBe('Question');
    expect(entities[0].name).toBe('KVKK nedir?');
    expect(entities[0].acceptedAnswer['@type']).toBe('Answer');
    expect(entities[0].acceptedAnswer.text).toBe('Türkiye veri koruma kanunu.');
  });

  it('handles an empty question list without throwing', () => {
    expect(buildFaqSchema({ questions: [] }).mainEntity).toEqual([]);
  });
});

describe('buildCaseStudySchema', () => {
  const base = {
    url: 'https://ecypro.com/case-studies/sirket-x-donusum',
    title: 'Şirket X Dijital Dönüşüm',
    client: 'Şirket X',
    description: '12 ayda operasyonel verimlilik artışı.',
    image: 'https://cdn.ecypro.com/case/x.jpg',
  };

  it('emits Article keyed by the case study url', () => {
    const schema = buildCaseStudySchema(base);
    expect(schema['@type']).toBe('Article');
    expect(schema['@id']).toBe(base.url);
    expect(schema.headline).toBe(base.title);
  });

  it('threads the client through `about.name`', () => {
    const about = buildCaseStudySchema(base).about as Record<string, unknown>;
    expect(about['@type']).toBe('Organization');
    expect(about.name).toBe(base.client);
  });

  it('omits datePublished + articleSection when not provided', () => {
    const schema = buildCaseStudySchema(base);
    expect(schema.datePublished).toBeUndefined();
    expect(schema.articleSection).toBeUndefined();
  });

  it('threads goLive into datePublished + category into articleSection', () => {
    const schema = buildCaseStudySchema({
      ...base,
      goLive: '2026-03-15',
      category: 'Operasyonel Verimlilik',
    });
    expect(schema.datePublished).toBe('2026-03-15');
    expect(schema.articleSection).toBe('Operasyonel Verimlilik');
  });

  it('defaults inLanguage to tr and accepts en override', () => {
    expect(buildCaseStudySchema(base).inLanguage).toBe('tr');
    expect(buildCaseStudySchema({ ...base, language: 'en' }).inLanguage).toBe('en');
  });
});
