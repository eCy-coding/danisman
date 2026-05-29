#!/usr/bin/env node
/**
 * generate-og-images.mjs — Per-page 1200×630 OG images for social previews.
 *
 * Outputs to public/og/{slug}.png. Idempotent; re-runs produce same bytes.
 * Run: node scripts/generate-og-images.mjs
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'og');

// Brand tokens
const BG = '#0d0d0f';
const GOLD = '#C9A961';
const WHITE = '#F8F5F0';
const SLATE = '#8B92A5';
const WIDTH = 1200;
const HEIGHT = 630;

const PAGES = [
  {
    slug: 'home',
    title: 'eCyPro',
    subtitle: 'Premium Management Consulting',
    tagline: 'KVKK · EU Regulatory · Strategic Advisory',
  },
  {
    slug: 'founder',
    title: 'Emre Can Yalçın',
    subtitle: 'Founder & Chief Strategist',
    tagline: 'Big4 Depth · Boutique Speed · Istanbul–London',
  },
  {
    slug: 'pricing',
    title: 'Şeffaf Fiyatlandırma',
    subtitle: 'Starter · Growth · Enterprise',
    tagline: 'Sonuç bazlı retainer — saat değil, milestone',
  },
  {
    slug: 'discovery',
    title: 'Tanışma Toplantısı',
    subtitle: 'Ücretsiz 30 dk Keşif Görüşmesi',
    tagline: 'Taahhütsüz stratejik değerlendirme',
  },
  {
    slug: 'services',
    title: 'Danışmanlık Hizmetleri',
    subtitle: 'M&A · ESG · Fintech · Aile Şirketi',
    tagline: '21 uzmanlık alanı, 4 stratejik küme',
  },
  {
    slug: 'perspektifler',
    title: 'Perspektif',
    subtitle: "Türkiye'nin Analiz Platformu",
    tagline: 'M&A · ESG · Fintech · Aile Şirketi',
  },
];

function buildSvg(page) {
  const { title, subtitle, tagline } = page;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#13141a"/>
    </linearGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="${GOLD}" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>

  <!-- Gold left bar (Fibonacci: 21px) -->
  <rect x="0" y="0" width="21" height="${HEIGHT}" fill="${GOLD}"/>

  <!-- Gold accent bottom bar -->
  <rect x="21" y="${HEIGHT - 8}" width="${WIDTH - 21}" height="8" fill="${GOLD}" opacity="0.4"/>

  <!-- eCyPro wordmark top-right -->
  <text x="${WIDTH - 60}" y="60" text-anchor="end"
    font-family="Georgia, serif" font-size="28" font-weight="700"
    fill="${GOLD}" letter-spacing="1">eCyPro</text>

  <!-- Main title -->
  <text x="89" y="260"
    font-family="Georgia, 'Times New Roman', serif" font-size="80" font-weight="700"
    fill="${WHITE}" letter-spacing="-1">${escapeXml(title)}</text>

  <!-- Subtitle -->
  <text x="89" y="340"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="36" font-weight="400"
    fill="${GOLD}" letter-spacing="0.5">${escapeXml(subtitle)}</text>

  <!-- Tagline -->
  <text x="89" y="410"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="24" font-weight="300"
    fill="${SLATE}">${escapeXml(tagline)}</text>

  <!-- Divider line -->
  <line x1="89" y1="460" x2="400" y2="460" stroke="${GOLD}" stroke-width="2" opacity="0.4"/>

  <!-- Domain -->
  <text x="89" y="500"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="20" font-weight="400"
    fill="${SLATE}" letter-spacing="2">www.ecypro.com</text>
</svg>`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generate(page) {
  const svg = buildSvg(page);
  const buf = await sharp(Buffer.from(svg), { density: 96 })
    .resize(WIDTH, HEIGHT)
    .png({ quality: 90, compressionLevel: 8 })
    .toBuffer();

  const outPath = path.join(OUT_DIR, `${page.slug}.png`);
  await writeFile(outPath, buf);
  const kb = Math.round(buf.length / 1024);
  console.log(`  ✓ ${page.slug}.png  (${kb} KB)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log('Generating per-page OG images → public/og/');
  for (const page of PAGES) {
    await generate(page);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
