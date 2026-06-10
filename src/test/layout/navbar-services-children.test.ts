/**
 * Phase 4 — Tek doğruluk kaynağı (single source of truth) regresyonu.
 *
 * Garanti eder ki:
 *   1) NAV_ITEMS.services artık stale `children` kopyası TUTMAZ.
 *   2) Navbar.getMegaChildren('services') mobil akordeon için MEGA_MENUS'tan
 *      tam 9 öğe türetir (masaüstü mega-menüyle birebir aynı href'ler).
 */

import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, MEGA_MENUS, getMegaChildren } from '@/data/copy/common';

describe('Navbar services menüsü — tek kaynak', () => {
  it('NAV_ITEMS.services stale children tutmaz', () => {
    const services = NAV_ITEMS.services as { children?: unknown[] };
    expect(services.children).toBeUndefined();
  });

  it('getMegaChildren("services") MEGA_MENUS ile birebir 9 öğe türetir', () => {
    const derived = getMegaChildren('services');
    const expected = MEGA_MENUS.services.sections.flatMap((s) => s.items);

    expect(derived).toHaveLength(9);
    expect(derived.map((d) => d.href)).toEqual(expected.map((e) => e.href));
    expect(derived.map((d) => d.id)).toEqual(expected.map((e) => e.id));
  });

  it('türetilen mobil öğeler masaüstüyle aynı derin-link slug setine sahip', () => {
    const derived = getMegaChildren('services');
    for (const child of derived) {
      expect(child.href.startsWith('/services/')).toBe(true);
    }
  });
});
