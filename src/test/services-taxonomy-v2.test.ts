/**
 * SVC P4 — Taxonomy v2 single-source contract (test-first).
 *
 * Encodes docs/reports/services-taxonomy-v2.json + ADR-services-taxonomy-v2:
 * one registry (`src/data/service-taxonomy.ts`), two validated projections
 * (MEGA_MENUS.services, DEPARTMENTS/SERVICES). Written RED before the
 * implementation existed (gate evidence in PROGRESS.md).
 */
import { describe, it, expect } from 'vitest';

import {
  SERVICE_DEPARTMENTS,
  PILLAR_PAGES,
  CANONICAL_SERVICE_SLUGS,
  isCanonicalServiceSlug,
  getLifecyclePosition,
  SERVICES_MEGA_MENU,
} from '@/data/service-taxonomy';
import { SERVICES, DEPARTMENTS } from '@/data/services';
import { SERVICE_CONTENT } from '@/data/service-content';
import { MEGA_MENUS } from '@/data/copy/common';
import { DOMAIN_ACCENT_MAP } from '@/lib/service-utils';

const V2_DEPARTMENTS: Record<string, string[]> = {
  ma: [
    'company-valuation',
    'negotiation-loi',
    'due-diligence-suite',
    'deal-structuring',
    'post-merger-integration',
  ],
  esg: [
    'esg-strategy',
    'double-materiality',
    'carbon-accounting',
    'esrs-roadmap',
    'csrd-compliance',
  ],
  fintech: ['data-governance', 'masak-aml', 'spk-casp', 'open-banking', 'crypto-web3'],
  aile: [
    'family-business',
    'family-business-governance',
    'succession-planning',
    'conflict-resolution',
    'wealth-transfer',
    'family-office',
  ],
  insan: ['hr-transformation', 'employer-branding', 'industrial-relations', 'payroll-audit'],
  risk: [
    'macro-risk',
    'crisis-management',
    'competition-economics',
    'government-relations',
    'global-intelligence',
    'smart-cities',
  ],
  buyume: ['market-entry', 'investment-incentives', 'neuromarketing', 'operational-excellence'],
};
const V2_PILLARS = [
  'strategic-transformation',
  'mergers-acquisitions',
  'ai-analytics',
  'digital-strategy',
];
const V2_MENU_TARGETS = [
  '/services/strategic-transformation',
  '/services/mergers-acquisitions',
  '/services/hr-transformation',
  '/services/ai-analytics',
  '/services/digital-strategy',
  '/services/data-governance',
  '/services/market-entry',
  '/services/operational-excellence',
  '/services/investment-incentives',
];

