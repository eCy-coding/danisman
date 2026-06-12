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
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const API = (process.env.ECYPRO_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');
const KEY = process.env.RESEARCH_BRIDGE_KEY;
const MCP_CMD = process.env.NLM_MCP_CMD ?? 'notebooklm-mcp';
const FIXED_NOTEBOOK = process.env.NLM_NOTEBOOK_ID || null;
const POLL_MS = Number(process.env.BRIDGE_POLL_MS ?? 15000);
// Wait between report grace re-polls (fixture runs shrink this to ~200ms).
const GRACE_MS = Number(process.env.RESEARCH_GRACE_MS ?? 15000);
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

/**
 * One notebook PER JOB (calibration root-fix). A shared notebook accumulates
 * every past job's sources, and the Studio report fallback synthesises the
 * WHOLE notebook — a fresh "enflasyon" job came back titled "Aile
 * İşletmelerinde Yapay Zekâ…" (topic drift, report ignores custom_prompt).
 * Isolation makes drift impossible; NLM_NOTEBOOK_ID still pins a fixed
 * notebook when explicitly configured.
 */
async function ensureNotebook(mcp, job) {
  if (FIXED_NOTEBOOK) return FIXED_NOTEBOOK;
  const topicSlug = String(job?.topic ?? '')
    .slice(0, 40)
    .replace(/\s+/g, ' ')
    .trim();
  const title = `${NOTEBOOK_TITLE} — ${topicSlug} [${String(job?.id ?? '').slice(-6)}]`;
  const created = await mcp.tool('notebook_create', { title });
  const id = created?.notebook_id ?? created?.notebook?.id ?? created?.id;
  if (!id) throw new Error('notebook_create returned no id');
  log(`created isolated notebook ${id} — "${title}"`);
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

/**
 * Report guarantee, leg 2: when research_status never ships report text,
 * synthesise one from the imported sources via Studio. Pattern proven in the
 * NLM workflow factory (studio_create → studio_status poll →
 * download_artifact to a file). Returns the report text or null — caller
 * keeps the honest template as the last resort. RUNBOOK gotcha: report
 * artifacts IGNORE custom_prompt, so the default synthesis is all we get.
 */
async function studioReport(mcp, notebookId, language, log, onTick) {
  // The MCP wrapper returns error payloads as plain objects (it does not
  // throw) — research_start checks `status` by hand for the same reason. The
  // first proof run lost its report because a quota-window `status:'error'`
  // reply slipped through unchecked. Validate, log, retry once.
  const createOnce = () =>
    mcp
      .tool(
        'studio_create',
        { notebook_id: notebookId, artifact_type: 'report', confirm: true, language },
        120_000,
      )
      .catch((err) => ({ status: 'error', error: String(err.message).slice(0, 200) }));
  let created = await createOnce();
  if (created?.status !== 'success' || !created?.artifact_id) {
    log(`studio_create attempt 1 rejected: ${JSON.stringify(created).slice(0, 200)} — retrying`);
    await sleep(30_000);
    created = await createOnce();
  }
  if (created?.status !== 'success' || !created?.artifact_id) {
    log(`studio_create failed: ${JSON.stringify(created).slice(0, 200)}`);
    return null;
  }

  const stateOf = (a) => String(a?.status ?? a?.state ?? '').toLowerCase();
  const idOf = (a) => a?.artifact_id ?? a?.id ?? null;

  // Poll the EXACT artifact we created (other report artifacts may pre-exist
  // in the shared notebook). Report synthesis can take >10 minutes — the
  // factory RUNBOOK polls up to 20; 12 keeps the job under the UI's patience.
  const artifactId = created.artifact_id;
  const startedAt = Date.now();
  const deadline = startedAt + 12 * 60_000;
  let ready = false;
  while (Date.now() < deadline) {
    const st = await mcp
      .tool('studio_status', { notebook_id: notebookId }, 60_000)
      .catch(() => null);
    const mine = (st?.artifacts ?? st?.items ?? []).find((a) => idOf(a) === artifactId);
    const state = mine ? stateOf(mine) : 'missing';
    if (/complet|ready|success|done|finish/.test(state)) {
      ready = true;
      break;
    }
    if (/fail|error/.test(state)) {
      log(`studio report failed server-side: ${state}`);
      return null;
    }
    if (onTick) {
      const mins = Math.round((Date.now() - startedAt) / 60_000);
      await onTick(`Studio raporu sentezleniyor (${state}, ${mins} dk)`).catch(() => {});
    }
    await sleep(20_000);
  }
  if (!ready) {
    log('studio report not completed within budget');
    return null;
  }

  const outPath = join(tmpdir(), `bridge-report-${notebookId.slice(0, 8)}-${Date.now()}.md`);
  const dl = await mcp
    .tool(
      'download_artifact',
      {
        notebook_id: notebookId,
        artifact_type: 'report',
        artifact_id: artifactId,
        output_path: outPath,
      },
      120_000,
    )
    .catch((err) => ({ status: 'error', error: String(err.message).slice(0, 200) }));
  if (dl?.status && dl.status !== 'success') {
    log(`download_artifact failed: ${JSON.stringify(dl).slice(0, 200)}`);
    return null;
  }
  const text = await readFile(outPath, 'utf8').catch(() => null);
  await unlink(outPath).catch(() => {});
  const trimmed = (text ?? '').trim();
  return trimmed.length >= 100 ? trimmed : null;
}

// ─── Global-standard draft template ──────────────────────────────────────────
// Encodes the consulting-grade article anatomy (researched standards): italic
// dek/standfirst → "Önemli Çıkarımlar" key-takeaways block → the report's own
// section hierarchy (H1s demoted; the title lives in its own field) →
// "Metodoloji" transparency block. The server appends "## Kaynaklar" last.

/** ≤60-char SEO title, cut on a word boundary (mirrors server clampMetaTitle). */
function clampMetaTitle(title) {
  const t = title.trim();
  if (t.length <= 60) return t;
  const cut = t.slice(0, 60);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim();
}

/**
 * Strip markdown furniture from a line destined for a takeaway/dek slot:
 * leading quote/list markers, bold/italic/backtick wrappers, stray pipes.
 * Calibration finding: raw report lines leaked `> **"…`, `| Adım | İşlem |`
 * table debris and half-clauses ending in `…: 1.` into the takeaways block.
 */
function sanitizeInline(text) {
  return text
    .replace(/^[\s>*•-]+/, '')
    .replace(/\*\*|__/g, '')
    .replace(/[*`_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** First sentence of a block, ≤140 chars on a word boundary. */
function firstSentence(text) {
  const flat = sanitizeInline(text);
  const m = flat.match(/^.+?[.!?](?=\s|$)/);
  let s = (m ? m[0] : flat).trim();
  // A sentence that ends introducing a list ("…şunlardır: 1.") is half a
  // thought — cut at the colon instead.
  const colonList = s.match(/^(.{30,}?)[:;]\s*\d*\.?\s*$/);
  if (colonList) s = `${colonList[1].trim()}.`;
  if (s.length <= 140) return s;
  const cut = s.slice(0, 140);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 100)).trim()}…`;
}

/** Lines that are table rows / separators carry no prose value. */
function isTableDebris(line) {
  return line.includes('|') || /^[-=\s]+$/.test(line);
}

/**
 * 3-5 key takeaways: prefer an existing summary-like section's bullets,
 * otherwise the first sentence of each ## section.
 */
function extractTakeaways(body) {
  const sections = body.split(/\n(?=##\s)/);
  const summary = sections.find((s) =>
    /^##\s*(önemli|temel|key|sonuç|özet|çıkarım|yönetici)/i.test(s.trim()),
  );
  if (summary) {
    const bullets = [...summary.matchAll(/^[-*]\s+(.{20,})$/gm)]
      .map((m) => m[1])
      .filter((b) => !isTableDebris(b))
      .map((b) => firstSentence(b))
      .filter((b) => b.length >= 30);
    if (bullets.length >= 3) return bullets.slice(0, 5);
  }
  const firsts = sections
    .filter((s) => s.trim().startsWith('##'))
    .map((s) => s.replace(/^##.*\n+/, ''))
    .map((s) =>
      s
        .split('\n')
        .filter((l) => !isTableDebris(l))
        .join('\n'),
    )
    .map((s) => firstSentence(s))
    .filter((s) => s.length >= 30);
  return firsts.length >= 3 ? firsts.slice(0, 5) : [];
}

// Domain → cover library file root (public/insights-covers, P2 assets).
const DOMAIN_COVERS = {
  M_A: { slug: 'm-a', label: 'Birleşme & satın alma' },
  ESG: { slug: 'esg', label: 'Sürdürülebilirlik' },
  FINTECH: { slug: 'fintech', label: 'Fintech' },
  AILE_SIRKETI: { slug: 'aile-sirketi', label: 'Aile şirketi' },
};

function pickCover(job) {
  const entry = DOMAIN_COVERS[job.primaryDomain];
  if (!entry) return null;
  const hash = [...String(job.id)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return { url: `/insights-covers/${entry.slug}-${(hash % 2) + 1}.webp`, label: entry.label };
}

const MODE_LABELS = { deep: 'derin (deep)', fast: 'hızlı (fast)' };

/** Build the rich draft payload purely from NotebookLM outputs. */
function buildDraft(job, report, reportTitle, sources, meta = {}) {
  const titleTr = (reportTitle || job.topic).trim().slice(0, 200);
  const raw = (report || '').trim();

  // The title renders from its own field — drop a leading H1 and demote any
  // stray H1s so the article keeps a single-H1 document outline.
  const body = raw
    .replace(/^#\s+[^\n]+\n+/, '')
    .replace(/^#\s+/gm, '## ')
    .trim();

  const firstPara =
    body
      .split(/\n{2,}/)
      .map((p) => sanitizeInline(p.replace(/^#+\s*/gm, '')))
      .find((p) => p.length >= 40) ?? '';
  const dekBase = firstPara || `${job.topic} üzerine NotebookLM derin araştırma özeti.`;
  const dek = (() => {
    const flat = dekBase.replace(/\s+/g, ' ').trim();
    if (flat.length <= 280) return flat;
    const cut = flat.slice(0, 280);
    return `${cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, cut.lastIndexOf(' '))).trim()}`;
  })();
  const excerptTr = dek.slice(0, 480).padEnd(20, '.');

  const takeaways = body.length >= 100 ? extractTakeaways(body) : [];
  const takeawaysBlock =
    takeaways.length > 0
      ? `## Önemli Çıkarımlar\n\n${takeaways.map((t) => `- ${t}`).join('\n')}\n\n`
      : '';

  const modeLabel = MODE_LABELS[meta.mode] ?? meta.mode ?? 'hızlı (fast)';
  const dateIso = new Date().toISOString().slice(0, 10);
  const methodology =
    `## Metodoloji\n\n` +
    `Bu içerik, ${meta.sourceCount ?? sources.length} kaynaklı NotebookLM ${modeLabel} ` +
    `araştırmasından ${dateIso} tarihinde sentezlenmiştir. Kaynak listesi yazının ` +
    `sonundadır; içerik yayın öncesi insan editör onayından geçer.`;

  const core =
    body.length >= 100
      ? body
      : `NotebookLM araştırması bu konu için ${sources.length} kaynak topladı; rapor metni üretilmedi (fast mode sınırı). Kaynaklar aşağıdadır.`;

  const bodyTrMdx = `*${dek}*\n\n${takeawaysBlock}${core}\n\n${methodology}\n`;

  const cover = pickCover(job);

  return {
    titleTr: titleTr.length >= 5 ? titleTr : `${titleTr} — araştırma`,
    excerptTr,
    bodyTrMdx,
    metaDescTr: excerptTr.slice(0, 160),
    metaTitleTr: clampMetaTitle(titleTr),
    ...(cover
      ? {
          coverImageUrl: cover.url,
          coverImageAlt: `${cover.label} temalı soyut illüstrasyon — ${titleTr}`.slice(0, 125),
        }
      : {}),
    sources,
  };
}

async function processJob(mcp, job) {
  const stage = (status, stageDetail, extra = {}) =>
    patchJob(job.id, { status, stageDetail, ...extra });

  const notebookId = await ensureNotebook(mcp, job);
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
  // "completed" can land with sources but the report text trailing behind
  // (observed live: fast mode, 38s, 10 sources, empty report). Grace re-polls
  // give the report a chance to materialise before we fall back to Studio.
  let reportGraceLeft = 2;
  while (Date.now() < deadline) {
    status = await mcp.tool(
      'research_status',
      { notebook_id: notebookId, max_wait: 60, poll_interval: 20, compact: false },
      90_000,
    );
    if (status?.status === 'error') break;
    if (status?.status === 'completed') {
      if ((status.report || '').trim().length >= 100 || reportGraceLeft-- <= 0) break;
      await stage('RESEARCHING', 'Kaynaklar toplandı — rapor metni bekleniyor');
      await sleep(GRACE_MS);
      continue;
    }
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

  let report = (status.report || '').trim();
  let reportVia = report.length >= 100 ? 'status' : 'yok';
  if (report.length < 100) {
    await stage('DRAFTING', 'Rapor metni status\'ta yok — Studio report sentezleniyor');
    // onTick refreshes the stage row every poll turn: the operator sees live
    // progress AND the job's updatedAt keeps the bridge-alive badge green
    // through a synthesis that can outlast the 120s liveness window.
    const synthesised = await studioReport(mcp, notebookId, job.lang || 'tr', log, (detail) =>
      stage('DRAFTING', detail),
    );
    if (synthesised) {
      report = synthesised;
      reportVia = 'studio-fallback';
    }
  }

  await stage(
    'DRAFTING',
    `Draft hazırlanıyor (notebook ${count ?? '?'} kaynak; ${importNote}; rapor: ${reportVia})`,
    { sourceCount: count ?? undefined },
  );

  const reportTitle =
    (report.split('\n').find((l) => l.startsWith('#')) || '').replace(/^#+\s*/, '') || null;
  const sources = cleanSources(status.sources);
  const draft = buildDraft(job, report, reportTitle, sources, {
    sourceCount: count ?? undefined,
    mode: effectiveMode,
  });

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
  // Stale in-process auth rejects studio_create even while the on-disk token
  // store is valid (`nlm login --check` green). Reloading from disk at boot
  // costs one call and prevents the silent quota-looking studio failures.
  if (info?.auth_status && info.auth_status !== 'configured') {
    const refreshed = await mcp.tool('refresh_auth', {}).catch(() => null);
    log(`refresh_auth → ${refreshed?.status ?? 'failed'} (${refreshed?.message ?? 'no detail'})`);
  }
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
      const msg = String(err.message);
      log('claim failed:', msg.slice(0, 200));
      // 429 carries a retryAfter budget — honor it instead of hammering the
      // limiter every POLL_MS (calibration finding: per-IP general limiter
      // counts the bridge alongside the browser on localhost).
      const retryAfter = msg.includes('429') ? Number(msg.match(/"retryAfter":(\d+)/)?.[1]) : NaN;
      await sleep(Number.isFinite(retryAfter) ? (retryAfter + 1) * 1000 : POLL_MS);
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
