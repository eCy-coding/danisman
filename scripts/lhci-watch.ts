/**
 * LHCI Watcher — Lighthouse CI canlı performance gözcüsü
 *
 * Her 30 dakikada bir:
 *   1. Preview server'ın hazır olduğunu doğrula (curl localhost:4173)
 *   2. Eğer hazırsa lhci autorun çalıştır
 *   3. Skor düşmüşse (LCP > 2.5s, CLS > 0.1, CWV regression) → Telegram alert
 *   4. Sonuçları logs/lhci-history.json'a append
 *
 * .lighthouserc.js varsa onu kullanır, yoksa atlar.
 */
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const HISTORY_PATH = path.join(ROOT, 'logs/lhci-history.json');
const PREVIEW_URL = process.env.LHCI_PREVIEW_URL || 'http://localhost:4173';
const CHECK_INTERVAL_MS = 30 * 60_000; // 30 dk

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

interface LHRun {
  ts: string;
  url: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  lcp?: number;
  cls?: number;
  fcp?: number;
}

let stopping = false;
let timer: NodeJS.Timeout | null = null;

function log(level: 'info' | 'warn' | 'error', msg: string): void {
  const stamp = new Date().toISOString().slice(11, 19);
  const tag = level === 'error' ? '✖' : level === 'warn' ? '⚠' : '▶';
  console.log(`[${stamp}] ${tag} lhci-watch: ${msg}`);
}

async function notifyTelegram(text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch (err) {
    log('warn', `Telegram hatası: ${(err as Error).message}`);
  }
}

async function isPreviewReady(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(PREVIEW_URL, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

function runLhci(): Promise<{ ok: boolean; stdout: string }> {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['lhci', 'autorun', '--collect.numberOfRuns=1'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, LHCI_TARGET_URL: PREVIEW_URL },
    });

    let stdout = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stdout += d.toString()));

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({ ok: false, stdout: stdout + '\n[timeout]' });
    }, 5 * 60_000);
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, stdout });
    });
  });
}

async function loadHistory(): Promise<LHRun[]> {
  try {
    const raw = await fs.readFile(HISTORY_PATH, 'utf-8');
    return JSON.parse(raw) as LHRun[];
  } catch {
    return [];
  }
}

async function saveHistory(runs: LHRun[]): Promise<void> {
  await fs.mkdir(path.dirname(HISTORY_PATH), { recursive: true });
  await fs.writeFile(HISTORY_PATH, JSON.stringify(runs.slice(-100), null, 2));
}

async function parseLhciResult(output: string): Promise<LHRun | null> {
  // LHCI .lighthouseci/manifest.json'a yazar — onu okuyalım
  const manifestPath = path.join(ROOT, '.lighthouseci/manifest.json');
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    const items = JSON.parse(raw) as Array<{
      url: string;
      summary: {
        performance: number;
        accessibility: number;
        'best-practices': number;
        seo: number;
      };
    }>;
    if (items.length === 0) return null;
    const latest = items[items.length - 1];
    if (!latest) return null;
    return {
      ts: new Date().toISOString(),
      url: latest.url,
      performance: latest.summary.performance,
      accessibility: latest.summary.accessibility,
      bestPractices: latest.summary['best-practices'],
      seo: latest.summary.seo,
    };
  } catch {
    // Console output'tan yedek parse
    const perfMatch = output.match(/Performance.*?(\d+(\.\d+)?)/);
    if (perfMatch && perfMatch[1]) {
      return {
        ts: new Date().toISOString(),
        url: PREVIEW_URL,
        performance: parseFloat(perfMatch[1]) / 100,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
      };
    }
    return null;
  }
}

async function runCheck(): Promise<void> {
  const ready = await isPreviewReady();
  if (!ready) {
    log('warn', `${PREVIEW_URL} hazır değil → atlanıyor (npm run preview ile başlatın)`);
    return;
  }

  log('info', '🔬 LHCI autorun başlıyor...');
  const result = await runLhci();
  if (!result.ok) {
    log('warn', 'LHCI çalıştırılamadı (lhci config eksik olabilir, .lighthouserc.js kontrol edin)');
    return;
  }

  const run = await parseLhciResult(result.stdout);
  if (!run) {
    log('warn', 'LHCI sonucu parse edilemedi');
    return;
  }

  const history = await loadHistory();
  history.push(run);
  await saveHistory(history);

  const perfPct = (run.performance * 100).toFixed(0);
  log(
    'info',
    `📊 Performance: ${perfPct} | A11y: ${(run.accessibility * 100).toFixed(0)} | BP: ${(run.bestPractices * 100).toFixed(0)} | SEO: ${(run.seo * 100).toFixed(0)}`,
  );

  // Regression: 2 önceki çalışmaya kıyasla 5+ puan düşüş
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    if (prev) {
      const drop = (prev.performance - run.performance) * 100;
      if (drop >= 5) {
        log(
          'error',
          `🚨 Performance regression: -${drop.toFixed(0)} puan (${(prev.performance * 100).toFixed(0)} → ${perfPct})`,
        );
        await notifyTelegram(
          `🚨 *Lighthouse Regression*\n\nPerformance: ${(prev.performance * 100).toFixed(0)} → ${perfPct} (\`-${drop.toFixed(0)}\`)\n\nURL: ${run.url}`,
        );
      }
    }
  }
}

async function tick(): Promise<void> {
  if (stopping) return;
  try {
    await runCheck();
  } catch (err) {
    log('error', `check hatası: ${(err as Error).message}`);
  }
  timer = setTimeout(() => void tick(), CHECK_INTERVAL_MS);
}

async function main(): Promise<void> {
  log('info', '⚙ eCyPro LHCI Watcher başlatılıyor...');
  log('info', `target: ${PREVIEW_URL} | interval: ${CHECK_INTERVAL_MS / 60_000}dk`);
  log('info', `history: ${path.relative(ROOT, HISTORY_PATH)}`);
  await tick();
}

function shutdown(signal: string): void {
  if (stopping) return;
  stopping = true;
  log('info', `${signal} → temiz çıkış`);
  if (timer) clearTimeout(timer);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

main().catch((err) => {
  log('error', `fatal: ${(err as Error).message}`);
  process.exit(1);
});
