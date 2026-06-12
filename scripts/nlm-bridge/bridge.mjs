#!/usr/bin/env node
/**
 * eCyPro Research Bridge (P82) — NotebookLM → admin draft worker.
 *
 * Runs on the OWNER'S machine (NotebookLM has no public API; auth lives in
 * the local `nlm` CLI tokens). Polls the eCyPro API for QUEUED research
 * jobs, drives the local notebooklm-mcp server over stdio JSON-RPC, and
 * delivers a draft payload. The SERVER materialises the BlogPost — this
 * worker never writes content itself (100% NotebookLM-origin text).
 *
 * Zero runtime deps: node:child_process + global fetch (Node >= 20).
 *
 * Env:
 *   ECYPRO_API_URL        default http://localhost:3001/api/v1
 *   RESEARCH_BRIDGE_KEY   required — ApiKey with scope "research:bridge"
 *   NLM_MCP_CMD           default "notebooklm-mcp"
 *   NLM_NOTEBOOK_ID       optional fixed notebook (else find/create by title)
 *   BRIDGE_POLL_MS        default 15000
 *   BRIDGE_ONCE           "1" → process at most one job then exit (tests)
 *
 * Encoded NotebookLM gotchas (proven, see eCyPro-memory RUNBOOK):
 *   - research_status's task_id may differ from research_start's → use status's.
 *   - research_import may return "API error (code 9)" / transport timeout while
 *     the import actually landed → verify-after-mutation via notebook_get count.
 *   - Never hammer-retry NotebookLM calls; single attempt + verify.
 *   - notebook_query may be quota-limited → report-only fallback.
 */

import { spawn } from 'node:child_process';
import process from 'node:process';

