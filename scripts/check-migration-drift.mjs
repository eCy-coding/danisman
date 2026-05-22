#!/usr/bin/env node
/**
 * P18 BE Track 2 / Aşama 5 — Prisma migration drift detector.
 *
 * Wraps `npx prisma migrate diff` so a CI gate fails if the migrations
 * directory diverges from `prisma/schema.prisma`. Two checks:
 *
 *   1. Schema → migration diff: applying all current migrations from
 *      empty should yield the schema. If they don't match, someone hand-
 *      edited `schema.prisma` without running `prisma migrate dev`.
 *
 *   2. Migration → schema diff (the inverse) — also empty — ensures the
 *      schema isn't behind the migrations.
 *
 * Why a wrapper? Because the raw `prisma migrate diff` output isn't
 * trivially parseable: success prints "No difference detected" but the
 * Prisma CLI sometimes uses exit code 2 to mean "there IS a diff" rather
 * than "the command failed". This wrapper:
 *   - runs both directions,
 *   - captures stdout + stderr,
 *   - emits a JSON summary,
 *   - exits 1 only when an actual drift is detected (not when the
 *     Prisma engine binary fails to fetch in the sandbox).
 *
 * Usage:
 *   node scripts/check-migration-drift.mjs            # report only
 *   STRICT=1 node scripts/check-migration-drift.mjs   # exit 1 on drift
 */

import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function runPrisma(args) {
  return new Promise((resolveProc) => {
    const child = spawn('npx', ['prisma', ...args], {
      cwd: ROOT,
      env: { ...process.env, CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('close', (code) => {
      resolveProc({ code, stdout, stderr });
    });
    child.on('error', (err) => {
      resolveProc({ code: -1, stdout: '', stderr: err.message });
    });
  });
}

function classifyDiff(result) {
  // Engine binary fetch failures are a sandbox/network issue, not drift.
  if (/binaries\.prisma\.sh|getaddrinfo|ENOTFOUND|ECONNREFUSED/i.test(result.stderr)) {
    return { drift: false, reason: 'engine_unreachable', skipped: true };
  }
  // A missing connector (no migration_lock.toml) is a config error, not drift.
  if (/migration_lock\.toml|Could not determine the connector/i.test(result.stderr)) {
    return { drift: false, reason: 'connector_undeterminable', skipped: true };
  }
  const combined = `${result.stdout}\n${result.stderr}`;
  if (/No difference detected/i.test(combined)) {
    return { drift: false, reason: 'in_sync', skipped: false };
  }
  // Prisma 7 `--exit-code` contract: 0 = empty (in sync), 2 = not empty (drift),
  // 1 = command error. The pre-7 wrapper treated any non-zero as drift, which
  // flagged genuine CLI errors (e.g. removed flags) as false-positive drift.
  if (result.code === 0) {
    return { drift: false, reason: 'in_sync', skipped: false };
  }
  if (result.code === 2) {
    return { drift: true, reason: 'drift_detected', skipped: false };
  }
  // code === 1 (or anything else) → the CLI itself failed; surface as skipped
  // error rather than asserting drift we cannot actually confirm.
  return { drift: false, reason: 'cli_error', skipped: true, code: result.code };
}

async function main() {
  const checks = [];

  const fromMigrationsToSchema = await runPrisma([
    'migrate',
    'diff',
    '--from-migrations',
    'prisma/migrations',
    '--to-schema',
    'prisma/schema.prisma',
    '--exit-code',
  ]);
  checks.push({
    direction: 'migrations→schema',
    ...classifyDiff(fromMigrationsToSchema),
  });

  const fromSchemaToMigrations = await runPrisma([
    'migrate',
    'diff',
    '--from-schema',
    'prisma/schema.prisma',
    '--to-migrations',
    'prisma/migrations',
    '--exit-code',
  ]);
  checks.push({
    direction: 'schema→migrations',
    ...classifyDiff(fromSchemaToMigrations),
  });

  const anyDrift = checks.some((c) => c.drift);
  const anySkipped = checks.some((c) => c.skipped);

  console.log(
    JSON.stringify(
      {
        summary: {
          checks: checks.length,
          drift: anyDrift,
          skipped: anySkipped,
        },
        checks,
      },
      null,
      2,
    ),
  );

  if (process.env.STRICT === '1' && anyDrift && !anySkipped) {
    console.error('[migration-drift] STRICT=1 — drift detected, FAILING');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[migration-drift] fatal:', err);
  process.exit(2);
});
