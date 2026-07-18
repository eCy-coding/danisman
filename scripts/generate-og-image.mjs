#!/usr/bin/env node
/**
 * generate-og-image.mjs — Produce a 1200x630 og-image for social previews.
 *
 * Why this exists:
 *   index.html references /og-image.jpg in og:image and twitter:image meta tags.
 *   Without the file, Twitter/LinkedIn/Slack/WhatsApp render broken previews.
 *
 * Usage:
 *   npm run gen:og-image
 *
 * Output:
 *   public/og-image.jpg  (1200x630, JPG quality 85, ~80-150 KB typical)
 *   dist/og-image.jpg    (copied only if dist/ already exists)
 *
 * Idempotent. Re-runs produce the same bytes (modulo libjpeg version).
 */

import sharp from 'sharp';
import { writeFile, copyFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Brand tokens (from src/styles / index.css)
const BG       = '#000000';
const PRIMARY  = '#ffffff';
const SECONDARY = '#facc15';

const WIDTH = 1200;
const HEIGHT = 630;

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <!-- Solid background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>

  <!-- Subtle grid pattern (low opacity gold) -->
  <defs>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="${SECONDARY}" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>
    <linearGradient id="goldFade" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${SECONDARY}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${SECONDARY}" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>

  <!-- Gold accent bar (left edge, Fibonacci width = 21px) -->
  <rect x="0" y="0" width="21" height="${HEIGHT}" fill="${SECONDARY}"/>

  <!-- Top-left wordmark -->
  <g transform="translate(89, 144)">
    <text
      x="0" y="0"
      font-family="'Playfair Display', 'Georgia', serif"
      font-size="120"
      font-weight="700"
      fill="${PRIMARY}"
      letter-spacing="-2"
    >eCyPro</text>
    <text
      x="0" y="62"
      font-family="'Inter', 'Helvetica Neue', sans-serif"
      font-size="32"
      font-weight="500"
      fill="${PRIMARY}"
      opacity="0.7"
      letter-spacing="6"
    >PREMIUM CONSULTING</text>
  </g>

  <!-- Right-side gold "eC" monogram (large, behind tagline) -->
  <g transform="translate(720, 200)" opacity="0.92">
    <text
      x="0" y="0"
      font-family="'Playfair Display', 'Georgia', serif"
      font-size="360"
      font-weight="700"
      fill="url(#goldFade)"
      letter-spacing="-16"
    >eC</text>
  </g>

  <!-- Bottom tagline -->
  <g transform="translate(89, 520)">
    <text
      x="0" y="0"
      font-family="'Inter', 'Helvetica Neue', sans-serif"
      font-size="40"
      font-weight="600"
      fill="${PRIMARY}"
    >Stratejik Yönetim Danışmanlığı</text>
    <text
      x="0" y="58"
      font-family="'Inter', 'Helvetica Neue', sans-serif"
      font-size="26"
      font-weight="400"
      fill="${PRIMARY}"
      opacity="0.65"
    >Global standartlarda kurumsal danışmanlık · ecypro.com</text>
  </g>

  <!-- Top-right tag -->
  <g transform="translate(${WIDTH - 89}, 89)" text-anchor="end">
    <rect x="-180" y="-30" width="180" height="42" rx="21" ry="21"
          fill="none" stroke="${SECONDARY}" stroke-width="1.5" stroke-opacity="0.6"/>
    <text
      x="-90" y="0" text-anchor="middle"
      font-family="'Inter', 'Helvetica Neue', sans-serif"
      font-size="18"
      font-weight="600"
      fill="${SECONDARY}"
      letter-spacing="3"
    >EST. 2025</text>
  </g>
</svg>`;

async function fileExists(p) {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const publicOut = path.join(ROOT, 'public', 'og-image.jpg');
  const distOut = path.join(ROOT, 'dist', 'og-image.jpg');

  console.log(`[og-image] generating ${WIDTH}x${HEIGHT} JPG…`);

  const buf = await sharp(Buffer.from(SVG), { density: 96 })
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer();

  await writeFile(publicOut, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`[og-image] ✓ ${publicOut} (${kb} KB)`);

  if (await fileExists(path.join(ROOT, 'dist'))) {
    await copyFile(publicOut, distOut);
    console.log(`[og-image] ✓ ${distOut} (copied)`);
  } else {
    console.log('[og-image] (dist/ missing — skipping dist copy; run after npm run build)');
  }

  // S13-R13 P0-1 — Was process.exit(2) on size overshoot; that hard-failed
  // every Vercel deploy because Vercel's libvips renders heavier than the
  // local dev image. Soft-warn now: the OG asset is still copied, deploys
  // keep moving, and the warning surfaces in build logs for human review.
  if (buf.length > 300 * 1024) {
    console.warn(
      `[og-image] ⚠ size ${kb} KB > 300 KB target — consider lower quality (warning only, not fatal)`
    );
  }
}

main().catch((err) => {
  console.error('[og-image] failed:', err);
  process.exit(1);
});
