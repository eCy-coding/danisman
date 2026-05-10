#!/usr/bin/env tsx
/**
 * Service Health CLI — EcyPro
 *
 * Tüm dış servislerin bağlantısını tek komutla kontrol eder.
 * Exit code: 0 = tümü ok/degraded, 1 = en az 1 down
 *
 * Kullanım:
 *   npm run health:check
 *   npx tsx scripts/service-health.ts
 */

import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
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

type Status = 'ok' | 'degraded' | 'down' | 'unconfigured';

interface Check {
  name: string;
  status: Status;
  latencyMs?: number;
  detail?: string;
}

async function withTimeout<T>(p: Promise<T>, ms: number, fb: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fb), ms))]);
}

async function tcpCheck(host: string, port: number, ms = 1500): Promise<Check> {
  const t = Date.now();
  return new Promise((resolve) => {
    const sock = new net.Socket();
    const timer = setTimeout(() => {
      sock.destroy();
      resolve({
        name: `tcp:${host}:${port}`,
        status: 'down',
        latencyMs: Date.now() - t,
        detail: 'timeout',
      });
    }, ms);
    sock.connect(port, host, () => {
      clearTimeout(timer);
      sock.destroy();
      resolve({
        name: `tcp:${host}:${port}`,
        status: 'ok',
        latencyMs: Date.now() - t,
        detail: `${host}:${port}`,
      });
    });
    sock.on('error', (e) => {
      clearTimeout(timer);
      resolve({
        name: `tcp:${host}:${port}`,
        status: 'down',
        latencyMs: Date.now() - t,
        detail: e.message.slice(0, 60),
      });
    });
  });
}

async function httpCheck(
  name: string,
  url: string,
  options?: { headers?: Record<string, string>; ms?: number },
): Promise<Check> {
  const t = Date.now();
  const ms = options?.ms ?? 4000;
  try {
    const r = await withTimeout(
      fetch(url, { headers: options?.headers, signal: AbortSignal.timeout(ms) }),
      ms + 500,
      null,
    );
    if (!r) return { name, status: 'down', latencyMs: Date.now() - t, detail: 'timeout' };
    return {
      name,
      status: r.ok ? 'ok' : 'degraded',
      latencyMs: Date.now() - t,
      detail: `HTTP ${r.status}`,
    };
  } catch (e) {
    return {
      name,
      status: 'down',
      latencyMs: Date.now() - t,
      detail: (e as Error).message.slice(0, 60),
    };
  }
}

function envCheck(name: string, key: string, pattern?: RegExp): Check {
  const val = process.env[key];
  if (!val) return { name, status: 'unconfigured', detail: `${key} not set` };
  if (pattern && !pattern.test(val))
    return { name, status: 'degraded', detail: `${key} format mismatch` };
  return { name, status: 'ok', detail: `${key.slice(0, 4)}****` };
}

// ─── Checks ──────────────────────────────────────────────────────────────────

async function runAll(): Promise<Check[]> {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const pgMatch = dbUrl.match(/@([^/:]+):(\d+)\//);
  const pgHost = pgMatch?.[1] ?? '127.0.0.1';
  const pgPort = parseInt(pgMatch?.[2] ?? '5433', 10);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const calKey = process.env.CAL_COM_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY;
  const baseUrl =
    process.env.OPENAI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai';

  const checks = await Promise.all([
    tcpCheck(pgHost, pgPort, 1500).then((c) => ({ ...c, name: 'PostgreSQL (Docker :5433)' })),

    process.env.REDIS_URL
      ? tcpCheck('127.0.0.1', 6379, 500).then((c) => ({ ...c, name: 'Redis :6379' }))
      : Promise.resolve({ name: 'Redis', status: 'unconfigured' as Status }),

    calKey?.startsWith('cal_live_')
      ? httpCheck('Cal.com API', 'https://api.cal.com/v2/me', {
          headers: { Authorization: `Bearer ${calKey}`, 'cal-api-version': '2024-08-13' },
        })
      : Promise.resolve({
          name: 'Cal.com API',
          status: 'unconfigured' as Status,
          detail: 'CAL_COM_API_KEY not set',
        }),

    botToken
      ? httpCheck('Telegram Bot', `https://api.telegram.org/bot${botToken}/getMe`)
      : Promise.resolve({ name: 'Telegram Bot', status: 'unconfigured' as Status }),

    resendKey?.startsWith('re_')
      ? httpCheck('Resend Email', 'https://api.resend.com/emails', {
          headers: { Authorization: `Bearer ${resendKey}` },
        })
      : Promise.resolve({ name: 'Resend Email', status: 'unconfigured' as Status }),

    envCheck('Logtail/BetterStack', 'LOGTAIL_SOURCE_TOKEN'),
    envCheck('Gemini API Key', 'GEMINI_API_KEY', /^AIza/),
    envCheck('JWT Secret (64+)', 'JWT_SECRET', /.{64}/),
    envCheck('Cal.com API Key', 'CAL_COM_API_KEY', /^cal_live_/),
    envCheck('Cal.com Event ID', 'CAL_COM_EVENT_TYPE_ID', /^\d+$/),
    envCheck('Telegram Chat ID', 'TELEGRAM_CHAT_ID', /^\d+$/),
    envCheck('IndexNow Key', 'INDEXNOW_KEY', /^[0-9a-f]{32}$/i),
    envCheck('Pexels API Key', 'PEXELS_API_KEY'),

    geminiKey?.startsWith('AIza')
      ? httpCheck('Gemini Models', `${baseUrl}/models`, {
          headers: { Authorization: `Bearer ${geminiKey}` },
          ms: 5000,
        })
      : Promise.resolve({ name: 'Gemini Models', status: 'unconfigured' as Status }),

    httpCheck('EcyPro API Health', 'http://localhost:3001/api/health', { ms: 2000 }),
    httpCheck('EcyPro Frontend :5173', 'http://localhost:5173', { ms: 2000 }).then((c) =>
      c.status === 'down'
        ? { ...c, status: 'degraded' as Status, detail: 'dev server kapalı (normal)' }
        : c,
    ),
  ] as Promise<Check>[]);

  return checks;
}

// ─── Report ───────────────────────────────────────────────────────────────────

const ICON: Record<Status, string> = {
  ok: '✅',
  degraded: '⚠️ ',
  down: '❌',
  unconfigured: '⚙️ ',
};

(async () => {
  process.stderr.write('\n🔍 EcyPro Servis Sağlık Kontrolü...\n\n');
  const checks = await runAll();

  let ok = 0,
    warn = 0,
    down = 0,
    unconf = 0;

  for (const c of checks) {
    const icon = ICON[c.status];
    const latency = c.latencyMs !== undefined ? ` (${c.latencyMs}ms)` : '';
    const detail = c.detail ? ` — ${c.detail}` : '';
    process.stderr.write(
      `  ${icon} ${c.name.padEnd(30)}${c.status.toUpperCase().padEnd(14)}${latency}${detail}\n`,
    );

    if (c.status === 'ok') ok++;
    else if (c.status === 'degraded') warn++;
    else if (c.status === 'down') down++;
    else unconf++;
  }

  process.stderr.write(
    `\n📊 Özet: ✅${ok} ⚠️${warn} ❌${down} ⚙️${unconf} / ${checks.length} servis\n`,
  );

  if (down > 0) {
    process.stderr.write(`\n🚨 ${down} kritik servis DOWN — lütfen kontrol edin.\n\n`);
    process.exit(1);
  } else {
    process.stderr.write(`\n✅ Tüm aktif servisler sağlıklı.\n\n`);
    process.exit(0);
  }
})();
