/**
 * L1-5 — /services boutique content validation
 *
 * Pure data tests — no rendering. Validates catalogue shape, brand voice,
 * cluster distribution, Founder-led copy, and accent color coverage.
 */

import { describe, it, expect } from 'vitest';
import { SERVICES, DEPARTMENTS } from '@/data/services';
import { DOMAIN_ACCENT_MAP } from '@/components/services/ServiceCard';

const FOUNDER_PATTERNS = [
  /kurucu/i,
  /emre can yalç/i,
  /partner.led/i,
  /kıdemli ortak/i,
  /founder/i,
];

const BRAND_VIOLATIONS = [/\bLead\b/, /\bDeal\b/, /\bRetainer\b/];

const GENERIC_SAAS = [
  /real.time analiti/i,
  /unified dashboard/i,
  /askeri düzeyde/i,
  /milisaniyeler/i,
];

const CLUSTER_IDS = ['ma', 'esg', 'fintech', 'aile'];

// ---------------------------------------------------------------------------

describe('SERVICES catalogue — shape', () => {
  it('exports exactly 21 services', () => {
    expect(SERVICES).toHaveLength(21);
  });

  it('DEPARTMENTS has exactly 4 clusters (plus "all")', () => {
    const nonAll = DEPARTMENTS.filter((d) => d.id !== 'all');
    expect(nonAll).toHaveLength(4);
    expect(nonAll.map((d) => d.id).sort()).toEqual([...CLUSTER_IDS].sort());
  });

  it('every service has a recognised cluster id', () => {
    const invalid = SERVICES.filter((s) => !CLUSTER_IDS.includes(s.category));
    expect(invalid).toHaveLength(0);
  });

  it('each cluster has 4–6 services', () => {
    for (const id of CLUSTER_IDS) {
      const count = SERVICES.filter((s) => s.category === id).length;
      expect(count, `cluster ${id} has ${count} services`).toBeGreaterThanOrEqual(4);
      expect(count, `cluster ${id} has ${count} services`).toBeLessThanOrEqual(6);
    }
  });

  it('all services have non-empty id, title, description, link', () => {
    for (const s of SERVICES) {
      expect(s.id.trim().length, `id missing on ${s.id}`).toBeGreaterThan(0);
      expect(s.title.trim().length, `title missing on ${s.id}`).toBeGreaterThan(0);
      expect(s.description.trim().length, `desc missing on ${s.id}`).toBeGreaterThan(9);
      expect(s.link.startsWith('/'), `link not rooted on ${s.id}`).toBe(true);
    }
  });

  it('no duplicate service ids', () => {
    const ids = SERVICES.map((s) => s.id);
    const unique = new Set(ids);
    expect(ids).toHaveLength(unique.size);
  });
});

// ---------------------------------------------------------------------------

describe('SERVICES catalogue — brand voice', () => {
  it('zero BRAND_VIOLATIONS (Lead / Deal / Retainer)', () => {
    const hits: string[] = [];
    for (const s of SERVICES) {
      for (const re of BRAND_VIOLATIONS) {
        if (re.test(s.title) || re.test(s.description)) {
          hits.push(`${s.id}: "${re.source}"`);
        }
      }
    }
    expect(hits, `brand violations: ${hits.join(', ')}`).toHaveLength(0);
  });

  it('zero generic SaaS phrases', () => {
    const hits: string[] = [];
    for (const s of SERVICES) {
      for (const re of GENERIC_SAAS) {
        if (re.test(s.title) || re.test(s.description)) {
          hits.push(`${s.id}: "${re.source}"`);
        }
      }
    }
    expect(hits, `generic SaaS phrases: ${hits.join(', ')}`).toHaveLength(0);
  });

  it('at least 3 services have Founder-led copy', () => {
    const founderServices = SERVICES.filter((s) =>
      FOUNDER_PATTERNS.some((re) => re.test(s.description) || re.test(s.title)),
    );
    expect(
      founderServices.length,
      `only ${founderServices.length} services have Founder-led copy`,
    ).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------

describe('DOMAIN_ACCENT_MAP — coverage', () => {
  it('exported map covers all 4 clusters', () => {
    for (const id of CLUSTER_IDS) {
      expect(DOMAIN_ACCENT_MAP[id], `${id} missing from DOMAIN_ACCENT_MAP`).toBeDefined();
    }
  });

  it('each entry has badge and glow fields', () => {
    for (const [id, entry] of Object.entries(DOMAIN_ACCENT_MAP)) {
      expect((entry as Record<string, string>).badge, `${id}.badge missing`).toBeTruthy();
      expect((entry as Record<string, string>).glow, `${id}.glow missing`).toBeTruthy();
    }
  });
});
