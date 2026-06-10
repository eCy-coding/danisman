/**
 * Phase 3 — Navbar HİZMETLER mega-menü link bütünlüğü.
 *
 * Garanti eder ki:
 *   1) services mega-menüsünde tam 3 kategori + 9 hizmet öğesi var.
 *   2) Her hizmet öğesi /services/<slug> biçiminde derin-link verir
 *      (hiçbiri jenerik /services'e düşmez).
 *   3) Her slug GERÇEKTEN çözülebilir: SERVICE_CONTENT veya SERVICES
 *      kataloğundan biri (ServiceDetailPage resolver'ıyla aynı mantık).
 *   4) Öne çıkan (featured) CTA /maturity-assessment'a gider.
 */

import { describe, it, expect } from 'vitest';
import { MEGA_MENUS } from '@/data/copy/common';
import { SERVICE_CONTENT } from '@/data/service-content';
import { SERVICES } from '@/data/services';

// ServiceDetailPage resolver'ıyla birebir aynı çözülebilirlik kümesi:
// slug, SERVICE_CONTENT'te VEYA SERVICES kataloğunda olmalı.
const catalogSlugs = SERVICES.map((s) => s.link?.split('/services/')[1]).filter(
  Boolean,
) as string[];
const resolvableSlugs = new Set<string>([...Object.keys(SERVICE_CONTENT), ...catalogSlugs]);

const services = MEGA_MENUS.services;
const allItems = services.sections.flatMap((sec) => sec.items);

describe('Mega-menü (services) — link bütünlüğü', () => {
  it('tam 3 kategori içerir', () => {
    expect(services.sections).toHaveLength(3);
  });

  it('tam 9 hizmet öğesi içerir', () => {
    expect(allItems).toHaveLength(9);
  });

  it('hiçbir öğe jenerik /services veya hash-link değil', () => {
    for (const item of allItems) {
      expect(item.href, `${item.id}: çıplak /services'e düşüyor`).not.toBe('/services');
      expect(item.href.startsWith('/services/'), `${item.id}: ${item.href} derin-link değil`).toBe(
        true,
      );
    }
  });

  it("her öğenin slug'ı SERVICE_CONTENT veya SERVICES'ten çözülebilir", () => {
    for (const item of allItems) {
      const slug = item.href.replace('/services/', '');
      expect(resolvableSlugs.has(slug), `${item.id}: "${slug}" çözülemiyor (/404 riski)`).toBe(
        true,
      );
    }
  });

  it("öne çıkan CTA /maturity-assessment'a gider", () => {
    expect(services.featured.href).toBe('/maturity-assessment');
  });

  it('her öğenin TR ve EN etiketi vardır', () => {
    for (const item of allItems) {
      expect(item.label.tr.length, `${item.id}: TR etiket boş`).toBeGreaterThan(0);
      expect(item.label.en.length, `${item.id}: EN etiket boş`).toBeGreaterThan(0);
    }
  });
});

// Phase 5 — i18n disiplini. Karar: menü metinleri (mevcut proje pattern'iyle
// tutarlı) common.ts içinde inline {tr,en} olarak tutulur; locale dosyalarına
// taşınmaz (düşük riskli, sıfır orphan-key). Bu blok her görünür alanın HEM tr
// HEM en içerdiğini doğrular — eksik çeviri (orphan) regresyonunu yakalar.
describe('Mega-menü (services) — i18n tamlığı (tr + en)', () => {
  const bothLangs = (obj: { tr?: string; en?: string } | undefined, label: string) => {
    expect(obj?.tr?.trim().length, `${label}: TR eksik`).toBeGreaterThan(0);
    expect(obj?.en?.trim().length, `${label}: EN eksik`).toBeGreaterThan(0);
  };

  it('kategori başlıkları çift dilli', () => {
    services.sections.forEach((s) => bothLangs(s.title, `section ${s.id} title`));
  });

  it('öğe etiket + açıklamaları çift dilli', () => {
    allItems.forEach((i) => {
      bothLangs(i.label, `${i.id} label`);
      bothLangs(i.description, `${i.id} description`);
    });
  });

  it('öne çıkan kart (tag/title/description/cta) çift dilli', () => {
    const f = services.featured;
    bothLangs(f.tag, 'featured tag');
    bothLangs(f.title, 'featured title');
    bothLangs(f.description, 'featured description');
    bothLangs(f.cta, 'featured cta');
  });
});