describe('service-taxonomy registry — structure', () => {
  it('has exactly 7 departments with the decided lifecycles', () => {
    expect(SERVICE_DEPARTMENTS.map((d) => d.id).sort()).toEqual(Object.keys(V2_DEPARTMENTS).sort());
    for (const dept of SERVICE_DEPARTMENTS) {
      expect(dept.lifecycle, `lifecycle of ${dept.id}`).toEqual(V2_DEPARTMENTS[dept.id]);
    }
  });

  it('every department is fully bilingual (label, chip, description)', () => {
    for (const d of SERVICE_DEPARTMENTS) {
      for (const field of ['label', 'chip', 'description'] as const) {
        expect(d[field].tr.trim(), `${d.id}.${field}.tr`).not.toHaveLength(0);
        expect(d[field].en.trim(), `${d.id}.${field}.en`).not.toHaveLength(0);
      }
    }
  });

  it('no slug belongs to two departments', () => {
    const all = SERVICE_DEPARTMENTS.flatMap((d) => d.lifecycle);
    expect(all).toHaveLength(new Set(all).size);
  });

  it('canonical set = 35 members + 4 pillar pages = 39', () => {
    expect(PILLAR_PAGES).toEqual(V2_PILLARS);
    expect(CANONICAL_SERVICE_SLUGS).toHaveLength(39);
  });

  it('every canonical slug has a content entry (no thin pages, no 404s)', () => {
    const missing = CANONICAL_SERVICE_SLUGS.filter((s) => !SERVICE_CONTENT[s]);
    expect(missing, `content missing for: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('content registry has no slug outside the canonical set (no new orphans)', () => {
    const canonical = new Set<string>(CANONICAL_SERVICE_SLUGS);
    const orphans = Object.keys(SERVICE_CONTENT).filter((s) => !canonical.has(s));
    expect(orphans, `orphans reborn: ${orphans.join(', ')}`).toHaveLength(0);
  });
});

describe('resolver contract', () => {
  it('accepts every canonical slug and rejects junk', () => {
    for (const slug of CANONICAL_SERVICE_SLUGS) {
      expect(isCanonicalServiceSlug(slug), slug).toBe(true);
    }
    expect(isCanonicalServiceSlug('not-a-service')).toBe(false);
    expect(isCanonicalServiceSlug('')).toBe(false);
  });

  it('getLifecyclePosition returns step/total for members, undefined for pillars', () => {
    const pos = getLifecyclePosition('due-diligence-suite');
    expect(pos).toMatchObject({ departmentId: 'ma', step: 3, total: 5 });
    expect(getLifecyclePosition('strategic-transformation')).toBeUndefined();
  });
});

describe('mega menu projection (Axis 1 — browse)', () => {
  it('MEGA_MENUS.services is the registry projection', () => {
    expect(MEGA_MENUS.services).toBe(SERVICES_MEGA_MENU);
  });

  it('9 items, 9 unique content-true targets, zero dead links', () => {
    const hrefs = SERVICES_MEGA_MENU.sections.flatMap((s) => s.items.map((i) => i.href));
    expect(hrefs).toHaveLength(9);
    expect(new Set(hrefs).size).toBe(9);
    expect([...hrefs].sort()).toEqual([...V2_MENU_TARGETS].sort());
    for (const href of hrefs) {
      const slug = href.split('/').pop() as string;
      expect(isCanonicalServiceSlug(slug), `${href} must resolve`).toBe(true);
    }
  });

  it('every item is bilingual with an icon; featured card preserved', () => {
    for (const sec of SERVICES_MEGA_MENU.sections) {
      expect(sec.title.tr).toBeTruthy();
      expect(sec.title.en).toBeTruthy();
      for (const item of sec.items) {
        expect(item.label.tr, `${item.id}.label.tr`).toBeTruthy();
        expect(item.label.en, `${item.id}.label.en`).toBeTruthy();
        expect(item.description.tr, `${item.id}.desc.tr`).toBeTruthy();
        expect(item.description.en, `${item.id}.desc.en`).toBeTruthy();
        expect(item.iconName, `${item.id}.iconName`).toBeTruthy();
      }
    }
    expect(SERVICES_MEGA_MENU.featured.href).toBe('/maturity-assessment');
  });
});

describe('catalog projection (Axis 2 — filter/cards)', () => {
  it('SERVICES has exactly one card per department member (35)', () => {
    expect(SERVICES).toHaveLength(35);
    const cardSlugs = SERVICES.map((s) => s.link.split('/').pop()).sort();
    const memberSlugs = SERVICE_DEPARTMENTS.flatMap((d) => d.lifecycle).sort();
    expect(cardSlugs).toEqual(memberSlugs);
  });

  it('every card category matches its taxonomy department', () => {
    for (const s of SERVICES) {
      const slug = s.link.split('/').pop() as string;
      const pos = getLifecyclePosition(slug);
      expect(pos, `${s.id} (${slug}) must be a department member`).toBeDefined();
      expect(s.category, `${s.id} category`).toBe(pos?.departmentId);
    }
  });

  it('ma-valuation card links to its own company-valuation page', () => {
    const card = SERVICES.find((s) => s.id === 'ma-valuation');
    expect(card?.link).toBe('/services/company-valuation');
  });

  it('DEPARTMENTS chips are derived from the registry (all + 7, ≤8)', () => {
    expect(DEPARTMENTS[0].id).toBe('all');
    expect(DEPARTMENTS.slice(1).map((d) => d.id)).toEqual(SERVICE_DEPARTMENTS.map((d) => d.id));
    expect(DEPARTMENTS).toHaveLength(8);
  });

  it('DOMAIN_ACCENT_MAP covers all 7 departments', () => {
    for (const d of SERVICE_DEPARTMENTS) {
      expect(DOMAIN_ACCENT_MAP[d.id], `${d.id} accent missing`).toBeDefined();
    }
  });
});
