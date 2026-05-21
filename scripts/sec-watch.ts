/**
 * Security Watcher — npm audit + gitleaks + scheduled vuln check
 *
 * Saatlik çalışan kontrol döngüsü:
 *   1. npm audit --audit-level=high (CVE check)
 *   2. gitleaks detect (secret scan, varsa)
 *   3. .env / .env.local secret pattern check (lokal)
 *   4. Sonuçları logs/sec-watch.log'a JSON-line append
 *   5. High+ bulgu → Telegram alert
 *
 * 1. çalışmada baseline kaydeder, sonraki çalışmalarda DELTA bildirir.
 */
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const LOG_PATH = path.join(ROOT, 'logs/sec-watch.log');
const BASELINE_PATH = path.join(ROOT, 'logs/sec-baseline.json');
const CHECK_INTERVAL_MS = 60 * 60_000; // 1 saat

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

interface AuditSummary {
  high: number;
  critical: number;
  moderate: number;
  low: number;
  total: number;
}

interface SecReport {
  ts: string;
  npmAudit: AuditSummary | null;
  gitleaks: { findings: number } | null;
  envSuspicious: number;
}

let stopping = false;
let timer: NodeJS.Timeout | null = null;

function log(level: 'info' | 'warn' | 'error', msg: string): void {
  const stamp = new Date().toISOString().slice(11, 19);
  const tag = level === 'error' ? '✖' : level === 'warn' ? '⚠' : '▶';
  console.log(`[${stamp}] ${tag} sec-watch: ${msg}`);
}

async function appendLog(report: SecReport): Promise<void> {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.appendFile(LOG_PATH, JSON.stringify(report) + '\n');
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
    log('warn', `Telegram bildirim hatası: ${(err as Error).message}`);
  }
}

function runCmd(
  cmd: string,
  args: string[],
  timeoutMs = 60_000,
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({ ok: false, stdout, stderr: stderr + '\n[timeout]' });
    }, timeoutMs);
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, stdout, stderr });
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr: err.message });
    });
  });
}

async function runNpmAudit(): Promise<AuditSummary | null> {
  const { stdout } = await runCmd('npm', ['audit', '--json'], 90_000);
  if (!stdout) return null;
  try {
    const parsed = JSON.parse(stdout) as {
      metadata?: { vulnerabilities?: Record<string, number> };
    };
    const vuln = parsed.metadata?.vulnerabilities ?? {};
    return {
      critical: vuln.critical ?? 0,
      high: vuln.high ?? 0,
      moderate: vuln.moderate ?? 0,
      low: vuln.low ?? 0,
      total: (vuln.critical ?? 0) + (vuln.high ?? 0) + (vuln.moderate ?? 0) + (vuln.low ?? 0),
    };
  } catch {
    return null;
  }
}

async function runGitleaks(): Promise<{ findings: number } | null> {
  // gitleaks varsa çalıştır, yoksa null
  const check = await runCmd('which', ['gitleaks'], 5000);
  if (!check.ok) return null;

  const { stdout } = await runCmd(
    'gitleaks',
    ['detect', '--no-banner', '--report-format', 'json', '--report-path', '/dev/stdout'],
    30_000,
  );
  try {
    const parsed = stdout.trim() ? (JSON.parse(stdout) as unknown[]) : [];
    return { findings: Array.isArray(parsed) ? parsed.length : 0 };
  } catch {
    return { findings: 0 };
  }
}

async function checkEnvFiles(): Promise<number> {
  const SUSPICIOUS = [
    /sk_live_/i,
    /pk_live_/i,
    /AIza[A-Za-z0-9_-]{30,}/,
    /-----BEGIN [A-Z]+ PRIVATE KEY-----/,
  ];
  const candidates = ['.env', '.env.local', '.env.production'];
  let count = 0;
  for (const f of candidates) {
    try {
      const content = await fs.readFile(path.join(ROOT, f), 'utf-8');
      for (const re of SUSPICIOUS) {
        if (re.test(content)) count++;
      }
    } catch {
      /* file yok, ok */
    }
  }
  return count;
}

async function loadBaseline(): Promise<SecReport | null> {
  try {
    const raw = await fs.readFile(BASELINE_PATH, 'utf-8');
    return JSON.parse(raw) as SecReport;
  } catch {
    return null;
  }
}

async function saveBaseline(report: SecReport): Promise<void> {
  await fs.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
  await fs.writeFile(BASELINE_PATH, JSON.stringify(report, null, 2));
}

async function runCheck(): Promise<void> {
  log('info', 'güvenlik taraması başlıyor...');
  const [audit, gitleaks, envSuspicious] = await Promise.all([
    runNpmAudit(),
    runGitleaks(),
    checkEnvFiles(),
  ]);

  const report: SecReport = {
    ts: new Date().toISOString(),
    npmAudit: audit,
    gitleaks,
    envSuspicious,
  };

  await appendLog(report);

  // Baseline ile delta
  const baseline = await loadBaseline();
  const isFirstRun = !baseline;

  const critical =
    (audit?.critical ?? 0) + (audit?.high ?? 0) + (gitleaks?.findings ?? 0) + envSuspicious;
  const baselineCritical = baseline
    ? (baseline.npmAudit?.critical ?? 0) +
      (baseline.npmAudit?.high ?? 0) +
      (baseline.gitleaks?.findings ?? 0) +
      baseline.envSuspicious
    : 0;

  if (audit) {
    log(
      audit.high + audit.critical > 0 ? 'warn' : 'info',
      `npm audit → ${audit.critical} critical, ${audit.high} high, ${audit.moderate} mod, ${audit.low} low`,
    );
  }
  if (gitleaks)
    log(gitleaks.findings > 0 ? 'warn' : 'info', `gitleaks → ${gitleaks.findings} bulgu`);
  if (envSuspicious > 0) log('warn', `env şüpheli pattern: ${envSuspicious} dosyada`);

  if (!isFirstRun && critical > baselineCritical) {
    const delta = critical - baselineCritical;
    log('error', `🚨 Yeni güvenlik bulgusu: +${delta}`);
    await notifyTelegram(
      `🚨 *eCyPro Security Alert*\n\n+${delta} yeni high/critical bulgu tespit edildi.\n\nDetay: \`logs/sec-watch.log\``,
    );
  }

  if (isFirstRun) {
    await saveBaseline(report);
    log('info', '📋 baseline kaydedildi (sonraki çalışmada delta bildirilecek)');
  } else if (critical < baselineCritical) {
    await saveBaseline(report);
    log('info', `✅ baseline iyileşti (${baselineCritical} → ${critical}) → güncellendi`);
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
  log('info', '🔐 eCyPro Security Watcher başlatılıyor...');
  log('info', `kontrol her ${CHECK_INTERVAL_MS / 60_000} dakika`);
  log(
    'info',
    `log: ${path.relative(ROOT, LOG_PATH)} | baseline: ${path.relative(ROOT, BASELINE_PATH)}`,
  );
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
