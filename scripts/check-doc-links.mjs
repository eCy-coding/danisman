#!/usr/bin/env node
// Internal markdown link-integrity check (doc reorg safety gate).
// Scans every git-tracked *.md for relative links and reports targets that
// resolve to no file on disk. A link counts as OK if it resolves either
// relative to the containing file OR relative to the repo root (docs in this
// repo mix both conventions). HTTP(S), mailto and pure #anchors are ignored.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = process.cwd();
const files = execSync('git ls-files "*.md"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const LINK = /\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\s*\)/g;
const broken = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const dir = dirname(file);
  let m;
  while ((m = LINK.exec(text)) !== null) {
    let target = m[1].replace(/^<|>$/g, '').trim();
    if (/^(https?:|mailto:|tel:|#|data:)/i.test(target)) continue;
    target = target.split('#')[0].split('?')[0].trim();
    if (!target) continue;
    const local = resolve(dir, target);
    const fromRoot = resolve(ROOT, target);
    const ok = (p) => existsSync(p) && (statSync(p).isFile() || statSync(p).isDirectory());
    if (!ok(local) && !ok(fromRoot)) broken.push(`${file} -> ${target}`);
  }
}

if (broken.length) {
  console.log(`BROKEN INTERNAL LINKS: ${broken.length}`);
  for (const b of broken) console.log('  ' + b);
} else {
  console.log('BROKEN INTERNAL LINKS: 0');
}
console.log(`(scanned ${files.length} tracked .md files)`);
