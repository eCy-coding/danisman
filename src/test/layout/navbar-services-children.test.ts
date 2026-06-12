/**
 * Phase 4 — Tek doğruluk kaynağı (single source of truth) regresyonu.
 *
 * merge 2026-06-12: getMegaChildren (copy/common) main'de silindi → tek kaynak
 * artık src/data/service-taxonomy.ts SERVICES_MEGA_MENU projeksiyonu
 * (ADR-services-taxonomy-v2). Mobil akordeon NAV_ITEMS.services.children ile
 * küratörlü bir KISAYOL alt-kümesi gösteriyor (9 öğenin tamamı değil).
 *
 * Garanti eder ki:
 *   1) NAV_ITEMS.services.children (mobil) stale/dead href TUTMAZ — her hedef
 *      canonical mega-menü hedefleri kümesinin elemanıdır (drift imkânsız).
 *   2) MEGA_MENUS.services taxonomy projeksiyonunun ta kendisidir ve masaüstü
 *      mega-menüyle birebir 9 benzersiz öğe türetir (eski getMegaChildren
 *      kontratının merged karşılığı).
 */

import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, MEGA_MENUS } from '@/data/copy/common';
import { SERVICES_MEGA_MENU } from '@/data/service-taxonomy';

interface MenuChild {
  id: string;
  href: string;
}

const megaItems = () => SERVICES_MEGA_MENU.sections.flatMap((s) => s.items);
const mobileChildren = () => (NAV_ITEMS.services as { children?: MenuChild[] }).children ?? [];

describe('Navbar services menüsü — tek kaynak', () => {
  it('NAV_ITEMS.services stale children tutmaz', () => {
    // merge 2026-06-12: `children === undefined` kontratı → main mobil için
    // küratörlü kısayolları geri getirdi; "stale tutmaz" garantisi artık
    // "her child href canonical taxonomy hedefidir" olarak yaşıyor.
    const canonicalHrefs = new Set(megaItems().map((i) => i.href));
    const children = mobileChildren();
    expect(children.length).toBeGreaterThan(0);
    for (const child of children) {
      expect(canonicalHrefs.has(child.href), `stale mobil href: ${child.href}`).toBe(true);
    }
    // Kopya hedef de stale sayılır — kısayol listesi benzersiz olmalı.
    expect(new Set(children.map((c) => c.href)).size).toBe(children.length);
  });

  it('services mega menüsü MEGA_MENUS ile birebir 9 öğe türetir', () => {
    // merge 2026-06-12: getMegaChildren('services') → SERVICES_MEGA_MENU
    // projeksiyon kimliği (referans eşitliği = kopya/drift imkânsız).
    expect(MEGA_MENUS.services).toBe(SERVICES_MEGA_MENU);

    const derived = megaItems();
    expect(derived).toHaveLength(9);
    expect(new Set(derived.map((d) => d.href)).size).toBe(9);
    expect(new Set(derived.map((d) => d.id)).size).toBe(9);
  });

  it('türetilen mobil öğeler masaüstüyle aynı derin-link slug setine sahip', () => {
    for (const item of megaItems()) {
      expect(item.href.startsWith('/services/')).toBe(true);
    }
    // Mobil kısayol slug seti ⊆ masaüstü slug seti (ayrık evren yok).
    const desktopSlugs = new Set(megaItems().map((i) => i.href.split('/').pop()));
    for (const child of mobileChildren()) {
      const slug = child.href.split('/').pop() as string;
      expect(desktopSlugs.has(slug), `mobil slug masaüstünde yok: ${slug}`).toBe(true);
    }
  });
});
