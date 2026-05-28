/**
 * L1-5 — Boutique tone compliance tests for service-content.ts
 *
 * Why: brand voice TR strict = "retainer" is YASAK in UI-visible fields.
 * Replace with "aylık ortaklık" / "ortaklık" / "briefing ortaklığı".
 */

import { describe, it, expect } from 'vitest';
import { SERVICE_CONTENT } from './service-content';

function uiText(content: (typeof SERVICE_CONTENT)[string]): string {
  return [
    content.hero.subtitle,
    content.hero.valueProp,
    content.investment.range,
    content.investment.model,
    content.investment.paymentPlan,
    content.timeline.totalDuration,
    content.trust.anonymizedExample,
    ...content.faq.items.map((f) => f.a),
  ]
    .filter(Boolean)
    .join('\n');
}

describe('service-content — boutique tone compliance', () => {
  it('no "retainer" in any UI-visible field (brand voice TR strict)', () => {
    const violations: string[] = [];
    for (const [slug, content] of Object.entries(SERVICE_CONTENT)) {
      if (uiText(content).toLowerCase().includes('retainer')) {
        violations.push(slug);
      }
    }
    expect(
      violations,
      `Brand voice violation — "retainer" found in: ${violations.join(', ')}`,
    ).toHaveLength(0);
  });

  it('all 21 services have non-trivial hero.valueProp (boutique = specific)', () => {
    for (const [slug, content] of Object.entries(SERVICE_CONTENT)) {
      expect(
        content.hero.valueProp.length,
        `${slug}: hero.valueProp too short (< 60 chars)`,
      ).toBeGreaterThanOrEqual(60);
    }
  });

  it('all 21 services covered in SERVICE_CONTENT', () => {
    const expectedSlugs = [
      'strategic-transformation',
      'mergers-acquisitions',
      'family-business',
      'operational-excellence',
      'neuromarketing',
      'hr-transformation',
      'crisis-management',
      'ai-analytics',
      'digital-strategy',
      'data-governance',
      'esg-strategy',
      'investment-incentives',
      'macro-risk',
      'competition-economics',
      'industrial-relations',
      'payroll-audit',
      'employer-branding',
      'market-entry',
      'global-intelligence',
      'smart-cities',
      'government-relations',
    ];
    for (const slug of expectedSlugs) {
      expect(SERVICE_CONTENT[slug], `${slug}: missing from SERVICE_CONTENT`).toBeDefined();
    }
    expect(Object.keys(SERVICE_CONTENT)).toHaveLength(21);
  });
});
