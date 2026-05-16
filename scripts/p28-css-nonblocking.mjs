#!/usr/bin/env node
/**
 * P28-T03 — Convert Vite-auto-injected `<link rel="stylesheet">` tags into
 * non-blocking print-trick form:
 *
 *     <link rel="preload" as="style" href="...">
 *     <link rel="stylesheet" href="..." media="print" onload="this.media='all'">
 *     <noscript><link rel="stylesheet" href="..."></noscript>
 *
 * Why a postbuild step?
 *   Vite injects render-blocking `<link rel="stylesheet" crossorigin href=…>`
 *   entries for every CSS chunk it emits (client-*, main-*, route chunks).
 *   The existing `media="print" onload="this.media='all'"` trick in
 *   index.html only covers the SOURCE `/index.css` import — Vite-emitted
 *   chunk CSS bypasses it. Lighthouse P27 flagged 601ms + 301ms
 *   render-block from these two stylesheets alone.
 *
 * Runs after `vite build` (and after generate-sitemap/rss) in `postbuild`.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const HTML_FILES = ['index.html', 'admin.html'];

const linkRe = /<link rel="stylesheet"(?: crossorigin)? href="([^"]+\.css)"\s*\/?>/g;

let totalRewrites = 0;

for (const file of HTML_FILES) {
  const full = path.join(DIST, file);
  if (!fs.existsSync(full)) continue;
  let html = fs.readFileSync(full, 'utf8');
  let count = 0;
  const matches = [...html.matchAll(linkRe)];
  if (matches.length === 0) {
    console.log(`[p28-css] ${file}: no auto-injected stylesheets`);
    continue;
  }
  for (const m of matches) {
    const href = m[1];
    // Skip if it's already in print-trick form (defensive guard)
    if (html.includes(`href="${href}" media="print"`)) continue;
    const replacement = [
      `<link rel="preload" as="style" href="${href}">`,
      `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'">`,
      `<noscript><link rel="stylesheet" href="${href}"></noscript>`,
    ].join('\n    ');
    html = html.replace(m[0], replacement);
    count += 1;
  }
  fs.writeFileSync(full, html, 'utf8');
  console.log(`[p28-css] ${file}: rewrote ${count} stylesheet tag(s) to non-blocking`);
  totalRewrites += count;
}

console.log(`[p28-css] total rewrites: ${totalRewrites}`);
