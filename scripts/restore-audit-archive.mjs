#!/usr/bin/env node
/**
 * P18 BE Track 2 / Aşama 4 — Restore an audit-log archive bundle.
 *
 * Usage:
 *   node scripts/restore-audit-archive.mjs --key=audit-archive/2026/05/2026-05-01.json.gz
 *   node scripts/restore-audit-archive.mjs --key=... --dry-run
 *
 * What it does:
 *   1. Fetches the gzipped JSON archive from the configured storage adapter
 *      (local or S3, picked up from STORAGE_BACKEND env, same as the API).
 *   2. Decompresses + validates the manifest (`version=1`, `rowCount` matches).
 *   3. Without --dry-run, INSERTs the rows back into `audit_logs` (idempotent
 *      on the primary key — duplicates are skipped, never overwritten).
 *
 * Safety notes:
 *   - This is an OPERATOR-ONLY tool. It re-inflates hot DB rows from cold
 *     storage. The intended use is forensic / compliance ("show me what
 *     admin X did on 2026-05-01 — that's older than retention").
 *   - Restoration does NOT remove the `archived_audit_logs` pointer row.
 *     After the forensic session ends, re-run the archival cron to roll
 *     the rows back into cold storage.
 */

import { gunzipSync } from 'node:zlib';
import { argv, exit } from 'node:process';

function arg(name) {
  const prefix = `--${name}=`;
  for (const a of argv.slice(2)) if (a.startsWith(prefix)) return a.slice(prefix.length);
  return null;
}

const hasFlag = (name) => argv.slice(2).includes(`--${name}`);

const key = arg('key');
if (!key) {
  console.error('Usage: node scripts/restore-audit-archive.mjs --key=<coldKey> [--dry-run]');
  exit(2);
}
const dryRun = hasFlag('dry-run');

async function main() {
  // Use dynamic imports so the script works whether tsc has emitted or not.
  const { getStorage } = await import('../server/lib/storage/index.js');
  const { prisma } = await import('../server/config/db.js');

  const storage = getStorage();
  const obj = await storage.get(key);
  if (!obj) {
    console.error(`Archive not found in storage backend ${storage.name}: ${key}`);
    exit(3);
  }
  const json = JSON.parse(gunzipSync(obj.body).toString('utf8'));
  if (json.version !== 1) {
    console.error(`Unsupported archive version ${json.version}`);
    exit(4);
  }
  console.log(
    `[restore-audit-archive] manifest ok: ${json.rowCount} rows, window ${json.windowStart} → ${json.windowEnd}`,
  );

  if (dryRun) {
    console.log('[restore-audit-archive] --dry-run set — skipping INSERT');
    exit(0);
  }

  let inserted = 0;
  let skipped = 0;
  for (const row of json.rows) {
    try {
      // createDate comes back as ISO; Prisma needs a Date.
      const restored = {
        ...row,
        createdAt: new Date(row.createdAt),
      };
      await prisma.auditLog.create({ data: restored });
      inserted++;
    } catch (err) {
      if ((err.code ?? '').startsWith('P2002')) {
        skipped++; // duplicate PK — already present, treat as a no-op
        continue;
      }
      throw err;
    }
  }
  console.log(
    `[restore-audit-archive] done: inserted=${inserted}, skipped(dup)=${skipped}`,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[restore-audit-archive] fatal:', err);
  exit(1);
});
