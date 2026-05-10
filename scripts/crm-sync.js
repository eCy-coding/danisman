#!/usr/bin/env node
/**
 * scripts/crm-sync.js
 * istek5.txt Pane 14 — 🧑‍💼 Lead-CRM
 * Node.js entry point → tsx scripts/crm-watch.ts
 *
 * Kullanım: node scripts/crm-sync.js [--watch] [--dry-run]
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(cmd, args) {
  const proc = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', cwd: root });
  proc.on('error', err => { console.error(`[crm-sync] ${err.message}`); process.exit(1); });
  proc.on('exit', code => { if (code !== 0) process.exit(code ?? 1); });
}

console.log('[crm-sync] Starting CRM lead sync watcher…');
const tsxPath = path.join(root, 'node_modules', '.bin', 'tsx');
run(tsxPath, ['scripts/crm-watch.ts', ...process.argv.slice(2)]);
