#!/usr/bin/env node
/**
 * scripts/convert-images.mjs (S13-R8-B image pipeline)
 *
 * Generates AVIF + WebP derivatives (1x + @2x retina) for above-fold
 * images that are referenced by <picture> chains in the React tree.
 *
 * Output paths are SOURCE-OF-TRUTH for src/components/sections/Hero.tsx
 * (founder avatar) and index.html (`<link rel="preload" type="image/avif">`).
 * If a derivative is missing, the <picture> chain falls back to the JPG
 * source — visual diff is zero, only the perf win is forfeited.
 *
 * Run: `npm run convert:images`
 *
 * Exit code: 0 on success, 1 on any error.
 */
import sharp from 'sharp';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname, basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

/** Above-fold images to process. R8 scope: founder avatar only. */
const SOURCES = [
  {
    src: 'public/founder.jpg',
    // CSS rendered size: 40×40 (w-10 h-10). Retina @2x → 80×80 max,
    // capped at the source's native dimensions if it's smaller.
    cssWidth: 40,
    cssHeight: 40,
  },
];

const AVIF_QUALITY = 50;
const WEBP_QUALITY = 80;

function pctSaved(before, after) {
  if (before <= 0) return '0.0';
  return (((before - after) / before) * 100).toFixed(1);
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function fileSizeOrZero(absPath) {
  try {
    const s = await stat(absPath);
    return s.size;
  } catch {
    return 0;
  }
}

async function processOne({ src, cssWidth, cssHeight }) {
  const absSrc = resolve(ROOT, src);
  const ext = extname(src);
  const base = basename(src, ext);
  const dir = dirname(absSrc);

  const srcBuffer = await readFile(absSrc);
  const srcSize = srcBuffer.length;
  const meta = await sharp(srcBuffer).metadata();
  const srcW = meta.width ?? cssWidth;
  const srcH = meta.height ?? cssHeight;

  // Retina target: 2× CSS size, but never up-scale beyond source dims.
  const retinaW = Math.min(cssWidth * 2, srcW);
  const retinaH = Math.min(cssHeight * 2, srcH);
  // 1× target: native CSS size, but again never up-scale beyond source.
  const oneXW = Math.min(cssWidth, srcW);
  const oneXH = Math.min(cssHeight, srcH);

  const targets = [
    {
      label: `${base}.avif`,
      out: join(dir, `${base}.avif`),
      width: oneXW,
      height: oneXH,
      encode: (img) => img.avif({ quality: AVIF_QUALITY }),
    },
    {
      label: `${base}.webp`,
      out: join(dir, `${base}.webp`),
      width: oneXW,
      height: oneXH,
      encode: (img) => img.webp({ quality: WEBP_QUALITY }),
    },
    {
      label: `${base}@2x.avif`,
      out: join(dir, `${base}@2x.avif`),
      width: retinaW,
      height: retinaH,
      encode: (img) => img.avif({ quality: AVIF_QUALITY }),
    },
    {
      label: `${base}@2x.webp`,
      out: join(dir, `${base}@2x.webp`),
      width: retinaW,
      height: retinaH,
      encode: (img) => img.webp({ quality: WEBP_QUALITY }),
    },
  ];

  console.log(
    `\n${src} (${srcW}×${srcH}, source ${fmtKB(srcSize)})`,
  );

  for (const t of targets) {
    const pipeline = sharp(srcBuffer).resize(t.width, t.height, {
      fit: 'cover',
      withoutEnlargement: true,
    });
    const buffer = await t.encode(pipeline).toBuffer();
    await writeFile(t.out, buffer);
    const before = (await fileSizeOrZero(t.out)) || buffer.length;
    // 'before' here equals output bytes (we just wrote them); the
    // meaningful comparison is against the source size.
    console.log(
      `  → ${t.label.padEnd(28)} ${`${t.width}×${t.height}`.padEnd(12)} ${fmtKB(buffer.length).padStart(10)}  saved ${pctSaved(srcSize, buffer.length)}% vs source`,
    );
    void before;
  }
}

async function main() {
  console.log('[convert-images] R8 above-fold image pipeline');
  let failed = 0;
  for (const src of SOURCES) {
    try {
      await processOne(src);
    } catch (err) {
      failed += 1;
      console.error(`[convert-images] FAIL ${src.src}:`, err instanceof Error ? err.message : err);
    }
  }
  if (failed > 0) {
    console.error(`\n[convert-images] ${failed} source(s) failed.`);
    process.exit(1);
  }
  console.log('\n[convert-images] done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[convert-images] unexpected error:', err);
  process.exit(1);
});
