#!/usr/bin/env node
/**
 * P42: Brand placeholder SVG üretici.
 *
 * Yerel asset'ler üretir:
 *   public/founder.svg          — founder portrait placeholder (initials "ECY")
 *   public/case-studies/*.svg   — 6 case study cover (abstract geometric)
 *
 * Tasarım: eCyPro "AI Studio Tech" doktrini — solid surfaces, navy/gold,
 * glassmorphism YOK. Tipografi: Inter / system sans.
 *
 * Çalıştırma:
 *   node scripts/generate-brand-placeholders.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUB = resolve(ROOT, 'public');

const NAVY = '#0B1220';
const NAVY_2 = '#1A2238';
const GOLD = '#D4AF37';
const GOLD_2 = '#B8941F';
const INK = '#0E1626';

function svgWrap({ width, height, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">${body}</svg>`;
}

// ── Founder portrait (square) ─────────────────────────────────────
function founderSvg() {
  const w = 800;
  const h = 800;
  const body = `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${NAVY}"/>
        <stop offset="100%" stop-color="${NAVY_2}"/>
      </linearGradient>
      <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${GOLD}"/>
        <stop offset="100%" stop-color="${GOLD_2}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="280" fill="none" stroke="url(#ring)" stroke-width="6" opacity="0.85"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="220" fill="${INK}"/>
    <text x="${w / 2}" y="${h / 2 + 30}" text-anchor="middle"
          font-family="Inter, system-ui, sans-serif" font-size="120" font-weight="600"
          fill="${GOLD}" letter-spacing="6">ECY</text>
    <text x="${w / 2}" y="${h / 2 + 110}" text-anchor="middle"
          font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="400"
          fill="#9CA3AF" letter-spacing="4">EMRE CAN YALÇIN</text>
    <text x="${w / 2}" y="${h / 2 + 140}" text-anchor="middle"
          font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="400"
          fill="#6B7280" letter-spacing="2">eCyverse · Premium Consulting</text>
  `;
  return svgWrap({ width: w, height: h, body });
}

// ── Case study cover (16:9) ───────────────────────────────────────
function caseStudySvg({ title, accent }) {
  const w = 1200;
  const h = 675;
  const body = `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${NAVY}"/>
        <stop offset="100%" stop-color="${NAVY_2}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <g opacity="0.5">
      <circle cx="200" cy="540" r="320" fill="${accent}" opacity="0.18"/>
      <circle cx="1000" cy="180" r="240" fill="${GOLD}" opacity="0.12"/>
    </g>
    <g stroke="${accent}" stroke-width="2" opacity="0.55" fill="none">
      <path d="M 60 580 L 360 480 L 660 520 L 980 360 L 1140 420"/>
    </g>
    <g stroke="#1F2A44" stroke-width="1" opacity="0.6" fill="none">
      <line x1="60"  y1="610" x2="1140" y2="610"/>
      <line x1="60"  y1="550" x2="1140" y2="550"/>
      <line x1="60"  y1="490" x2="1140" y2="490"/>
    </g>
    <text x="60" y="110" font-family="Inter, system-ui, sans-serif"
          font-size="20" font-weight="500" fill="${GOLD}" letter-spacing="6">ECYPRO · CASE STUDY</text>
    <text x="60" y="200" font-family="Inter, system-ui, sans-serif"
          font-size="56" font-weight="600" fill="#F8FAFC">${escapeXml(title)}</text>
    <text x="60" y="240" font-family="Inter, system-ui, sans-serif"
          font-size="16" font-weight="400" fill="#9CA3AF" letter-spacing="2">ANONYMIZED CLIENT · NDA</text>
  `;
  return svgWrap({ width: w, height: h, body });
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c],
  );
}

// ── Run ───────────────────────────────────────────────────────────
const CASES = [
  ['tech-scaleup',        'Tech Scale-up · Operasyonel Mükemmellik', '#38BDF8'],
  ['family-business',     'Aile Şirketi · Kuşak Geçişi',            '#A78BFA'],
  ['manufacturing',       'Üretim · Lean & Six Sigma',              '#34D399'],
  ['ma-advisory',         'M&A Advisory · DD + PMI',                '#F472B6'],
  ['org-transformation',  'Organizasyonel Dönüşüm',                 '#FBBF24'],
  ['culture-engineering', 'Kültür Mühendisliği',                    '#60A5FA'],
];

function main() {
  mkdirSync(resolve(PUB, 'case-studies'), { recursive: true });
  writeFileSync(resolve(PUB, 'founder.svg'), founderSvg());
  console.log('  ✓ public/founder.svg');
  for (const [slug, title, accent] of CASES) {
    const out = resolve(PUB, 'case-studies', `${slug}.svg`);
    writeFileSync(out, caseStudySvg({ title, accent }));
    console.log(`  ✓ public/case-studies/${slug}.svg`);
  }
  console.log(`\nDone — ${CASES.length + 1} placeholders generated.`);
}

main();
