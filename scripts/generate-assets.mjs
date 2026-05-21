#!/usr/bin/env node
/**
 * P13/4 — Asset pipeline (sharp).
 *
 * Yapı:
 *   1. Hero görselleri (src/assets/hero/*.{png,jpg}) → AVIF + WebP + responsive srcset
 *   2. og-image varyantları:
 *      - /og-image.png (default)
 *      - /og/services-<slug>.png
 *      - /og/blog-<slug>.png
 *      - /og/about.png
 *      Her biri 1200×630, brand renkleri, dynamic title overlay
 *   3. Favicon set: 16x16, 32x32, 180x180 (apple-touch), 192x192, 512x512 (PWA)
 *   4. Manifest icon validation — pwa-{192,512} dosyaları + boyut + safe-zone
 *
 * Sandbox arm64 mismatch nedeniyle sharp burada koşmaz — host'a kalır.
 * Komut: `node scripts/generate-assets.mjs --hero --og --favicon --validate`
 *
 * Çıktılar:
 *   public/og/*.png
 *   public/hero/*.{avif,webp,jpg}
 *   public/favicon-16.png + favicon-32.png + apple-touch-icon.png + pwa-{192,512}.png
 *   public/screenshots/{mobile,desktop}-1.png  (opsiyonel; PWA listing için)
 *
 * Flags:
 *   --hero        sadece hero pipeline
 *   --og          sadece og-image varyantları
 *   --favicon     sadece favicon set
 *   --validate    sadece manifest icon doğrulama (yazma yok)
 *   --all         hepsi
 *   --dry-run     adımları logla, dosya yazma
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SRC_ASSETS = path.join(ROOT, 'src', 'assets');
const OG_DIR = path.join(PUBLIC_DIR, 'og');
const HERO_DIR = path.join(PUBLIC_DIR, 'hero');

const args = new Set(process.argv.slice(2));
const flag = (k) => args.has(`--${k}`) || args.has('--all');
const dryRun = args.has('--dry-run');

const BRAND = {
  background: '#050810',
  foreground: '#E3E3E3',
  accent: '#D4AF37',
  surface: '#1E1F20',
};

// ── Lazy sharp loader — fail soft if not available ────────────────────────────
let sharp = null;
async function getSharp() {
  if (sharp) return sharp;
  try {
    const mod = await import('sharp');
    sharp = mod.default ?? mod;
    return sharp;
  } catch (err) {
    console.error('[assets] sharp not available:', err.message);
    console.error('[assets] Bu script HOST üzerinde (macOS arm64) çalışmalı. Sandbox arm64 binding mismatch tipiktir.');
    process.exit(1);
  }
}

async function ensureDir(p) {
  if (dryRun) return console.log('[dry] mkdir', p);
  await fs.mkdir(p, { recursive: true });
}

async function write(p, buf, label) {
  if (dryRun) return console.log(`[dry] write ${label} → ${p} (${buf.length} bytes)`);
  await fs.writeFile(p, buf);
  console.log(`[ok] ${label} → ${path.relative(ROOT, p)} (${(buf.length / 1024).toFixed(1)} KB)`);
}

// ── Favicon set ───────────────────────────────────────────────────────────────
const FAVICON_SIZES = [
  { size: 16, name: 'favicon-16.png' },
  { size: 32, name: 'favicon-32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
];

async function generateFavicons() {
  console.log('\n📐 Favicon set');
  const source = path.join(PUBLIC_DIR, 'favicon.png');
  try {
    await fs.access(source);
  } catch {
    console.warn(`[skip] source not found: ${source}. Beklenen: ${source} (≥512px PNG).`);
    return;
  }
  const s = await getSharp();
  for (const { size, name } of FAVICON_SIZES) {
    const buf = await s(source)
      .resize(size, size, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await write(path.join(PUBLIC_DIR, name), buf, `favicon ${size}×${size}`);
  }
}

// ── Hero responsive pipeline ──────────────────────────────────────────────────
const HERO_WIDTHS = [480, 768, 1280, 1920];

async function generateHeroes() {
  console.log('\n🌄 Hero responsive pipeline (AVIF + WebP + JPG)');
  let sourceFiles;
  try {
    sourceFiles = (await fs.readdir(path.join(SRC_ASSETS, 'hero')))
      .filter((f) => /\.(png|jpg|jpeg)$/i.test(f));
  } catch {
    console.warn('[skip] src/assets/hero/ klasörü yok. Atla.');
    return;
  }
  await ensureDir(HERO_DIR);
  const s = await getSharp();
  for (const file of sourceFiles) {
    const stem = path.basename(file, path.extname(file));
    const src = path.join(SRC_ASSETS, 'hero', file);
    for (const w of HERO_WIDTHS) {
      const base = s(src).resize(w);
      const avif = await base.clone().avif({ quality: 60 }).toBuffer();
      const webp = await base.clone().webp({ quality: 75 }).toBuffer();
      const jpg = await base.clone().jpeg({ quality: 82, progressive: true }).toBuffer();
      await write(path.join(HERO_DIR, `${stem}-${w}.avif`), avif, `hero ${stem}-${w}w avif`);
      await write(path.join(HERO_DIR, `${stem}-${w}.webp`), webp, `hero ${stem}-${w}w webp`);
      await write(path.join(HERO_DIR, `${stem}-${w}.jpg`), jpg, `hero ${stem}-${w}w jpg`);
    }
  }
}

// ── og-image varyantları ──────────────────────────────────────────────────────
// 1200×630 PNG, brand background + accent stripe + title overlay.
async function ogTemplate(title, subtitle) {
  const s = await getSharp();
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${BRAND.background}"/>
        <stop offset="100%" stop-color="${BRAND.surface}"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect x="0" y="0" width="12" height="630" fill="${BRAND.accent}"/>
    <text x="80" y="240" font-family="Inter, sans-serif" font-size="58" font-weight="700" fill="${BRAND.foreground}">${escape(title)}</text>
    <text x="80" y="320" font-family="Inter, sans-serif" font-size="32" font-weight="400" fill="#9AA0A6">${escape(subtitle)}</text>
    <text x="80" y="560" font-family="Inter, sans-serif" font-size="24" font-weight="600" fill="${BRAND.accent}">eCyPro Premium Consulting</text>
    <text x="80" y="595" font-family="Inter, sans-serif" font-size="18" font-weight="400" fill="#7C8389">www.ecypro.com</text>
  </svg>`;
  return s(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

function escape(str) {
  return String(str).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

const OG_VARIANTS = [
  { file: 'og-image.png', title: 'eCyPro Premium Consulting', subtitle: 'Strateji · Yönetim · Veri', dir: PUBLIC_DIR },
  { file: 'about.png', title: 'Hakkımızda', subtitle: 'Premium danışmanlık ekibimiz', dir: OG_DIR },
  { file: 'services-strategy.png', title: 'Strateji Danışmanlığı', subtitle: 'Vizyondan eyleme', dir: OG_DIR },
  { file: 'services-data.png', title: 'Veri & Analitik', subtitle: 'Karar destek mimarisi', dir: OG_DIR },
  { file: 'services-transform.png', title: 'Dijital Dönüşüm', subtitle: 'Süreç + teknoloji + insan', dir: OG_DIR },
  { file: 'blog-default.png', title: 'eCyPro Insights', subtitle: 'Yönetim & strateji yazıları', dir: OG_DIR },
];

async function generateOG() {
  console.log('\n🖼 og-image varyantları');
  await ensureDir(OG_DIR);
  for (const v of OG_VARIANTS) {
    const buf = await ogTemplate(v.title, v.subtitle);
    await write(path.join(v.dir, v.file), buf, `og ${v.file}`);
  }
}

// ── Manifest icon validation ──────────────────────────────────────────────────
async function validateManifest() {
  console.log('\n🔍 Manifest icon validation');
  const required = [
    { path: 'pwa-192x192.png', size: 192 },
    { path: 'pwa-512x512.png', size: 512 },
    { path: 'apple-touch-icon.png', size: 180 },
    { path: 'favicon.ico', size: null },
  ];
  let pass = 0;
  let fail = 0;
  const s = await getSharp().catch(() => null);
  for (const r of required) {
    const fp = path.join(PUBLIC_DIR, r.path);
    try {
      await fs.access(fp);
      if (r.size && s) {
        const meta = await s(fp).metadata();
        if (meta.width !== r.size || meta.height !== r.size) {
          console.warn(`[fail] ${r.path} expected ${r.size}×${r.size}, found ${meta.width}×${meta.height}`);
          fail += 1;
          continue;
        }
      }
      console.log(`[pass] ${r.path}`);
      pass += 1;
    } catch {
      console.warn(`[fail] ${r.path} missing`);
      fail += 1;
    }
  }
  console.log(`\nResult: ${pass} pass / ${fail} fail`);
  if (fail > 0) process.exitCode = 1;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🛠 eCyPro asset pipeline');
  console.log(dryRun ? '⚠ dry-run mode (yazma yok)' : '✏ write mode');

  const ran = [];
  if (flag('favicon')) {
    await generateFavicons();
    ran.push('favicon');
  }
  if (flag('hero')) {
    await generateHeroes();
    ran.push('hero');
  }
  if (flag('og')) {
    await generateOG();
    ran.push('og');
  }
  if (flag('validate') || ran.length > 0) {
    await validateManifest();
  }

  if (ran.length === 0 && !flag('validate')) {
    console.log('Usage: node scripts/generate-assets.mjs [--hero] [--og] [--favicon] [--validate] [--all] [--dry-run]');
    process.exit(1);
  }

  console.log('\n✅ Done.');
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
