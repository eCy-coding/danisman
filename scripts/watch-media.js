#!/usr/bin/env node
/**
 * scripts/watch-media.js
 * istek5.txt Pane 6 — 📦 Media-Watcher
 * Node.js entry point → tsx scripts/watch-media.ts
 *
 * Kullanım: node scripts/watch-media.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(cmd, args, opts = {}) {
  const proc = spawn(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: root,
    ...opts,
  });
  proc.on('error', err => {
    console.error(`[watch-media] spawn error: ${err.message}`);
    process.exit(1);
  });
  proc.on('exit', code => {
    if (code !== 0) process.exit(code ?? 1);
  });
  return proc;
}

const args = process.argv.slice(2);
console.log('[watch-media] Starting media optimization watcher…');

// Try tsx first, fallback to ts-node
const tsxPath = path.join(root, 'node_modules', '.bin', 'tsx');
run(tsxPath, ['scripts/watch-media.ts', ...args]);
