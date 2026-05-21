#!/usr/bin/env node
/**
 * scripts/nlm-sync.mjs — P79 NotebookLM corpus sync for ecypro project.
 *
 * Syncs blog MDX + case studies + services to NotebookLM notebook for
 * content writers / strategists to query/expand via NotebookLM UI.
 *
 * Prereq: `nlm login` once via terminal (cookies cached at ~/.nlm/).
 *
 * Usage:
 *   node scripts/nlm-sync.mjs               # sync all (creates notebook if missing)
 *   node scripts/nlm-sync.mjs --dry-run     # preview only
 *   node scripts/nlm-sync.mjs --type=blog   # blog only
 *
 * Notebook: "eCyPro Premium Consulting Corpus"
 * Sources: 20 blog MDX + 10 case studies + 24 service descriptions + audit docs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const NOTEBOOK_NAME = 'eCyPro Premium Consulting Corpus';
const ROOT = path.resolve(import.meta.dirname, '..');
const DRY = process.argv.includes('--dry-run');
const TYPE_FILTER = process.argv.find((a) => a.startsWith('--type='))?.split('=')[1];

function sh(cmd) {
  if (DRY) {
    console.log(`[dry-run] ${cmd}`);
    return '';
  }
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' });
}

function listNotebooks() {
  const raw = execSync('nlm notebook list --json', { encoding: 'utf-8' }).trim();
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function findOrCreateNotebook() {
  const existing = listNotebooks();
  const hit = existing.find((n) => n.title === NOTEBOOK_NAME || n.name === NOTEBOOK_NAME);
  if (hit) {
    console.log(`[nlm] notebook exists: ${hit.id}`);
    return hit.id;
  }
  console.log(`[nlm] creating notebook: ${NOTEBOOK_NAME}`);
  const out = sh(`nlm notebook create "${NOTEBOOK_NAME}"`);
  const idMatch = out.match(/[a-f0-9-]{36}/);
  return idMatch?.[0];
}

function collectSources() {
  const sources = [];

  if (!TYPE_FILTER || TYPE_FILTER === 'blog') {
    const blogDir = path.join(ROOT, 'src/content/blog');
    if (fs.existsSync(blogDir)) {
      fs.readdirSync(blogDir)
        .filter((f) => f.endsWith('.mdx'))
        .forEach((f) =>
          sources.push({
            kind: 'blog',
            path: path.join(blogDir, f),
            label: `blog:${f.replace(/\.mdx$/, '')}`,
          }),
        );
    }
  }

  if (!TYPE_FILTER || TYPE_FILTER === 'case') {
    const casePath = path.join(ROOT, 'src/data/mockCaseStudies.ts');
    if (fs.existsSync(casePath)) {
      sources.push({ kind: 'case', path: casePath, label: 'case-studies' });
    }
  }

  if (!TYPE_FILTER || TYPE_FILTER === 'services') {
    const svcPath = path.join(ROOT, 'src/data/services.ts');
    if (fs.existsSync(svcPath)) {
      sources.push({ kind: 'services', path: svcPath, label: 'services-catalog' });
    }
  }

  if (!TYPE_FILTER || TYPE_FILTER === 'audit') {
    ['brain/P1_P100_AUDIT_MATRIX.md', 'brain/PHASE_1_17_AUDIT.md', 'docs/FC_V37_HANDOFF.md', 'CLAUDE.md'].forEach((rel) => {
      const p = path.join(ROOT, rel);
      if (fs.existsSync(p)) sources.push({ kind: 'audit', path: p, label: rel });
    });
  }

  return sources;
}

function main() {
  const notebookId = findOrCreateNotebook();
  if (!notebookId) {
    console.error('[nlm] notebook id missing — abort');
    process.exit(1);
  }

  const sources = collectSources();
  console.log(`[nlm] ${sources.length} sources to sync`);

  let added = 0;
  for (const s of sources) {
    try {
      sh(`nlm source add --notebook ${notebookId} --file "${s.path}" --label "${s.label}" 2>&1`);
      added++;
      console.log(`  ✓ ${s.label}  (${s.path})`);
    } catch (err) {
      console.log(`  ✗ ${s.label}  ${err.message?.slice(0, 80)}`);
    }
  }

  console.log(`[nlm] sync done · ${added}/${sources.length} added`);

  fs.writeFileSync(
    path.join(ROOT, 'brain/nlm-sync-report.json'),
    JSON.stringify({ syncedAt: new Date().toISOString(), notebookId, sources, added }, null, 2),
  );
}

main();
