#!/usr/bin/env node
/**
 * Insight cover library generator — 4 domains × 2 variants, 1200×630 webp.
 *
 * Programmatic SVG → sharp → webp. Deterministic (seeded PRNG), brand-exact
 * (AI Studio Tech palette), text-free, <150KB each. Re-run any time:
 *   node scripts/generate-insight-covers.mjs
 *
 * The NotebookLM bridge picks /insights-covers/{domain}-{1|2}.webp per post
 * (slug-hash variant rotation) — see scripts/nlm-bridge/bridge.mjs.
 */
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'insights-covers');

const PALETTE = {
  bg: '#050810',
  surface: '#1E1F20',
  amber: '#fbbf24',
  blue: '#60a5fa',
  emerald: '#34d399',
  slate: '#334155',
};

/** mulberry32 — tiny deterministic PRNG so covers are reproducible. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const grid = () => {
  const lines = [];
  for (let x = 0; x <= W; x += 60) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#94a3b8" stroke-opacity="0.05" stroke-width="1"/>`);
  }
  for (let y = 0; y <= H; y += 60) {
    lines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#94a3b8" stroke-opacity="0.05" stroke-width="1"/>`);
  }
  return lines.join('');
};

const frame = (inner, glowColor, glowX, glowY) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="${glowX}" cy="${glowY}" r="0.75">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${PALETTE.bg}"/>
  ${grid()}
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${inner}
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;

const node = (x, y, r, color, opacity = 1) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" fill-opacity="${opacity}"/>` +
  `<circle cx="${x}" cy="${y}" r="${r + 6}" fill="none" stroke="${color}" stroke-opacity="${0.35 * opacity}" stroke-width="1.5"/>`;

const link = (x1, y1, x2, y2, color, width = 1.5, opacity = 0.6) => {
  const mx = (x1 + x2) / 2;
  return `<path d="M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${width}"/>`;
};

/** M&A — two clusters (blue / amber) merging through bridge links. */
function maMotif(rand) {
  const parts = [];
  const left = Array.from({ length: 5 }, () => [120 + rand() * 260, 120 + rand() * 390]);
  const right = Array.from({ length: 5 }, () => [820 + rand() * 260, 120 + rand() * 390]);
  for (const [x, y] of left) parts.push(node(x, y, 7 + rand() * 6, PALETTE.blue));
  for (const [x, y] of right) parts.push(node(x, y, 7 + rand() * 6, PALETTE.amber));
  for (let i = 0; i < 4; i += 1) {
    const [x1, y1] = left[Math.floor(rand() * left.length)];
    const [x2, y2] = right[Math.floor(rand() * right.length)];
    parts.push(link(x1, y1, x2, y2, i % 2 ? PALETTE.amber : PALETTE.blue, 2, 0.5));
  }
  parts.push(node(W / 2, H / 2, 16, PALETTE.amber));
  parts.push(`<circle cx="${W / 2}" cy="${H / 2}" r="34" fill="none" stroke="${PALETTE.blue}" stroke-opacity="0.5" stroke-width="2"/>`);
  return parts.join('');
}

/** ESG — circuit sprouts rising into leaf ellipses, emerald accent. */
function esgMotif(rand) {
  const parts = [];
  for (let i = 0; i < 6; i += 1) {
    const x = 140 + i * 180 + rand() * 60;
    const top = 150 + rand() * 160;
    parts.push(`<path d="M ${x} ${H - 60} C ${x - 40} ${H - 200}, ${x + 40} ${top + 120}, ${x} ${top}" fill="none" stroke="${i % 3 === 0 ? PALETTE.emerald : PALETTE.blue}" stroke-opacity="0.55" stroke-width="2"/>`);
    parts.push(`<ellipse cx="${x}" cy="${top - 14}" rx="12" ry="22" fill="${PALETTE.emerald}" fill-opacity="${0.75 - i * 0.06}" transform="rotate(${(rand() - 0.5) * 40} ${x} ${top - 14})"/>`);
    parts.push(node(x, H - 60, 5, PALETTE.slate, 0.9));
  }
  parts.push(node(W - 200, 150, 14, PALETTE.emerald));
  return parts.join('');
}

