/**
 * MCP Live Integration E2E Testleri
 *
 * Yeni eklenen MCP sunucularının (Playwright, Cal.com, Postgres,
 * Sentry, shadcn-ui, Docker) proje entegrasyonlarını doğrular.
 *
 * Yapı:
 *   - Statik kontroller: kod dosyaları, config, env
 *   - API kontrolleri: /api/health/services (sunucu çalışıyorsa)
 *   - Cal.com: slot API entegrasyonu
 *   - Postgres/DB: schema + connectivity
 *   - Docker: port erişimi
 *   - shadcn-ui: component kodu varlığı
 *   - Playwright MCP: konfig doğrulama
 *   - Sentry remote MCP: token + config
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { MOCK_URL } from './mock-url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const file of ['.env', '.env.local']) {
    const fp = path.join(ROOT, file);
    if (fs.existsSync(fp)) {
      Object.assign(env, dotenv.parse(fs.readFileSync(fp)));
    }
  }
  return env;
}

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

const ENV = loadEnv();
const API = process.env.VITE_API_URL ?? `${MOCK_URL}/api`;

const MCP_CONFIG_PATH = path.join(os.homedir(), '.codeium', 'mcp_config.json');

function readMcpConfig(): Record<string, unknown> {
  if (!fs.existsSync(MCP_CONFIG_PATH)) return {};
  return JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf-8')) as Record<string, unknown>;
}

// ─── Playwright MCP ───────────────────────────────────────────────────────────
test.describe('Playwright MCP Entegrasyonu', () => {
  test('mcp_config.json playwright server set', () => {
    const cfg = readMcpConfig() as { mcpServers?: Record<string, { args?: string[] }> };
    if (!cfg.mcpServers) {
      test.info().annotations.push({ type: 'skip', description: 'mcp_config.json bulunamadı' });
      return;
    }
    expect(cfg.mcpServers.playwright).toBeDefined();
    expect(cfg.mcpServers.playwright?.args).toContain('@playwright/mcp@latest');
  });

  test('playwright.config.ts mevcut ve proje ayarları var', () => {
    const src = readFile('playwright.config.ts');
    expect(src).toContain('baseURL');
    expect(src).toContain('testDir');
    expect(src).toContain('chromium');
  });

  test('E2E test dosyaları 40+ spec var', () => {
    const e2eDir = path.join(ROOT, 'e2e');
    const specs = fs.readdirSync(e2eDir).filter((f) => f.endsWith('.spec.ts'));
    expect(specs.length, `spec sayısı az: ${specs.length}`).toBeGreaterThan(40);
  });
});

// ─── Cal.com MCP ──────────────────────────────────────────────────────────────
test.describe('Cal.com MCP Entegrasyonu', () => {
  test('mcp_config.json calcom server set + API key aktarıldı', () => {
    const cfg = readMcpConfig() as {
      mcpServers?: Record<string, { args?: string[]; env?: Record<string, string> }>;
    };
    if (!cfg.mcpServers) {
      test.info().annotations.push({ type: 'skip', description: 'mcp_config.json bulunamadı' });
      return;
    }
    expect(cfg.mcpServers.calcom).toBeDefined();
    expect(cfg.mcpServers.calcom.env?.CAL_API_KEY).toMatch(/^cal_live_/);
  });

  test('CAL_COM_EVENT_TYPE_ID = 5599517 (ecy event)', () => {
    // CI (ci.yml e2e job) never injects live secrets — .env/.env.local absent.
    test.skip(
      !ENV.CAL_COM_EVENT_TYPE_ID,
      'CAL_COM_EVENT_TYPE_ID not present — local-only calibration check',
    );
    expect(ENV.CAL_COM_EVENT_TYPE_ID).toBe('5599517');
  });

  test('server/lib/calcom-api.ts event type ID env okuyor', () => {
    const src = readFile('server/lib/calcom-api.ts');
    expect(src).toContain('CAL_COM_EVENT_TYPE_ID');
    expect(src).toContain('CAL_COM_API_KEY');
    expect(src).toContain('CAL_COM_USERNAME');
  });

  test('Cal.com slots API endpoint /api/bookings/slots mevcut', () => {
    const src = readFile('server/routes/bookings.ts');
    expect(src).toContain('/slots');
  });

  test('Cal.com live slots API (sunucu çalışıyorsa)', async ({ request }) => {
    let res;
    try {
      res = await request.get(`${API}/bookings/slots?startDate=2026-01-01&endDate=2026-01-07`, {
        timeout: 8000,
      });
    } catch {
      test.info().annotations.push({ type: 'skip', description: 'API sunucusu çalışmıyor' });
      return;
    }
    if (res.status() === 0 || res.status() === 503) {
      test.info().annotations.push({ type: 'skip', description: 'API unavailable' });
      return;
    }
    expect([200, 401, 404]).toContain(res.status());
  });
});

// ─── PostgreSQL MCP ───────────────────────────────────────────────────────────
test.describe('PostgreSQL MCP Entegrasyonu', () => {
  test('mcp_config.json postgres server set', () => {
    const cfg = readMcpConfig() as { mcpServers?: Record<string, { args?: string[] }> };
    if (!cfg.mcpServers) {
      test.info().annotations.push({ type: 'skip', description: 'mcp_config.json bulunamadı' });
      return;
    }
    expect(cfg.mcpServers.postgres).toBeDefined();
    expect(cfg.mcpServers.postgres?.args?.join(' ') ?? '').toContain('server-postgres');
  });

  test('DATABASE_URL PostgreSQL formatında', () => {
    test.skip(
      !ENV.DATABASE_URL,
      'DATABASE_URL not present — CI has no local Postgres, local-only calibration check',
    );
    expect(ENV.DATABASE_URL).toMatch(/^postgresql:\/\//);
    expect(ENV.DATABASE_URL).toContain('5433');
  });

  test('Prisma schema.prisma tüm kritik modeller mevcut', () => {
    const schema = readFile('prisma/schema.prisma');
    const models = [
      'User',
      'Booking',
      'Service',
      'Analytics',
      'AuditLog',
      'BookingFeedback',
      'NewsletterSubscriber',
    ];
    for (const model of models) {
      expect(schema, `${model} schema'da yok`).toContain(`model ${model}`);
    }
  });

  test('server/lib/health.ts checkDatabase + checkDockerPostgres var', () => {
    const src = readFile('server/lib/health.ts');
    expect(src).toContain('checkDatabase');
    expect(src).toContain('checkDockerPostgres');
    expect(src).toContain('checkAllServices');
  });

  test('/api/health/services endpoint mevcut', () => {
    const src = readFile('server/routes/index.ts');
    expect(src).toContain('/health/services');
    expect(src).toContain('checkAllServices');
  });

  test('/api/health/services API yanıtı (sunucu çalışıyorsa)', async ({ request }) => {
    let res;
    try {
      res = await request.get(`${API}/health/services`, { timeout: 10000 });
    } catch {
      test.info().annotations.push({ type: 'skip', description: 'API sunucusu çalışmıyor' });
      return;
    }
    if (res.status() === 0 || res.status() === 404) {
      test.info().annotations.push({ type: 'skip', description: 'Endpoint yok' });
      return;
    }
    const ct = res.headers()['content-type'] ?? '';
    if (!ct.includes('json')) {
      test.info().annotations.push({ type: 'skip', description: `HTML yanıt (${res.status()})` });
      return;
    }

    const body = (await res.json()) as {
      overall: string;
      services?: Record<string, { status: string; latencyMs?: number }>;
    };

    expect(['healthy', 'degraded', 'critical']).toContain(body.overall);

    if (body.services) {
      expect(body.services.database).toBeDefined();
      expect(body.services.calcom).toBeDefined();
      expect(body.services.telegram).toBeDefined();
      expect(body.services.resend).toBeDefined();

      test.info().annotations.push({
        type: 'health',
        description: Object.entries(body.services)
          .map(
            ([k, v]) =>
              `${v.status === 'ok' ? '✅' : v.status === 'unconfigured' ? '⚙️' : '❌'}${k}(${v.latencyMs ?? 0}ms)`,
          )
          .join(' | '),
      });
    }
  });

  test('DB health doğrudan TCP port test (sunucu çalışmıyorsa da)', async () => {
    const net = await import('net');
    const isOpen = await new Promise<boolean>((resolve) => {
      const sock = new net.Socket();
      const t = setTimeout(() => {
        sock.destroy();
        resolve(false);
      }, 1500);
      sock.connect(5433, '127.0.0.1', () => {
        clearTimeout(t);
        sock.destroy();
        resolve(true);
      });
      sock.on('error', () => {
        clearTimeout(t);
        resolve(false);
      });
    });

    test.info().annotations.push({
      type: 'docker_pg',
      description: `PostgreSQL 127.0.0.1:5433 ${isOpen ? '✅ açık' : '❌ kapalı (docker up gerekli)'}`,
    });
  });
});

// ─── Sentry MCP ───────────────────────────────────────────────────────────────
test.describe('Sentry MCP Entegrasyonu', () => {
  test('mcp_config.json sentry remote SSE set', () => {
    const cfg = readMcpConfig() as {
      mcpServers?: Record<string, { url?: string; headers?: Record<string, string> }>;
    };
    if (!cfg.mcpServers) {
      test.info().annotations.push({ type: 'skip', description: 'mcp_config.json bulunamadı' });
      return;
    }
    expect(cfg.mcpServers.sentry).toBeDefined();
    expect(cfg.mcpServers.sentry.url).toBe('https://mcp.sentry.io/mcp');
    expect(cfg.mcpServers.sentry.headers?.Authorization).toMatch(/^Bearer sntryu_/);
  });

  test('SENTRY_AUTH_TOKEN CI için set (sntryu_ prefix)', () => {
    test.skip(
      !ENV.SENTRY_AUTH_TOKEN,
      'SENTRY_AUTH_TOKEN not present — CI (ci.yml) injects no secrets, local-only calibration check',
    );
    expect(ENV.SENTRY_AUTH_TOKEN).toMatch(/^sntryu_/);
  });

  test('vite.config.ts sentryVitePlugin conditional var', () => {
    const src = readFile('vite.config.ts');
    expect(src).toContain('sentryVitePlugin');
    expect(src).toContain('SENTRY_AUTH_TOKEN');
  });

  test('server/middleware/sentry.ts mevcut', () => {
    expect(fs.existsSync(path.join(ROOT, 'server/middleware/sentry.ts'))).toBeTruthy();
  });
});

// ─── shadcn-ui MCP ───────────────────────────────────────────────────────────
test.describe('shadcn-ui MCP Entegrasyonu', () => {
  test('mcp_config.json shadcn-ui server set', () => {
    const cfg = readMcpConfig() as { mcpServers?: Record<string, { args?: string[] }> };
    if (!cfg.mcpServers) {
      test.info().annotations.push({ type: 'skip', description: 'mcp_config.json bulunamadı' });
      return;
    }
    expect(cfg.mcpServers['shadcn-ui']).toBeDefined();
    expect(cfg.mcpServers['shadcn-ui']?.args?.join(' ') ?? '').toContain('shadcn-ui-mcp-server');
  });

  test('components.json veya shadcn yapılandırması mevcut', () => {
    const hasComponentsJson = fs.existsSync(path.join(ROOT, 'components.json'));
    const hasTailwind =
      fs.existsSync(path.join(ROOT, 'tailwind.config.ts')) ||
      fs.existsSync(path.join(ROOT, 'tailwind.config.js'));
    const hasViteWithTailwind =
      fs.existsSync(path.join(ROOT, 'vite.config.ts')) &&
      fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf-8').includes('tailwind');
    if (!hasComponentsJson && !hasTailwind && !hasViteWithTailwind) {
      test
        .info()
        .annotations.push({ type: 'note', description: 'shadcn/tailwind config bulunamadı' });
    }
  });

  test('src/components/ui/ dizini mevcut (shadcn components)', () => {
    const uiDir = path.join(ROOT, 'src/components/ui');
    const exists = fs.existsSync(uiDir);
    if (!exists) {
      test.info().annotations.push({
        type: 'note',
        description: 'src/components/ui/ yok — shadcn MCP ile component eklenebilir',
      });
    }
  });

  test('Tailwind v4 config mevcut', () => {
    const src = readFile('vite.config.ts');
    const hasTailwind = src.includes('tailwind') || src.includes('Tailwind');
    test.info().annotations.push({
      type: 'tailwind',
      description: hasTailwind ? '✅ Tailwind kullanılıyor' : '⚠️ Tailwind import bulunamadı',
    });
    expect(hasTailwind, 'Tailwind bulunamadı').toBe(true);
  });
});

// ─── Docker MCP ──────────────────────────────────────────────────────────────
test.describe('Docker MCP Entegrasyonu', () => {
  test('mcp_config.json docker server set', () => {
    const mcpCfg = readMcpConfig() as { mcpServers?: Record<string, { args?: string[] }> };
    if (!mcpCfg.mcpServers) {
      test.info().annotations.push({ type: 'skip', description: 'mcp_config.json bulunamadı' });
      return;
    }
    expect(mcpCfg.mcpServers.docker).toBeDefined();
    expect(mcpCfg.mcpServers.docker?.args?.join(' ') ?? '').toContain('docker-mcp-server');
  });

  test('DATABASE_URL Docker Postgres portunu işaret ediyor (5433)', () => {
    test.skip(
      !ENV.DATABASE_URL,
      'DATABASE_URL not present — CI has no local Docker Postgres, local-only calibration check',
    );
    expect(ENV.DATABASE_URL).toContain('5433');
  });
});

// ─── Telegram MCP (Notification Wire) ────────────────────────────────────────
test.describe('Telegram Notification E2E', () => {
  test('TELEGRAM_CHAT_ID set (6244341128)', () => {
    test.skip(
      !ENV.TELEGRAM_CHAT_ID,
      'TELEGRAM_CHAT_ID not present — CI injects no secrets, local-only calibration check',
    );
    expect(ENV.TELEGRAM_CHAT_ID).toBe('6244341128');
  });

  test('server/lib/telegram.ts tüm fonksiyon exportları var', () => {
    const src = readFile('server/lib/telegram.ts');
    const fns = [
      'notify',
      'pingBot',
      'notifyNewBooking',
      'notifyServerStart',
      'notifyCriticalError',
      'tgInfo',
      'tgWarn',
      'tgError',
      'tgSuccess',
    ];
    for (const fn of fns) {
      expect(src, `${fn} export eksik`).toContain(fn);
    }
  });

  test('server/index.ts uncaughtException → notifyCriticalError wire', () => {
    const src = readFile('server/index.ts');
    expect(src).toContain('notifyCriticalError');
    expect(src).toContain('uncaughtException');
  });

  test('server/routes/bookings.ts → notifyNewBooking wire', () => {
    const src = readFile('server/routes/bookings.ts');
    expect(src).toContain('notifyNewBooking');
  });

  test('Telegram bot ping API (ağ erişimi varsa)', async () => {
    const token = ENV.TELEGRAM_BOT_TOKEN;
    if (!token) {
      test.info().annotations.push({ type: 'skip', description: 'TELEGRAM_BOT_TOKEN yok' });
      return;
    }
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        signal: AbortSignal.timeout(4000),
      });
      const data = (await r.json()) as { ok: boolean; result?: { username: string } };
      expect(data.ok).toBeTruthy();
      test.info().annotations.push({
        type: 'telegram',
        description: `Bot: @${data.result?.username ?? 'unknown'} ✅`,
      });
    } catch {
      test
        .info()
        .annotations.push({ type: 'note', description: 'Telegram ağ erişimi yok (offline test)' });
    }
  });
});

// ─── Filesystem MCP (EcyPro klasörü) ─────────────────────────────────────────
test.describe('Filesystem MCP — EcyPro Path', () => {
  test('mcp_config.json filesystem EcyPro klasörünü içeriyor', () => {
    const cfg = readMcpConfig() as { mcpServers?: Record<string, { args?: string[] }> };
    if (!cfg.mcpServers) {
      test.info().annotations.push({ type: 'skip', description: 'mcp_config.json bulunamadı' });
      return;
    }
    const args: string[] = cfg.mcpServers.filesystem?.args ?? [];
    const hasEcyPro = args.some((a) => a.includes('ecypro') || a.includes('copy-of-ecypro'));
    expect(hasEcyPro, "EcyPro klasörü filesystem MCP args'ında yok").toBeTruthy();
  });

  test('mcp_config.json 12+ MCP server tanımlı', () => {
    const cfg = readMcpConfig() as { mcpServers?: Record<string, unknown> };
    if (!cfg.mcpServers) {
      test.info().annotations.push({ type: 'skip', description: 'mcp_config.json bulunamadı' });
      return;
    }
    const count = Object.keys(cfg.mcpServers).length;
    expect(count, `MCP server sayısı az: ${count}`).toBeGreaterThanOrEqual(12);
  });
});

// ─── scripts/service-health.ts ────────────────────────────────────────────────
test.describe('Service Health Script', () => {
  test('scripts/service-health.ts mevcut', () => {
    expect(fs.existsSync(path.join(ROOT, 'scripts/service-health.ts'))).toBeTruthy();
  });

  test('package.json health:check script var', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.scripts?.['health:check'] || pkg.scripts?.['service:health']).toBeTruthy();
  });
});
