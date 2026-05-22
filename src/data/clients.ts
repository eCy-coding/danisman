/**
 * P51.1 — Anonymized client logos (NDA-friendly).
 *
 * Gerçek client logoları NDA gerekirse: ENV `VITE_DISPLAY_REAL_CLIENT_LOGOS=true`
 * + `public/clients/<slug>.svg` upload. Aksi takdirde aşağıdaki anonim placeholder'lar
 * render olur — sektör + ölçek hint var, gerçek isim YOK.
 */

export interface AnonymizedClient {
  id: string;
  sector: string;
  size: string;
  region: string;
  /** Inline SVG render — domain hint */
  glyph: 'industry' | 'finance' | 'tech' | 'retail' | 'energy' | 'pharma' | 'logistics' | 'ngo';
}

export const ANONYMIZED_CLIENTS: AnonymizedClient[] = [
  {
    id: 'mfg-mid',
    sector: 'Üretim · Yan Sanayi',
    size: 'Orta (250-1000)',
    region: 'Marmara',
    glyph: 'industry',
  },
  {
    id: 'fin-large',
    sector: 'Bankacılık · Bireysel',
    size: 'Büyük (5000+)',
    region: 'İstanbul',
    glyph: 'finance',
  },
  {
    id: 'tech-saas',
    sector: 'B2B SaaS · Teknoloji',
    size: 'Scale-up (180)',
    region: 'İstanbul · Ankara',
    glyph: 'tech',
  },
  {
    id: 'retail-fmcg',
    sector: 'Hızlı Tüketim · Perakende',
    size: 'Büyük (12 mağaza zinciri)',
    region: 'Türkiye geneli',
    glyph: 'retail',
  },
  {
    id: 'energy-renewable',
    sector: 'Yenilenebilir Enerji',
    size: 'Orta (450)',
    region: 'Anadolu',
    glyph: 'energy',
  },
  {
    id: 'pharma-mid',
    sector: 'İlaç Üreticisi',
    size: 'Orta (180)',
    region: 'Marmara',
    glyph: 'pharma',
  },
  {
    id: 'logistics-3pl',
    sector: 'Lojistik · 3PL',
    size: 'Orta (650)',
    region: 'Avrupa & Asya yakası',
    glyph: 'logistics',
  },
  {
    id: 'ngo-impact',
    sector: 'STK · Sosyal Etki',
    size: 'Küçük (45)',
    region: 'Türkiye',
    glyph: 'ngo',
  },
];

export const SHOULD_DISPLAY_REAL_LOGOS = (() => {
  const env = import.meta.env.VITE_DISPLAY_REAL_CLIENT_LOGOS;
  return env === 'true' || env === '1';
})();
