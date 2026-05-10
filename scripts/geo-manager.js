#!/usr/bin/env node
/**
 * scripts/geo-manager.js
 * istek5.txt Pane 13 — 🧭 Geo-Manager
 * Node.js entry point → tsx scripts/geo-watch.ts
 *
 * Kullanım: node scripts/geo-manager.js [--watch] [--report]
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(cmd, args) {
  const proc = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', cwd: root });
  proc.on('error', err => { console.error(`[geo-manager] ${err.message}`); process.exit(1); });
  proc.on('exit', code => { if (code !== 0) process.exit(code ?? 1); });
}

console.log('[geo-manager] Starting IP geolocation & banner manager…');
const tsxPath = path.join(root, 'node_modules', '.bin', 'tsx');
run(tsxPath, ['scripts/geo-watch.ts', ...process.argv.slice(2)]);
