#!/usr/bin/env node
/**
 * P16 — BUTTON_NO_TYPE bulk fix.
 *
 * Tarama: src/**.tsx (test/ ve __snapshots__ hariç).
 * Aksiyon: `<button` ile başlayan ve type=... attribute içermeyen her açılış
 * tag'ine ` type="button"` eklenir. Multi-line tag'leri de yakalamak için
 * tag-balance state machine kullanılır.
 *
 * Güvenli varsayım: explicit `type="submit"` ihtiyacı olan butonlar (form
 * factory'lerinde) zaten yazılmış olduğu için, kalanlar default action-button.
 * False-positive riski sıfır (mevcut `type` attribute'una asla ikinci kez
 * basmaz).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '__snapshots__', 'test', '__tests__'].includes(entry.name)) continue;
      out.push(...(await walk(p)));
    } else if (/\.(tsx|jsx)$/.test(entry.name) && !/\.test\.[jt]sx?$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Tag-aware patcher.
 * - `<button` literal'i için ileri sarar, tag'in kapanış `>` veya `/>` noktasını bulur.
 * - Tag içinde `type=` zaten varsa dokunmaz.
 * - Yoksa, açılış literal'inden hemen sonra ` type="button"` enjekte eder.
 */
function patch(source) {
  const TAG_OPEN = '<button';
  let out = '';
  let i = 0;
  let added = 0;
  while (i < source.length) {
    const idx = source.indexOf(TAG_OPEN, i);
    if (idx < 0) {
      out += source.slice(i);
      break;
    }
    out += source.slice(i, idx);
    out += TAG_OPEN;

    // Tag'in kapanış konumunu bul. JSX expression {} parantezlerini saymak gerekir.
    let j = idx + TAG_OPEN.length;
    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    let inTpl = false;
    let closeAt = -1;
    while (j < source.length) {
      const c = source[j];
      const prev = source[j - 1];
      if (!inSingle && !inDouble && !inTpl && c === '{') depth++;
      else if (!inSingle && !inDouble && !inTpl && c === '}') depth--;
      else if (!inDouble && !inTpl && depth === 0 && c === "'" && prev !== '\\') inSingle = !inSingle;
      else if (!inSingle && !inTpl && depth === 0 && c === '"' && prev !== '\\') inDouble = !inDouble;
      else if (!inSingle && !inDouble && depth === 0 && c === '`' && prev !== '\\') inTpl = !inTpl;
      else if (!inSingle && !inDouble && !inTpl && depth === 0 && c === '>') {
        closeAt = j;
        break;
      }
      j++;
    }
    if (closeAt < 0) {
      // Eksik tag — dokunma, kalan kaynak akar.
      out += source.slice(idx + TAG_OPEN.length);
      break;
    }
    const tagInner = source.slice(idx + TAG_OPEN.length, closeAt + 1);
    // `<button` literal'inden hemen sonra bir whitespace, `>` veya `/` gelmeli.
    // Eğer harf/rakam geliyorsa (örn. `<buttonGroup>`) — bu başka bir tag, dokunma.
    const firstChar = tagInner.charAt(0);
    if (firstChar && /[A-Za-z0-9_]/.test(firstChar)) {
      // Yanlış eşleşme. `<button` literal'ini yaz, devam et.
      i = idx + TAG_OPEN.length;
      continue;
    }
    if (/\btype\s*=/.test(tagInner)) {
      // Zaten type var, dokunma.
      out += tagInner;
    } else {
      out += ' type="button"' + tagInner;
      added++;
    }
    i = closeAt + 1;
  }
  return { patched: out, added };
}

(async () => {
  const files = await walk(SRC);
  let totalAdded = 0;
  let touched = 0;
  for (const f of files) {
    const src = await fs.readFile(f, 'utf8');
    const { patched, added } = patch(src);
    if (added > 0) {
      await fs.writeFile(f, patched, 'utf8');
      console.log(`+ ${path.relative(ROOT, f)}  (+${added})`);
      totalAdded += added;
      touched++;
    }
  }
  console.log('---');
  console.log(`Files touched: ${touched}`);
  console.log(`Buttons patched: ${totalAdded}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
