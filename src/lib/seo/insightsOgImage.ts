// OG image URL builder for insights posts.
// Actual image generation happens at build time via scripts/generate-og-image.mjs.
// This module provides URL helpers consumed by React meta tag components.

const BASE_URL = 'https://ecypro.com';

export function buildInsightsOgImageUrl(slug: string): string {
  return `${BASE_URL}/og/insights/${slug}.png`;
}

export function buildInsightsOgImagePath(slug: string): string {
  return `/og/insights/${slug}.png`;
}

export interface OgImageMeta {
  title: string;
  authorName: string;
  domain: string;
  coverImageUrl?: string;
}

export function buildOgImageMetaTags(meta: OgImageMeta, slug: string): Record<string, string> {
  const ogUrl = buildInsightsOgImageUrl(slug);
  return {
    'og:image': ogUrl,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': `${meta.title} — eCyPro Perspektif`,
    'twitter:card': 'summary_large_image',
    'twitter:image': ogUrl,
  };
}
