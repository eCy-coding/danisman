#!/usr/bin/env node
/**
 * Anonim sektör rozeti SVG üretici (8 adet).
 *
 * Çıktı:
 *   public/clients/*.svg  (200×80 viewBox, mono navy veya gold)
 *
 * Tasarım: "AI Studio Tech" doktrini — solid surfaces, navy/gold, glass YOK.
 * Tipografi: Inter / system-ui sans-serif, kalın uppercase, letter-spacing geniş.
 *
 * Çalıştırma:
 *   node scripts/generate-client-logos.mjs
 */
import { mkdirSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'public/clients');

const NAVY = '#0B1220';
const GOLD = '#D4AF37';

// Sektör tema haritası — finans/teknoloji branch'i gold, holding/manufacturing/cultural/retail navy
const BADGES = [
  {
    file: 'tech-scaleup.svg',
    label: 'TECH SCALE-UP',
    color: GOLD,
    icon: (c) =>
      // Yukarı doğru chevron + node noktaları (tech network)
      `<polyline points="14,46 26,32 38,40 54,22" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="14" cy="46" r="3" fill="${c}"/>` +
      `<circle cx="54" cy="22" r="3" fill="${c}"/>`,
  },
  {
    file: 'family-holding.svg',
    label: 'FAMILY HOLDING',
    color: NAVY,
    icon: (c) =>
      // İç içe iki kare (holding/portföy)
      `<rect x="14" y="20" width="28" height="28" fill="none" stroke="${c}" stroke-width="3"/>` +
      `<rect x="26" y="32" width="28" height="28" fill="none" stroke="${c}" stroke-width="3"/>`,
  },
  {
    file: 'manufacturing-group.svg',
    label: 'MANUFACTURING',
    color: NAVY,
    icon: (c) =>
      // Üç fabrika dişlisi (basit kule + dişli benzeri)
      `<rect x="14" y="44" width="10" height="16" fill="${c}"/>` +
      `<rect x="28" y="36" width="10" height="24" fill="${c}"/>` +
      `<rect x="42" y="28" width="10" height="32" fill="${c}"/>`,
  },
  {
    file: 'ma-advisory.svg',
    label: 'M&A ADVISORY',
    color: GOLD,
    icon: (c) =>
      // İki çember + birleşme oku (merger)
      `<circle cx="22" cy="40" r="12" fill="none" stroke="${c}" stroke-width="3"/>` +
      `<circle cx="46" cy="40" r="12" fill="none" stroke="${c}" stroke-width="3"/>`,
  },
  {
    file: 'cultural-org.svg',
    label: 'CULTURAL ORG',
    color: NAVY,
    icon: (c) =>
      // Sütun + üst saçak (klasik kültürel kurum)
      `<rect x="14" y="22" width="40" height="4" fill="${c}"/>` +
      `<rect x="18" y="28" width="4" height="26" fill="${c}"/>` +
      `<rect x="32" y="28" width="4" height="26" fill="${c}"/>` +
      `<rect x="46" y="28" width="4" height="26" fill="${c}"/>` +
      `<rect x="12" y="56" width="44" height="4" fill="${c}"/>`,
  },
  {
    file: 'fintech.svg',
    label: 'FINTECH',
    color: GOLD,
    icon: (c) =>
      // Yukarı trend chart + bar (fintech up)
      `<rect x="14" y="44" width="6" height="16" fill="${c}"/>` +
      `<rect x="24" y="36" width="6" height="24" fill="${c}"/>` +
      `<rect x="34" y="28" width="6" height="32" fill="${c}"/>` +
      `<polyline points="14,42 24,34 34,26 50,16" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>` +
      `<polygon points="50,16 44,18 48,22" fill="${c}"/>`,
  },
  {
    file: 'b2b-saas.svg',
    label: 'B2B SAAS',
    color: GOLD,
    icon: (c) =>
      // Stack / katmanlı cloud (SaaS layers)
      `<rect x="14" y="22" width="40" height="8" fill="none" stroke="${c}" stroke-width="2.5"/>` +
      `<rect x="14" y="34" width="40" height="8" fill="none" stroke="${c}" stroke-width="2.5"/>` +
      `<rect x="14" y="46" width="40" height="8" fill="${c}"/>`,
  },
  {
    file: 'retail-chain.svg',
    label: 'RETAIL CHAIN',
    color: NAVY,
    icon: (c) =>
      // Alışveriş arabası kontürü
      `<path d="M12 24 L18 24 L24 50 L52 50 L56 30 L22 30" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="28" cy="58" r="3" fill="${c}"/>` +
      `<circle cx="48" cy="58" r="3" fill="${c}"/>`,
  },
];

function badgeSvg({ label, color, icon }) {
  // viewBox 200×80; icon ~64px solda, metin sağda
  const iconBlock = icon(color);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" role="img" aria-label="${label}"><g>${iconBlock}</g><text x="74" y="48" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" letter-spacing="3" fill="${color}">${label}</text></svg>`;
}

mkdirSync(OUT, { recursive: true });

const results = [];
for (const b of BADGES) {
  const svg = badgeSvg(b);
  const path = resolve(OUT, b.file);
  writeFileSync(path, svg, 'utf8');
  const size = statSync(path).size;
  results.push({ file: b.file, bytes: size, ok: size <= 1536 });
}

const total = readdirSync(OUT).filter((f) => f.endsWith('.svg')).length;
console.log(`[clients] wrote ${results.length} SVGs to public/clients (dir total: ${total})`);
for (const r of results) {
  const flag = r.ok ? 'OK' : 'OVER';
  console.log(`  ${flag.padEnd(4)} ${r.file.padEnd(28)} ${r.bytes}B`);
}

const overLimit = results.filter((r) => !r.ok);
if (overLimit.length) {
  console.error(`[clients] ${overLimit.length} file(s) > 1.5KB`);
  process.exit(1);
}
console.log('[clients] all files <= 1.5KB OK');
