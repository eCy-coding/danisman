#!/usr/bin/env tsx
/**
 * Launch Readiness Check — eCyPro
 *
 * Owner pre-merge Go/No-Go gate. One-shot programmatic assertion of:
 *   1. Required env keys present (key NAMES only — values NEVER logged)
 *   2. Recommended env keys (warn-only)
 *   3. Production endpoints respond (www / api / Resend)
 *   4. Repo gate (open PR cascade + git branch state)
 *   5. NLD vault freshness reminder (manual, not enforced)
 *
 * Exit codes:
 *   0 = all required checks PASS (GO)
 *   1 = at least one required check FAIL (NO-GO)
 *   2 = warnings only — recommended missing / endpoint soft-fail (GO with warnings)
 *
 * Kullanım:
 *   npm run launch:readiness
 *   npx tsx scripts/launch-readiness.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ENV yükle — .env.local her zaman .env'i override eder (dotenvx first-wins workaround)
for (const file of ['.env', '.env.local']) {
  const fp = path.join(ROOT, file);
  if (fs.existsSync(fp)) {
    const parsed = dotenv.parse(fs.readFileSync(fp));
    for (const [k, v] of Object.entries(parsed)) {
      process.env[k] = v;
    }
  }
}

// ─── Config ─────────────────────────────────────────────────────────────────

const REQUIRED_ENV = [
  'DATABASE_URL',
  'RESEND_API_KEY',
  'NOTION_API_KEY',
  'NOTION_DB_PROSPECTS',
  'NOTION_DB_DELIVERABLES',
  'NOTION_DB_NOTES',
] as const;

const RECOMMENDED_ENV = [
  'CALENDLY_WEBHOOK_SECRET',
  'SENTRY_DSN',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'RENDER_API_KEY',
  'RENDER_SERVICE_ID',
] as const;

const EXPECTED_RENDER_SERVICE_ID = 'srv-d84m35jtqb8s73ffp8qg';
const PR_REPO = 'eCy-coding/danisman';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Mark = 'pass' | 'warn' | 'fail';
const ICON: Record<Mark, string> = { pass: '[✓]', warn: '[!]', fail: '[✗]' };

const lines: string[] = [];
function log(mark: Mark, msg: string): void {
  lines.push(`${ICON[mark]} ${msg}`);
}

async function httpCheck(
  url: string,
  expect: number[],
  headers?: Record<string, string>,
  ms = 8000,
): Promise<{ ok: boolean; code: number | string }> {
  try {
    const res = await fetch(url, {
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(ms),
    });
    return { ok: expect.includes(res.status), code: res.status };
  } catch (err) {
    return { ok: false, code: err instanceof Error ? err.name : 'ERR' };
  }
}

// ─── Checks ─────────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  const ts = new Date().toISOString();

  // 1 + 2: ENV ──────────────────────────────────────────────────────────────
  let reqPass = 0;
  for (const key of REQUIRED_ENV) {
    const present = !!process.env[key]?.trim();
    if (present) {
      reqPass++;
      log('pass', `${key} present`);
    } else {
      log('fail', `${key} missing (REQUIRED)`);
    }
  }

  let recPass = 0;
  for (const key of RECOMMENDED_ENV) {
    const present = !!process.env[key]?.trim();
    if (present) {
      recPass++;
      if (key === 'RENDER_SERVICE_ID' && process.env[key]?.trim() !== EXPECTED_RENDER_SERVICE_ID) {
        log('warn', `${key} present but ≠ expected ${EXPECTED_RENDER_SERVICE_ID}`);
      } else {
        log('pass', `${key} present`);
      }
    } else {
      log('warn', `${key} missing (recommended)`);
    }
  }

  // 3: Production endpoints ───────────────────────────────────────────────────
  let epPass = 0;
  const EP_TOTAL = 3;

  // www may serve 200 directly or 308 (canonical redirect) — both healthy.
  const www = await httpCheck('https://ecypro.com', [200, 304, 308]);
  if (www.ok) {
    epPass++;
    log('pass', `ecypro.com → ${www.code} OK`);
  } else {
    log('fail', `ecypro.com → ${www.code}`);
  }

  // Server exposes /api/health (server/index.ts:166), not /health.
  const api = await httpCheck('https://api.ecypro.com/api/health', [200]);
  if (api.ok) {
    epPass++;
    log('pass', `api.ecypro.com/api/health → ${api.code} OK`);
  } else {
    log('fail', `api.ecypro.com/api/health → ${api.code}`);
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = await httpCheck('https://api.resend.com/domains', [200], {
      Authorization: `Bearer ${resendKey}`,
    });
    if (resend.ok) {
      epPass++;
      log('pass', `api.resend.com/domains → ${resend.code} OK`);
    } else {
      log('fail', `api.resend.com/domains → ${resend.code}`);
    }
  } else {
    log('fail', `api.resend.com/domains → skipped (RESEND_API_KEY missing)`);
  }

  // 4: Repo gate ──────────────────────────────────────────────────────────────
  let openPrCount = -1;
  try {
    const out = execFileSync(
      'gh',
      ['pr', 'list', '--repo', PR_REPO, '--state', 'open', '--json', 'number,title'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    openPrCount = (JSON.parse(out) as unknown[]).length;
  } catch {
    openPrCount = -1;
  }
  let repoGateFail = false;
  if (openPrCount >= 1) {
    log('pass', `open PR cascade (${PR_REPO}): ${openPrCount} open`);
  } else if (openPrCount === 0) {
    repoGateFail = true;
    log('fail', `open PR cascade (${PR_REPO}): 0 open — cascade closed unexpectedly`);
  } else {
    log('warn', `open PR cascade (${PR_REPO}): could not query (gh missing/unauth)`);
  }

  let branch = 'unknown';
  try {
    branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    branch = 'unknown';
  }
  if (branch === 'main') {
    log('pass', `git branch: ${branch}`);
  } else {
    log('warn', `git branch: ${branch} (not on main)`);
  }

  // 5: NLD vault freshness reminder ────────────────────────────────────────────
  const reminder =
    "ℹ️  Reminder: confirm NotebookLM vaults reflect today's session before merge. " +
    'Vault count expected: 8 (4 coding + 3 mapped existing + 1 Operations Archive).';

  // ─── Report ────────────────────────────────────────────────────────────────
  const reqTotal = REQUIRED_ENV.length;
  const recTotal = RECOMMENDED_ENV.length;

  process.stdout.write(`\n🚀 eCyPro Launch Readiness Check — ${ts}\n\n`);
  for (const l of lines) process.stdout.write(`${l}\n`);
  process.stdout.write('\n────────────────────────────\n');
  process.stdout.write(`Required: ${reqPass}/${reqTotal} PASS\n`);
  process.stdout.write(`Recommended: ${recPass}/${recTotal} PASS\n`);
  process.stdout.write(`Endpoints: ${epPass}/${EP_TOTAL} PASS\n`);
  process.stdout.write(`\n${reminder}\n`);

  // Exit code: required env or repo-gate or endpoint failure → NO-GO.
  const requiredFail = reqPass < reqTotal || epPass < EP_TOTAL || repoGateFail;
  const hasWarnings = recPass < recTotal || branch !== 'main' || openPrCount < 0;

  process.stdout.write('\n');
  if (requiredFail) {
    process.stdout.write('❌ NO-GO — fix the FAIL items above before owner 19:00 admin-merge.\n\n');
    return 1;
  }
  if (hasWarnings) {
    process.stdout.write(
      '🟡 GO-WITH-WARNINGS — required checks pass; review [!] items before merge.\n\n',
    );
    return 2;
  }
  process.stdout.write('✅ GO — all required checks pass.\n\n');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`\n💥 launch-readiness crashed: ${err}\n\n`);
    process.exit(1);
  });
