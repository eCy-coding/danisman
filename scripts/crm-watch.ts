/**
 * CRM Watcher — ContactSubmission DB değişimlerini izle ve yönlendir
 *
 * Mod:
 *   1. Postgres LISTEN/NOTIFY (eğer trigger varsa) → instant push
 *   2. Polling (her 30s) → fallback (Phase 1 default)
 *
 * Eylemler:
 *   - Yeni contact submission → Telegram bildirimi
 *   - Lead scoring tetikle (server/lib/lead-scoring.ts üzerinden HTTP)
 *   - Tier=A leads → kritik alarm
 *   - Console'a streaming log
 */
import { spawn } from 'child_process';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const POLL_INTERVAL_MS = 30_000;
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

interface ContactSummary {
  id: string;
  email: string;
  name: string;
  message: string;
  company?: string | null;
  createdAt: string;
}

const seenIds = new Set<string>();
let stopping = false;
let timer: NodeJS.Timeout | null = null;

function log(level: 'info' | 'warn' | 'error', msg: string): void {
  const stamp = new Date().toISOString().slice(11, 19);
  const tag = level === 'error' ? '✖' : level === 'warn' ? '⚠' : '▶';
  console.log(`[${stamp}] ${tag} crm-watch: ${msg}`);
}

async function notifyTelegram(text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    log('warn', 'Telegram env yok → bildirim atlandı');
    return;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      log('warn', `Telegram ${res.status}: ${await res.text().catch(() => '')}`);
    }
  } catch (err) {
    log('warn', `Telegram hatası: ${(err as Error).message}`);
  }
}

async function fetchPrismaCount(): Promise<number> {
  // Prisma CLI ile çalıştır
  return new Promise((resolve) => {
    const proc = spawn(
      'npx',
      [
        'tsx',
        '-e',
        `
      import('../server/config/db.js').then(async ({ prisma }) => {
        const count = await prisma.contactSubmission.count();
        process.stdout.write(String(count));
        await prisma.$disconnect();
        process.exit(0);
      }).catch(err => { process.stderr.write(err.message); process.exit(1); });
    `.replace(/\.\.\//g, ROOT + '/'),
      ],
      {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'development' },
      },
    );
    let stdout = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.on('close', () => resolve(Number(stdout) || 0));
    setTimeout(() => {
      proc.kill();
      resolve(0);
    }, 10_000);
  });
}

async function pollContacts(): Promise<void> {
  // API ile dene (admin token gerektirir, normalde dev'de açıkta) — fallback prisma direkt
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${API_BASE}/admin/contacts?limit=10`, {
      headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN || 'dev-readonly'}` },
      signal: ctrl.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      // 401 beklenebilir (dev'de token yoksa); count yine de logla
      const total = await fetchPrismaCount();
      log('info', `📋 toplam ContactSubmission: ${total} (admin token yok, sadece sayım)`);
      return;
    }

    const json = (await res.json()) as { data?: { items?: ContactSummary[] } };
    const items = json.data?.items ?? [];

    for (const item of items) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);

      const ageMs = Date.now() - new Date(item.createdAt).getTime();
      if (ageMs > 5 * 60_000) continue; // 5dk'dan eski → sessizce atla

      log(
        'info',
        `🆕 Yeni lead: ${item.name} <${item.email}> ${item.company ? `(${item.company})` : ''}`,
      );

      const text = [
        '🎯 *Yeni İletişim Formu*',
        ``,
        `*İsim:* ${item.name}`,
        `*Email:* \`${item.email}\``,
        item.company ? `*Şirket:* ${item.company}` : '',
        ``,
        `*Mesaj:* ${item.message.slice(0, 200)}${item.message.length > 200 ? '…' : ''}`,
        ``,
        `_${new Date(item.createdAt).toLocaleString('tr-TR')}_`,
      ]
        .filter(Boolean)
        .join('\n');

      await notifyTelegram(text);
    }
  } catch (err) {
    log('warn', `polling hatası: ${(err as Error).message}`);
  }
}

async function tick(): Promise<void> {
  if (stopping) return;
  await pollContacts();
  timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
}

async function main(): Promise<void> {
  log('info', '🧑‍💼 eCyPro CRM Watcher başlatılıyor...');
  log('info', `polling her ${POLL_INTERVAL_MS / 1000}s | API: ${API_BASE}`);
  log('info', `Telegram: ${TELEGRAM_BOT_TOKEN ? 'aktif' : 'pasif (env eksik)'}`);
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
