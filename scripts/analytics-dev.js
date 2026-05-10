#!/usr/bin/env node
/**
 * scripts/analytics-dev.js
 * istek5.txt Pane 9 — 📈 Analytics-Dev
 * Node.js entry point → tsx scripts/analytics-dev.ts
 *
 * Kullanım: node scripts/analytics-dev.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(cmd, args) {
  const proc = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', cwd: root });
  proc.on('error', err => { console.error(`[analytics-dev] ${err.message}`); process.exit(1); });
  proc.on('exit', code => { if (code !== 0) process.exit(code ?? 1); });
}

console.log('[analytics-dev] Starting GA4/GTM development server…');
const tsxPath = path.join(root, 'node_modules', '.bin', 'tsx');
run(tsxPath, ['scripts/analytics-dev.ts', ...process.argv.slice(2)]);