/** Fintech — rising rounded bars with an amber node trendline. */
function fintechMotif(rand) {
  const parts = [];
  const baseY = H - 90;
  const points = [];
  for (let i = 0; i < 8; i += 1) {
    const x = 130 + i * 130;
    const h = 60 + i * 38 + rand() * 60;
    parts.push(`<rect x="${x - 26}" y="${baseY - h}" width="52" height="${h}" rx="8" fill="${PALETTE.surface}" stroke="${PALETTE.blue}" stroke-opacity="0.45" stroke-width="1.5"/>`);
    points.push([x, baseY - h - 26]);
  }
  for (let i = 0; i < points.length - 1; i += 1) {
    parts.push(link(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], PALETTE.amber, 2.5, 0.8));
  }
  for (const [x, y] of points) parts.push(node(x, y, 6, PALETTE.amber));
  return parts.join('');
}

/** Aile Şirketi — generation tree: root node branching across decades. */
function aileMotif(rand) {
  const parts = [];
  const rootX = 170;
  const rootY = H / 2;
  parts.push(node(rootX, rootY, 20, PALETTE.amber));
  const gen2 = [
    [480, rootY - 130 - rand() * 40],
    [480, rootY + 130 + rand() * 40],
  ];
  for (const [x, y] of gen2) {
    parts.push(link(rootX, rootY, x, y, PALETTE.amber, 2.5, 0.7));
    parts.push(node(x, y, 13, PALETTE.amber, 0.9));
    for (let i = 0; i < 2; i += 1) {
      const x3 = 820 + rand() * 120;
      const y3 = y - 90 + i * 180 + (rand() - 0.5) * 50;
      parts.push(link(x, y, x3, y3, PALETTE.blue, 2, 0.6));
      parts.push(node(x3, y3, 9, PALETTE.blue, 0.95));
      const x4 = 1080 + rand() * 40;
      const y4 = y3 + (rand() - 0.5) * 110;
      parts.push(link(x3, y3, x4, y4, PALETTE.blue, 1.5, 0.45));
      parts.push(node(x4, y4, 5, PALETTE.blue, 0.8));
    }
  }
  return parts.join('');
}

const DOMAINS = [
  { slug: 'm-a', motif: maMotif, glow: PALETTE.blue, glowX: 0.5, glowY: 0.5 },
  { slug: 'esg', motif: esgMotif, glow: PALETTE.emerald, glowX: 0.5, glowY: 0.85 },
  { slug: 'fintech', motif: fintechMotif, glow: PALETTE.amber, glowX: 0.7, glowY: 0.8 },
  { slug: 'aile-sirketi', motif: aileMotif, glow: PALETTE.amber, glowX: 0.2, glowY: 0.5 },
];

await mkdir(OUT, { recursive: true });
for (const { slug, motif, glow, glowX, glowY } of DOMAINS) {
  for (const variant of [1, 2]) {
    const seed = [...`${slug}-${variant}`].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    const svg = frame(motif(rng(seed)), glow, glowX, glowY);
    const file = join(OUT, `${slug}-${variant}.webp`);
    let quality = 82;
    let info = await sharp(Buffer.from(svg)).resize(W, H).webp({ quality }).toFile(file);
    while (info.size > 150 * 1024 && quality > 40) {
      quality -= 10;
      info = await sharp(Buffer.from(svg)).resize(W, H).webp({ quality }).toFile(file);
    }
    console.log(`${slug}-${variant}.webp  ${(info.size / 1024).toFixed(1)} KB  q=${quality}`);
  }
}
console.log(`done → ${OUT}`);