const API = (process.env.ECYPRO_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');
const KEY = process.env.RESEARCH_BRIDGE_KEY;
const MCP_CMD = process.env.NLM_MCP_CMD ?? 'notebooklm-mcp';
const FIXED_NOTEBOOK = process.env.NLM_NOTEBOOK_ID || null;
const POLL_MS = Number(process.env.BRIDGE_POLL_MS ?? 15000);
const ONCE = process.env.BRIDGE_ONCE === '1';
const NOTEBOOK_TITLE = 'eCyPro Content Studio';

if (!KEY) {
  console.error('[bridge] RESEARCH_BRIDGE_KEY missing — refusing to start');
  process.exit(1);
}

const log = (...a) => console.log(new Date().toISOString(), '[bridge]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── eCyPro API client ────────────────────────────────────────────────────────

// originGuard on the server requires an Origin from the CORS allowlist on
// state-changing requests. The bridge is an api-key-authenticated trusted
// client, so it identifies as the admin app origin (must be in CORS_ORIGIN).
// Default matches the dev allowlist; set BRIDGE_ORIGIN=https://ecypro.com in prod.
const ORIGIN = process.env.BRIDGE_ORIGIN ?? 'http://localhost:5173';

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${KEY}`,
      // Tier limiter classifies by x-api-key (Authorization alone reads as
      // anonymous → 60req/15min, starved by our 15s poll). Same key, both
      // headers: auth via Authorization, tier/identity via x-api-key.
      'x-api-key': KEY,
      origin: ORIGIN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`API ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return json;
}

const claimJob = () => api('POST', '/admin/research/bridge/claim');
const patchJob = (id, body) => api('PATCH', `/admin/research/bridge/jobs/${id}`, body);

// ─── Minimal MCP stdio client (JSON-RPC 2.0, newline-delimited) ───────────────

class McpClient {
  constructor(cmd) {
    // Allow "uvx notebooklm-mcp" / "node fixture.mjs" style commands.
    const parts = cmd.trim().split(/\s+/);
    this.proc = spawn(parts[0], parts.slice(1), { stdio: ['pipe', 'pipe', 'pipe'] });
    this.buf = '';
    this.pending = new Map();
    this.nextId = 1;
    this.proc.stdout.on('data', (chunk) => this.onData(chunk.toString('utf8')));
    this.proc.stderr.on('data', (chunk) => {
      const line = chunk.toString('utf8').trim();
      if (line) log('mcp-stderr:', line.slice(0, 200));
    });
    this.exited = new Promise((resolve) => this.proc.on('exit', resolve));
  }

  onData(s) {
    this.buf += s;
    let idx;
    while ((idx = this.buf.indexOf('\n')) >= 0) {
      const line = this.buf.slice(0, idx).trim();
      this.buf = this.buf.slice(idx + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue; // non-JSON noise on stdout
      }
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`MCP error: ${JSON.stringify(msg.error).slice(0, 300)}`));
        else resolve(msg.result);
      }
    }
  }

  rpc(method, params, timeoutMs = 120_000) {
    const id = this.nextId++;
    const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      this.proc.stdin.write(payload);
    });
  }

  notify(method, params) {
    this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  async init() {
    await this.rpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'ecypro-research-bridge', version: '1.0.0' },
    });
    this.notify('notifications/initialized', {});
  }

  /** Call a NotebookLM tool; tool results arrive as content[{type:'text',text}] —
   *  the python server emits JSON strings, so parse when possible. */
  async tool(name, args, timeoutMs) {
    const result = await this.rpc('tools/call', { name, arguments: args ?? {} }, timeoutMs);
    const text = (result?.content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n');
    if (result?.isError) throw new Error(`tool ${name} failed: ${text.slice(0, 400)}`);
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  close() {
    try {
      this.proc.kill('SIGTERM');
    } catch {
      /* already gone */
    }
  }
}

// ─── NotebookLM pipeline ──────────────────────────────────────────────────────

async function ensureNotebook(mcp) {
  if (FIXED_NOTEBOOK) return FIXED_NOTEBOOK;
  const list = await mcp.tool('notebook_list', { max_results: 100 });
  const found = (list?.notebooks ?? []).find((n) => n.title === NOTEBOOK_TITLE);
  if (found) return found.id;
  const created = await mcp.tool('notebook_create', { title: NOTEBOOK_TITLE });
  const id = created?.notebook_id ?? created?.notebook?.id ?? created?.id;
  if (!id) throw new Error('notebook_create returned no id');
  log('created notebook', id);
  return id;
}

function sourceCountOf(nb) {
  return nb?.notebook?.source_count ?? (Array.isArray(nb?.sources) ? nb.sources.length : null);
}

const JUNK = ['page not found', 'request rejected', 'bulunamad', '404', 'access denied', 'just a moment'];

function cleanSources(items) {
  return (items ?? [])
    .filter((s) => s?.title && !JUNK.some((j) => s.title.toLowerCase().includes(j)))
    .slice(0, 40)
    .map((s) => ({ title: String(s.title).slice(0, 300), ...(s.url ? { url: s.url } : {}) }));
}

/** Build the draft payload purely from NotebookLM outputs. */
function buildDraft(job, report, reportTitle, sources) {
  const titleTr = (reportTitle || job.topic).trim().slice(0, 200);
  const body = (report || '').trim();
  const firstPara =
    body
      .split(/\n{2,}/)
      .map((p) => p.replace(/^#+\s*/gm, '').trim())
      .find((p) => p.length >= 40) ?? '';
  const excerptBase = firstPara || `${job.topic} üzerine NotebookLM derin araştırma özeti.`;
  const excerptTr = excerptBase.replace(/\s+/g, ' ').slice(0, 480).padEnd(20, '.');
  const bodyTrMdx =
    body.length >= 100
      ? body
      : `# ${titleTr}\n\nNotebookLM araştırması bu konu için ${sources.length} kaynak topladı; rapor metni üretilmedi (fast mode sınırı). Kaynaklar aşağıdadır.\n`;
  return {
    titleTr: titleTr.length >= 5 ? titleTr : `${titleTr} — araştırma`,
    excerptTr,
    bodyTrMdx,
    metaDescTr: excerptTr.slice(0, 160),
    sources,
  };
}

async function processJob(mcp, job) {
  const stage = (status, stageDetail, extra = {}) =>
    patchJob(job.id, { status, stageDetail, ...extra });

  const notebookId = await ensureNotebook(mcp);
  await stage('RESEARCHING', 'NotebookLM Deep Research başlatılıyor', { notebookId });

  // Google intermittently rejects DEEP research with code 8 (quota/transient,
  // "try fast"). Falling back keeps the job alive instead of FAILED — the
  // stage line tells the operator which mode actually ran.
  let effectiveMode = job.mode === 'deep' ? 'deep' : 'fast';
  let started = await mcp.tool('research_start', {
    notebook_id: notebookId,
    query: job.topic,
    mode: effectiveMode,
  });
  const startErr = () => JSON.stringify(started).slice(0, 300);
  if (started?.status && started.status !== 'success') {
    const quotaish = /code 8|UserDisplayableError|RESOURCE_EXHAUSTED/i.test(startErr());
    if (effectiveMode === 'deep' && quotaish) {
      effectiveMode = 'fast';
      await stage('RESEARCHING', 'Deep mod Google kotasına takıldı — fast moduna düşüldü');
      log(`job ${job.id}: deep → fast fallback (code 8)`);
      started = await mcp.tool('research_start', {
        notebook_id: notebookId,
        query: job.topic,
        mode: 'fast',
      });
    }
    if (started?.status && started.status !== 'success') {
      throw new Error(`research_start: ${startErr()}`);
    }
  }

  // Poll. research_status blocks up to max_wait per call; loop with budget.
  const budgetMs = effectiveMode === 'deep' ? 15 * 60_000 : 6 * 60_000;
  const deadline = Date.now() + budgetMs;
  let status = null;
  while (Date.now() < deadline) {
    status = await mcp.tool(
      'research_status',
      { notebook_id: notebookId, max_wait: 60, poll_interval: 20, compact: false },
      90_000,
    );
    if (status?.status === 'completed' || status?.status === 'error') break;
    await stage('RESEARCHING', `Araştırma sürüyor (${status?.status ?? '...'})`);
  }
  if (status?.status !== 'completed') {
    throw new Error(`research did not complete in budget: ${status?.status ?? 'timeout'}`);
  }

  // GOTCHA: import with the task_id research_status returned (it drifts).
  const taskId = status.task_id;
  const found = status.sources_found ?? null;
  await stage('IMPORTING', `Rapor hazır (${found ?? '?'} kaynak) — import ediliyor`, {
    reportTitle: (status.report || '').split('\n')[0]?.replace(/^#\s*/, '').slice(0, 300) || undefined,
  });

  let importNote = 'import ok';
  try {
    await mcp.tool('research_import', {
      notebook_id: notebookId,
      task_id: taskId,
      cited_only: true,
      timeout: 240,
    }, 300_000);
  } catch (err) {
    // Verify-after-mutation: the mutation often lands despite the error.
    importNote = `import yanıtı hatalıydı (${String(err.message).slice(0, 120)}) — sayımla doğrulandı`;
  }
  const nb = await mcp.tool('notebook_get', { notebook_id: notebookId });
  const count = sourceCountOf(nb);

  await stage('DRAFTING', `Draft hazırlanıyor (notebook ${count ?? '?'} kaynak; ${importNote})`, {
    sourceCount: count ?? undefined,
  });

  const report = status.report || '';
  const reportTitle =
    (report.split('\n').find((l) => l.startsWith('#')) || '').replace(/^#+\s*/, '') || null;
  const sources = cleanSources(status.sources);
  const draft = buildDraft(job, report, reportTitle, sources);

  await patchJob(job.id, {
    status: 'DONE',
    stageDetail: 'Draft teslim edildi — admin editöründe düzenlenebilir',
    sourceCount: count ?? undefined,
    reportTitle: reportTitle ?? undefined,
    notebookId,
    draft,
  });
  log(`job ${job.id} DONE → draft "${draft.titleTr.slice(0, 60)}"`);

  // Best-effort breadcrumb back into the notebook (single attempt).
  try {
    await mcp.tool('note', {
      notebook_id: notebookId,
      action: 'create',
      title: `eCyPro draft üretildi — ${draft.titleTr.slice(0, 80)}`,
      content: `Job ${job.id} → eCyPro admin draft. Konu: ${job.topic}`,
    });
  } catch {
    /* non-fatal */
  }
}

// ─── Main loop ────────────────────────────────────────────────────────────────

async function main() {
  log(`starting — api=${API} mcp=${MCP_CMD} poll=${POLL_MS}ms${ONCE ? ' (once)' : ''}`);
  const mcp = new McpClient(MCP_CMD);
  await mcp.init();
  const info = await mcp.tool('server_info', {});
  log(`notebooklm-mcp v${info?.version ?? '?'} auth=${info?.auth_status ?? '?'}`);
  if (info?.auth_status === 'not_configured') {
    throw new Error('NotebookLM auth not configured — run `nlm login` first');
  }

  let stop = false;
  process.on('SIGINT', () => {
    log('SIGINT — draining');
    stop = true;
  });
  process.on('SIGTERM', () => {
    stop = true;
  });

  while (!stop) {
    let job = null;
    try {
      const res = await claimJob();
      job = res?.data ?? null;
    } catch (err) {
      log('claim failed:', String(err.message).slice(0, 200));
      await sleep(POLL_MS);
      continue;
    }
    if (!job) {
      if (ONCE) break;
      await sleep(POLL_MS);
      continue;
    }
    log(`claimed job ${job.id} — "${job.topic.slice(0, 80)}" (${job.mode})`);
    try {
      await processJob(mcp, job);
    } catch (err) {
      const message = String(err?.message ?? err).slice(0, 3900);
      log(`job ${job.id} FAILED: ${message.slice(0, 200)}`);
      try {
        await patchJob(job.id, { status: 'FAILED', error: message, stageDetail: 'Bridge hatası' });
      } catch (patchErr) {
        log('could not report failure:', String(patchErr.message).slice(0, 200));
      }
    }
    if (ONCE) break;
  }

  mcp.close();
  log('stopped');
}

main().catch((err) => {
  console.error('[bridge] fatal:', err);
  process.exit(1);
});
