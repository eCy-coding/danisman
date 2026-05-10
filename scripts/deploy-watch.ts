/**
 * Deploy Watcher — Vercel + Render deployment durumu canlı izleyici
 *
 * 60s'de bir poll:
 *   - Vercel API: /v6/deployments (son 5 deploy)
 *   - Render API: /v1/services/<id>/deploys (son 5 deploy)
 *
 * Yeni başarısız deploy → Telegram alert.
 * State değişimi → console log.
 *
 * Token yoksa → graceful skip + uyarı.
 */
import path from 'path';

const POLL_INTERVAL_MS = 60_000;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const VERCEL_PROJECT = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT || '';
const RENDER_API_KEY = process.env.RENDER_API_KEY || '';
const RENDER_SERVICE_ID = process.env.RENDER_SERVICE_ID || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

interface DeployState {
  id: string;
  state: string;
  url?: string;
  createdAt: string;
}

const lastSeenByPlatform = new Map<string, string>();
let stopping = false;
let timer: NodeJS.Timeout | null = null;

function log(level: 'info' | 'warn' | 'error', msg: string): void {
  const stamp = new Date().toISOString().slice(11, 19);
  const tag = level === 'error' ? '✖' : level === 'warn' ? '⚠' : '▶';
  console.log(`[${stamp}] ${tag} deploy-watch: ${msg}`);
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

async function fetchVercelDeploys(): Promise<DeployState[]> {
  if (!VERCEL_TOKEN) return [];
  try {
    const url = VERCEL_PROJECT
      ? `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT}&limit=5`
      : 'https://api.vercel.com/v6/deployments?limit=5';

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      signal: ctrl.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      log('warn', `Vercel API ${res.status}: ${(await res.text().catch(() => '')).slice(0, 100)}`);
      return [];
    }

    const json = (await res.json()) as {
      deployments?: Array<{ uid: string; state: string; url?: string; created: number }>;
    };
    return (json.deployments ?? []).map((d) => ({
      id: d.uid,
      state: d.state,
      url: d.url,
      createdAt: new Date(d.created).toISOString(),
    }));
  } catch (err) {
    log('warn', `Vercel hata: ${(err as Error).message}`);
    return [];
  }
}

async function fetchRenderDeploys(): Promise<DeployState[]> {
  if (!RENDER_API_KEY || !RENDER_SERVICE_ID) return [];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(
      `https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys?limit=5`,
      {
        headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
        signal: ctrl.signal,
      },
    );
    clearTimeout(t);

    if (!res.ok) {
      log('warn', `Render API ${res.status}`);
      return [];
    }

    const json = (await res.json()) as Array<{
      deploy: { id: string; status: string; createdAt: string };
    }>;
    return json.map((item) => ({
      id: item.deploy.id,
      state: item.deploy.status,
      createdAt: item.deploy.createdAt,
    }));
  } catch (err) {
    log('warn', `Render hata: ${(err as Error).message}`);
    return [];
  }
}

async function processDeploys(platform: string, deploys: DeployState[]): Promise<void> {
  if (deploys.length === 0) return;

  const latest = deploys[0];
  if (!latest) return;

  const lastKey = `${platform}:${latest.id}`;
  const lastState = lastSeenByPlatform.get(lastKey);

  if (lastState === latest.state) return; // değişiklik yok

  const stateIcon =
    (
      {
        READY: '✅',
        live: '✅',
        BUILDING: '⏳',
        build_in_progress: '⏳',
        ERROR: '❌',
        build_failed: '❌',
        update_failed: '❌',
        CANCELED: '⊘',
        canceled: '⊘',
      } as Record<string, string>
    )[latest.state] || '•';

  log(
    'info',
    `${stateIcon} ${platform.padEnd(7)} ${latest.id.slice(0, 12)} → ${latest.state}${latest.url ? ` | ${latest.url}` : ''}`,
  );
  lastSeenByPlatform.set(lastKey, latest.state);

  // Failure → Telegram
  if (/error|fail/i.test(latest.state)) {
    await notifyTelegram(
      `🚨 *Deploy Failed* — ${platform}\n\n` +
        `ID: \`${latest.id}\`\n` +
        `Durum: ${latest.state}\n` +
        `Zaman: ${latest.createdAt}\n` +
        (latest.url ? `URL: ${latest.url}` : ''),
    );
  }
}

async function tick(): Promise<void> {
  if (stopping) return;
  const [vercel, render] = await Promise.all([fetchVercelDeploys(), fetchRenderDeploys()]);
  await processDeploys('Vercel', vercel);
  await processDeploys('Render', render);
  timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
}

async function main(): Promise<void> {
  log('info', '🚀 EcyPro Deploy Watcher başlatılıyor...');
  log(
    'info',
    `Vercel: ${VERCEL_TOKEN ? 'aktif' : 'pasif'} | Render: ${RENDER_API_KEY && RENDER_SERVICE_ID ? 'aktif' : 'pasif'}`,
  );
  log('info', `polling her ${POLL_INTERVAL_MS / 1000}s`);

  if (!VERCEL_TOKEN && !RENDER_API_KEY) {
    log('warn', 'Hiçbir deploy provider token yok → idle moda geçiliyor');
    log('warn', '.env.example: VERCEL_TOKEN, VERCEL_PROJECT_ID, RENDER_API_KEY, RENDER_SERVICE_ID');
  }

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

// path import dummy — TS strict mode için (gerekmiyor ama köşe durumlar için)
void path;
