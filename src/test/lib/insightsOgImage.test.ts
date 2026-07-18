import { describe, test, expect } from 'vitest';
import { buildInsightsOgImageUrl, buildOgImageMetaTags } from '../../lib/seo/insightsOgImage';

describe('insightsOgImage', () => {
  test('buildInsightsOgImageUrl returns correct URL format', () => {
    const url = buildInsightsOgImageUrl('m-a-due-diligence-checklist');
    expect(url).toBe('https://ecypro.com/og/insights/m-a-due-diligence-checklist.png');
  });

  test('buildOgImageMetaTags returns og:image and twitter:card', () => {
    const meta = {
      title: 'M&A Due Diligence Checklist',
      authorName: 'Emre Can Yalçın',
      domain: 'M_A',
    };
    const tags = buildOgImageMetaTags(meta, 'm-a-due-diligence-checklist');
    expect(tags['og:image']).toBeDefined();
    expect(tags['twitter:card']).toBe('summary_large_image');
  });

  test('og:image dimensions are 1200x630', () => {
    const meta = {
      title: 'ESG Roadmap',
      authorName: 'Emre Can Yalçın',
      domain: 'ESG',
    };
    const tags = buildOgImageMetaTags(meta, 'esrs-roadmap-2026');
    expect(tags['og:image:width']).toBe('1200');
    expect(tags['og:image:height']).toBe('630');
  });

  test('og:image:alt includes post title and eCyPro', () => {
    const meta = {
      title: 'Fintech AML Uyum',
      authorName: 'Emre Can Yalçın',
      domain: 'FINTECH',
    };
    const tags = buildOgImageMetaTags(meta, 'masak-aml-kyc');
    expect(tags['og:image:alt']).toContain('Fintech AML Uyum');
    expect(tags['og:image:alt']).toContain('eCyPro');
  });
});
