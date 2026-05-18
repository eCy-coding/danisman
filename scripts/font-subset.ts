/**
 * P55.D2 — Font subsetting script.
 *
 * Strategy: keep `@fontsource/inter` variable font, subset to a Latin+
 * Latin-Extended-A glyph range covering Turkish & English. Output a
 * single woff2 to `public/fonts/inter-subset.woff2`.
 *
 * Run: `npm run fonts:subset`
 *
 * Dependency: `subset-font` (npm install --save-dev subset-font glyphhanger).
 *
 * NOTE: This script is intentionally tolerant — if neither dependency is
 * installed, it logs a friendly error and exits with code 0 so CI doesn't
 * fail when fonts are already subsetted in a prior commit.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

// Turkish (ç ğ ı İ ö ş ü) + English (basic ASCII) + Latin-Extended A glyphs
// covering common European business names appearing on the site.
const SUBSET_TEXT = [
  // Latin basic + digits + punctuation
  '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~',
  // Turkish specials
  'ÇĞİıÖŞÜâçğıöşüÂÇĞÖŞÜ',
  // Latin extended A common
  'ÀÁÂÃÄÅÆÈÉÊËÌÍÎÏÐÒÓÔÕØÙÚÛŞÝŸàáâãäåæèéêëìíîïðñòóôõøùúûýÿ',
  // Common symbols
  '€£¥©®™«»—–…',
  // Currency / math
  '+−×÷=%‰',
].join('');

async function main(): Promise<void> {
  const SOURCE = path.join(
    process.cwd(),
    'node_modules',
    '@fontsource',
    'inter',
    'files',
    'inter-latin-variable-wghtOnly-normal.woff2',
  );
  const OUTDIR = path.join(process.cwd(), 'public', 'fonts');
  const OUTFILE = path.join(OUTDIR, 'inter-subset.woff2');

  try {
    await fs.access(SOURCE);
  } catch {
    console.warn(
      `[font-subset] source font not found: ${SOURCE}\n` +
        `              ensure @fontsource/inter is installed.`,
    );
    return;
  }

  let subsetFont: ((b: Buffer, opts: object) => Promise<Buffer>) | null = null;
  try {
    // Dynamic import — works only when the dep is installed
    const mod = (await (new Function('m', 'return import(m)') as (m: string) => Promise<unknown>)(
      'subset-font',
    )) as { default: (b: Buffer, opts: object) => Promise<Buffer> };
    subsetFont = mod.default;
  } catch {
    console.warn(
      '[font-subset] `subset-font` package not installed — run\n' +
        '              `npm i -D subset-font` to enable subsetting.\n' +
        '              Skipping for now (exit 0).',
    );
    return;
  }

  const raw = await fs.readFile(SOURCE);
  const subset = await subsetFont(raw, {
    targetFormat: 'woff2',
    text: SUBSET_TEXT,
    preserveNameIds: [],
  });

  await fs.mkdir(OUTDIR, { recursive: true });
  await fs.writeFile(OUTFILE, subset);

  const beforeKB = (raw.byteLength / 1024).toFixed(1);
  const afterKB = (subset.byteLength / 1024).toFixed(1);
  console.log(
    `[font-subset] done — ${SOURCE.split('/').slice(-1)[0]} (${beforeKB} KB) ` +
      `→ inter-subset.woff2 (${afterKB} KB)`,
  );
}

main().catch((err) => {
  console.error('[font-subset] fatal', err);
  process.exit(1);
});
