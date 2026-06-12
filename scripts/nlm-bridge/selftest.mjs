#!/usr/bin/env node
/**
 * Bridge self-test — runs bridge.mjs end-to-end (BRIDGE_ONCE=1) against the
 * fixture MCP and an in-process stub of the eCyPro bridge API. No DB, no
 * NotebookLM, zero deps. Exits non-zero on the first failed assertion.
 *
 * Scenarios:
 *   1. default                      → TR-only draft (regression: no EN fields)
 *   2. BRIDGE_EN=1                  → bilingual draft (titleEn/excerptEn/bodyEnMdx)
 *   3. BRIDGE_EN=1 + FAKE_EMPTY_REPORT=1 → TR via Studio fallback + EN second report
 *
 * Run: npm run nlm:selftest   (or node scripts/nlm-bridge/selftest.mjs)
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import process from 'node:process';

const HERE = dirname(fileURLToPath(import.meta.url));
const BRIDGE = join(HERE, 'bridge.mjs');
const FIXTURE = join(HERE, '__fixtures__', 'fake-mcp.mjs');

const JOB = {
  id: 'job-selftest',
  topic: 'Aile şirketlerinde yapay zekâ dönüşümü',
  lang: 'tr',
  mode: 'fast',
  contentType: 'blog',
  primaryDomain: 'AILE_SIRKETI',
};

/** Stub bridge API: one claimable job, every PATCH recorded for assertions. */
function startStubApi() {
  const patches = [];
  let claimed = false;
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      if (req.method === 'POST' && req.url.endsWith('/admin/research/bridge/claim')) {
        if (claimed) {
          res.writeHead(204).end();
          return;
        }
        claimed = true;
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', data: JOB }));
        return;
      }
      if (req.method === 'PATCH' && req.url.includes('/admin/research/bridge/jobs/')) {
        patches.push(JSON.parse(body || '{}'));
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      res.writeHead(404).end();
    });
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve({ server, patches, port: server.address().port }),
    ),
  );
}

async function runScenario(name, extraEnv, checks) {
  const { server, patches, port } = await startStubApi();
  const env = {
    ...process.env,
    ECYPRO_API_URL: `http://127.0.0.1:${port}/api/v1`,
    RESEARCH_BRIDGE_KEY: 'selftest-key',
    NLM_MCP_CMD: `node ${FIXTURE}`,
    BRIDGE_ONCE: '1',
    BRIDGE_POLL_MS: '50',
    RESEARCH_GRACE_MS: '50',
    BRIDGE_EN: '',
    FAKE_EMPTY_REPORT: '',
    ...extraEnv,
  };
  const { code, out } = await new Promise((resolve) => {
    const p = spawn('node', [BRIDGE], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.stderr.on('data', (c) => (out += c));
    // Hard kill far above the expected ~2s runtime — a hang is a failure.
    const killer = setTimeout(() => p.kill('SIGKILL'), 90_000);
    p.on('exit', (code) => {
      clearTimeout(killer);
      resolve({ code, out });
    });
  });
  server.close();
  try {
    assert.equal(code, 0, `bridge exited ${code}`);
    const done = patches.find((p) => p.status === 'DONE');
    assert.ok(done?.draft, 'no DONE patch with draft payload');
    checks(done.draft, patches);
  } catch (err) {
    console.error(`\nFAIL ${name}\n${err.message}\n--- bridge output ---\n${out}`);
    process.exit(1);
  }
  console.log(`PASS ${name}`);
}

await runScenario('tr-only (BRIDGE_EN unset — regression)', {}, (draft) => {
  assert.ok(draft.titleTr.length >= 5, 'titleTr missing');
  assert.ok(draft.bodyTrMdx.includes('## Metodoloji'), 'TR methodology block missing');
  assert.equal(draft.titleEn, undefined, 'titleEn must be absent without BRIDGE_EN');
  assert.equal(draft.excerptEn, undefined, 'excerptEn must be absent without BRIDGE_EN');
  assert.equal(draft.bodyEnMdx, undefined, 'bodyEnMdx must be absent without BRIDGE_EN');
});

await runScenario('bilingual (BRIDGE_EN=1)', { BRIDGE_EN: '1' }, (draft) => {
  assert.ok(draft.bodyTrMdx.includes('## Metodoloji'), 'TR leg regressed');
  assert.ok((draft.titleEn ?? '').length >= 5, 'titleEn missing');
  assert.ok((draft.excerptEn ?? '').length >= 20, 'excerptEn missing/short');
  assert.ok((draft.bodyEnMdx ?? '').length >= 100, 'bodyEnMdx missing/thin');
  assert.ok(draft.titleEn.includes('Fixture Studio Report'), 'titleEn not from EN report H1');
  assert.ok(draft.bodyEnMdx.includes('## Key Takeaways'), 'EN takeaways block missing');
  assert.ok(draft.bodyEnMdx.includes('## Methodology'), 'EN methodology block missing');
  assert.ok(!draft.bodyEnMdx.includes('# Fixture Studio Report'), 'EN H1 must be stripped');
});

await runScenario(
  'bilingual + empty status report (both legs via Studio)',
  { BRIDGE_EN: '1', FAKE_EMPTY_REPORT: '1' },
  (draft) => {
    assert.ok(draft.bodyTrMdx.includes('Stratejik Görünüm'), 'TR Studio fallback text missing');
    assert.ok((draft.bodyEnMdx ?? '').includes('Strategic Outlook'), 'EN Studio text missing');
  },
);

console.log('bridge selftest: ALL PASS');
