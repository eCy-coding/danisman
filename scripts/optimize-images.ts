/**
 * P55.D1 — Image optimization pipeline (AVIF + WebP).
 *
 * Walk `public/` for *.jpg / *.jpeg / *.png, generate AVIF + WebP variants
 * next to the original (preserves JPEG fallback for legacy browsers).
 * Skips variants newer than source.
 *
 * Run: `npm run images:optimize`
 * Pre-req: `sharp` (already in dependencies).
 *
 * Output rules:
 *   foo.jpg → foo.webp + foo.avif (same directory)
 *
 * NOT in scope:
 *   - SVG (vector; already optimized via svgo)
 *   - GIF (rare; keep as-is)
 *   - Resizing / responsive variants (handled in ResponsiveImage at request time)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOTS = [path.join(process.cwd(), 'public'), path.join(process.cwd(), 'src', 'assets')];
const EXTS = new Set(['.jpg', '.jpeg', '.png']);

interface FoundImage {
  abs: string;
  rel: string;
  stat: { mtimeMs: number };
}

async function walk(dir: string): Promise<FoundImage[]> {
  const out: FoundImage[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(abs)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!EXTS.has(path.extname(entry.name).toLowerCase())) continue;
    const stat = await fs.stat(abs);
    out.push({ abs, rel: path.relative(process.cwd(), abs), stat });
  }
  return out;
}

async function isFresher(srcMtime: number, variantPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(variantPath);
    return stat.mtimeMs >= srcMtime;
  } catch {
    return false;
  }
}

async function optimizeOne(img: FoundImage): Promise<{ webp: boolean; avif: boolean }> {
  const base = img.abs.replace(/\.(jpe?g|png)$/i, '');
  const webpPath = `${base}.webp`;
  const avifPath = `${base}.avif`;

  let didWebp = false;
  let didAvif = false;

  const srcMtime = img.stat.mtimeMs;

  if (!(await isFresher(srcMtime, webpPath))) {
    await sharp(img.abs).webp({ quality: 82, effort: 4 }).toFile(webpPath);
    didWebp = true;
  }
  if (!(await isFresher(srcMtime, avifPath))) {
    await sharp(img.abs).avif({ quality: 60, effort: 5 }).toFile(avifPath);
    didAvif = true;
  }
  return { webp: didWebp, avif: didAvif };
}

async function main(): Promise<void> {
  const all: FoundImage[] = [];
  for (const root of ROOTS) {
    all.push(...(await walk(root)));
  }
  if (all.length === 0) {
    console.log('[optimize-images] no source images found under', ROOTS);
    return;
  }
  let totalWebp = 0;
  let totalAvif = 0;
  for (const img of all) {
    try {
      const r = await optimizeOne(img);
      if (r.webp) totalWebp++;
      if (r.avif) totalAvif++;
      const tags = [r.webp && 'webp', r.avif && 'avif'].filter(Boolean).join('+') || 'skip';
      console.log(`[optimize-images] ${tags.padEnd(10)} ${img.rel}`);
    } catch (err) {
      console.error(`[optimize-images] FAIL ${img.rel}`, (err as Error).message);
    }
  }
  console.log(
    `[optimize-images] done — ${totalWebp} webp + ${totalAvif} avif generated (of ${all.length} sources).`,
  );
}

main().catch((err) => {
  console.error('[optimize-images] fatal', err);
  process.exit(1);
});
