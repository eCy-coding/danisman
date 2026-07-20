/**
 * API Kalibrasyon Testleri — Tüm Servis Bağlantıları
 *
 * Her servisin .env.local'da doğru konfigüre edildiğini doğrular.
 * Gerçek network çağrısı yapmaz (CI-safe) — kod/config kalibrasyon kontrolü.
 *
 * Kapsam:
 *   - Cal.com API key + event type ID + username
 *   - Resend API key + sandbox sender
 *   - Telegram bot token + bot ID
 *   - Logtail source token
 *   - Sentry auth token (CI)
 *   - Gemini API key + OpenAI-compat base URL
 *   - Pexels API key
 *   - JWT secret strength
 *   - Cloudflare Tunnel token
 *   - IndexNow key + verification file
 *   - Crypto secrets (HMAC, TOTP)
 *   - server/lib/telegram.ts var
 *   - bookings.ts Telegram notify wire-up
 *   - server/index.ts Telegram startup notify
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const file of ['.env', '.env.local']) {
    const fp = path.join(ROOT, file);
    if (fs.existsSync(fp)) {
      const parsed = dotenv.parse(fs.readFileSync(fp));
      Object.assign(env, parsed);
    }
  }
  return env;
}

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

const ENV = loadEnv();

// CI (.github/workflows/ci.yml `e2e` job) injects zero secrets into the E2E
// runner — no .env/.env.local is ever present there. These K1-K9 blocks are
// LOCAL-ONLY calibration self-checks that assert live production credential
// VALUES (Cal.com/Resend/Telegram/Sentry/JWT/Logtail/Gemini/Pexels/
// Cloudflare/IndexNow/crypto secrets). They can never pass in CI by design —
// guard each with a documented skip so the suite doesn't permanently red.
// Code/file-content checks (no secret VALUE involved) stay unguarded.
function skipIfMissing(varName: string): void {
  test.skip(
    !ENV[varName],
    `${varName} not present — CI injects no secrets (see ci.yml e2e job); local-only calibration check`,
  );
}

// ─── Cal.com ──────────────────────────────────────────────────────────────────
test.describe('K1 — Cal.com Kalibrasyon', () => {
  test('CAL_COM_API_KEY set ve cal_live_ prefix', () => {
    skipIfMissing('CAL_COM_API_KEY');
    expect(ENV.CAL_COM_API_KEY, 'CAL_COM_API_KEY eksik').toBeTruthy();
    expect(ENV.CAL_COM_API_KEY, 'Cal.com live key formatı yanlış').toMatch(/^cal_live_/);
  });

  test('CAL_COM_EVENT_TYPE_ID numeric set (5599517)', () => {
    skipIfMissing('CAL_COM_EVENT_TYPE_ID');
    expect(ENV.CAL_COM_EVENT_TYPE_ID, 'CAL_COM_EVENT_TYPE_ID eksik').toBeTruthy();
    expect(Number(ENV.CAL_COM_EVENT_TYPE_ID), 'event type ID numeric değil').toBeGreaterThan(0);
    expect(ENV.CAL_COM_EVENT_TYPE_ID).toBe('5599517');
  });

  test('CAL_COM_USERNAME set', () => {
    skipIfMissing('CAL_COM_USERNAME');
    expect(ENV.CAL_COM_USERNAME, 'CAL_COM_USERNAME eksik').toBeTruthy();
    expect(ENV.CAL_COM_USERNAME.length, 'username çok kısa').toBeGreaterThan(3);
  });

  test('CAL_COM_WEBHOOK_SECRET set ve cal_live_ prefix', () => {
    skipIfMissing('CAL_COM_WEBHOOK_SECRET');
    expect(ENV.CAL_COM_WEBHOOK_SECRET, 'CAL_COM_WEBHOOK_SECRET eksik').toBeTruthy();
    expect(ENV.CAL_COM_WEBHOOK_SECRET).toMatch(/^cal_live_/);
  });

  test('calcom-api.ts ENV değişkenlerini okuyor', () => {
    const src = readFile('server/lib/calcom-api.ts');
    expect(src).toContain('CAL_COM_API_KEY');
    expect(src).toContain('CAL_COM_EVENT_TYPE_ID');
    expect(src).toContain('CAL_COM_USERNAME');
  });
});

// ─── Resend Email ─────────────────────────────────────────────────────────────
test.describe('K2 — Resend Email Kalibrasyon', () => {
  test('RESEND_API_KEY set ve re_ prefix', () => {
    skipIfMissing('RESEND_API_KEY');
    expect(ENV.RESEND_API_KEY, 'RESEND_API_KEY eksik').toBeTruthy();
    expect(ENV.RESEND_API_KEY).toMatch(/^re_/);
  });

  test('EMAIL_FROM sandbox veya verified domain kullanıyor', () => {
    skipIfMissing('EMAIL_FROM');
    expect(ENV.EMAIL_FROM, 'EMAIL_FROM eksik').toBeTruthy();
    const validSenders = ['resend.dev', 'ecypro.com'];
    const hasValidDomain = validSenders.some((d) => ENV.EMAIL_FROM.includes(d));
    expect(hasValidDomain, `EMAIL_FROM geçersiz domain: ${ENV.EMAIL_FROM}`).toBeTruthy();
  });

  test('server/lib/email.ts Resend import ediyor', () => {
    const src = readFile('server/lib/email.ts');
    expect(src).toContain("from 'resend'");
    expect(src).toContain('RESEND_API_KEY');
    expect(src).toContain('sendBookingConfirmation');
    expect(src).toContain('sendReminderEmail');
    expect(src).toContain('sendFeedbackRequestEmail');
  });
});

// ─── Telegram ─────────────────────────────────────────────────────────────────
test.describe('K3 — Telegram Bot Kalibrasyon', () => {
  test('TELEGRAM_BOT_TOKEN set ve format geçerli', () => {
    skipIfMissing('TELEGRAM_BOT_TOKEN');
    expect(ENV.TELEGRAM_BOT_TOKEN, 'TELEGRAM_BOT_TOKEN eksik').toBeTruthy();
    expect(ENV.TELEGRAM_BOT_TOKEN).toMatch(/^\d+:[\w-]+$/);
  });

  test('Bot ID doğrulandı (8257133724 = @ecy_agent_crm_bot)', () => {
    skipIfMissing('TELEGRAM_BOT_TOKEN');
    const botId = ENV.TELEGRAM_BOT_TOKEN?.split(':')[0];
    expect(botId).toBe('8257133724');
  });

  test('server/lib/telegram.ts mevcut', () => {
    expect(fileExists('server/lib/telegram.ts'), 'telegram.ts yok').toBeTruthy();
  });

  test('telegram.ts notify, pingBot, notifyNewBooking export ediyor', () => {
    const src = readFile('server/lib/telegram.ts');
    expect(src).toContain('export async function notify');
    expect(src).toContain('export async function pingBot');
    expect(src).toContain('export async function notifyNewBooking');
    expect(src).toContain('export async function notifyServerStart');
    expect(src).toContain('export async function notifyCriticalError');
  });

  test('server/index.ts Telegram startup notify wire-up', () => {
    const src = readFile('server/index.ts');
    expect(src).toContain('notifyServerStart');
    expect(src).toContain('notifyCriticalError');
    expect(src).toContain("from './lib/telegram'");
  });

  test('bookings.ts Telegram notifyNewBooking wire-up', () => {
    const src = readFile('server/routes/bookings.ts');
    expect(src).toContain('notifyNewBooking');
    expect(src).toContain('telegram');
  });

  test('TELEGRAM_CHAT_ID var (boş olabilir — botu /start ile mesajla)', () => {
    const chatId = ENV.TELEGRAM_CHAT_ID;
    if (!chatId) {
      test.info().annotations.push({
        type: 'note',
        description:
          "TELEGRAM_CHAT_ID boş — @ecy_agent_crm_bot botu /start ile mesajla, getUpdates'den chat_id al",
      });
    }
  });
});

// ─── Sentry ───────────────────────────────────────────────────────────────────
test.describe('K4 — Sentry Kalibrasyon', () => {
  test('SENTRY_AUTH_TOKEN set (CI source maps)', () => {
    skipIfMissing('SENTRY_AUTH_TOKEN');
    expect(ENV.SENTRY_AUTH_TOKEN, 'SENTRY_AUTH_TOKEN eksik').toBeTruthy();
    expect(ENV.SENTRY_AUTH_TOKEN).toMatch(/^sntryu_/);
  });

  test("SENTRY_AUTH_TOKEN vite.config.ts'de conditional plugin olarak kullanılıyor", () => {
    const src = readFile('vite.config.ts');
    expect(src).toContain('SENTRY_AUTH_TOKEN');
    expect(src).toContain('sentryVitePlugin');
  });

  test("SENTRY_DSN boş (mock değil) — prod'da doldur", () => {
    const dsn = ENV.SENTRY_DSN ?? '';
    const isMock = dsn.includes('mock') || dsn.includes('o0.ingest');
    expect(isMock, `SENTRY_DSN mock değer içeriyor: ${dsn}`).toBeFalsy();
  });
});

// ─── JWT Secret ───────────────────────────────────────────────────────────────
test.describe('K5 — JWT Secret Kalibrasyon', () => {
  test('JWT_SECRET en az 64 char uzunluğunda', () => {
    skipIfMissing('JWT_SECRET');
    expect(ENV.JWT_SECRET, 'JWT_SECRET eksik').toBeTruthy();
    expect(ENV.JWT_SECRET.length, 'JWT_SECRET çok kısa (min 64 char)').toBeGreaterThanOrEqual(64);
  });

  test('JWT_SECRET default placeholder değil', () => {
    const weak = ['change_me', 'secret', 'password', 'production-jwt-key'];
    const hasWeak = weak.some((w) => ENV.JWT_SECRET?.toLowerCase().includes(w));
    expect(hasWeak, `JWT_SECRET zayıf değer içeriyor`).toBeFalsy();
  });
});

// ─── Logtail ──────────────────────────────────────────────────────────────────
test.describe('K6 — Logtail Kalibrasyon', () => {
  test('LOGTAIL_SOURCE_TOKEN set', () => {
    skipIfMissing('LOGTAIL_SOURCE_TOKEN');
    expect(ENV.LOGTAIL_SOURCE_TOKEN, 'LOGTAIL_SOURCE_TOKEN eksik').toBeTruthy();
    expect(ENV.LOGTAIL_SOURCE_TOKEN.length).toBeGreaterThan(8);
  });

  test('server/config/logger.ts @logtail/node lazy init yapıyor', () => {
    const src = readFile('server/config/logger.ts');
    expect(src).toContain('@logtail/node');
    expect(src).toContain('@logtail/winston');
    expect(src).toContain('LOGTAIL_SOURCE_TOKEN');
    expect(src).toContain('LogtailTransport');
  });
});

// ─── Gemini AI ────────────────────────────────────────────────────────────────
test.describe('K7 — Gemini AI Kalibrasyon', () => {
  test('GEMINI_API_KEY set ve AIza prefix', () => {
    skipIfMissing('GEMINI_API_KEY');
    expect(ENV.GEMINI_API_KEY, 'GEMINI_API_KEY eksik').toBeTruthy();
    expect(ENV.GEMINI_API_KEY).toMatch(/^AIza/);
  });

  test('OPENAI_BASE_URL Gemini compat endpoint', () => {
    skipIfMissing('OPENAI_BASE_URL');
    expect(ENV.OPENAI_BASE_URL).toBe('https://generativelanguage.googleapis.com/v1beta/openai');
  });

  test('OPENAI_MODEL models/gemini- prefix kullanıyor', () => {
    skipIfMissing('OPENAI_MODEL');
    expect(ENV.OPENAI_MODEL, 'OPENAI_MODEL eksik').toBeTruthy();
    expect(ENV.OPENAI_MODEL).toMatch(/^models\/gemini/);
  });

  test('generate-content.ts sequential() helper var (rate limit fix)', () => {
    const src = readFile('scripts/generate-content.ts');
    expect(src).toContain('sequential');
    expect(src).toContain('delayMs');
  });

  test('PEXELS_API_KEY set', () => {
    skipIfMissing('PEXELS_API_KEY');
    expect(ENV.PEXELS_API_KEY, 'PEXELS_API_KEY eksik').toBeTruthy();
    expect(ENV.PEXELS_API_KEY.length).toBeGreaterThan(20);
  });
});

// ─── Cloudflare + IndexNow ────────────────────────────────────────────────────
test.describe('K8a — Cloudflare + IndexNow Kalibrasyon', () => {
  test('TUNNEL_TOKEN set (Cloudflare tunnel)', () => {
    skipIfMissing('TUNNEL_TOKEN');
    expect(ENV.TUNNEL_TOKEN, 'TUNNEL_TOKEN eksik').toBeTruthy();
    expect(ENV.TUNNEL_TOKEN.length).toBeGreaterThan(50);
  });

  test('INDEXNOW_KEY set ve hex format', () => {
    skipIfMissing('INDEXNOW_KEY');
    expect(ENV.INDEXNOW_KEY, 'INDEXNOW_KEY eksik').toBeTruthy();
    expect(ENV.INDEXNOW_KEY).toMatch(/^[0-9a-f]{32}$/i);
  });

  test("IndexNow doğrulama dosyası public/'de mevcut", () => {
    const key = ENV.INDEXNOW_KEY;
    if (key) {
      const verifyFile = path.join(ROOT, 'public', `${key}.txt`);
      expect(fs.existsSync(verifyFile), `public/${key}.txt eksik`).toBeTruthy();
      const content = fs.readFileSync(verifyFile, 'utf-8').trim();
      expect(content, 'Doğrulama dosyası key içermiyor').toBe(key);
    }
  });

  test('scripts/start-tunnel.sh mevcut', () => {
    expect(fileExists('scripts/start-tunnel.sh')).toBeTruthy();
  });
});

// ─── Kripto Secretlar ─────────────────────────────────────────────────────────
test.describe('K8b — Kripto Secret Kalibrasyon', () => {
  test('BOOKING_HMAC_SECRET 64+ char hex', () => {
    skipIfMissing('BOOKING_HMAC_SECRET');
    expect(ENV.BOOKING_HMAC_SECRET, 'BOOKING_HMAC_SECRET eksik').toBeTruthy();
    expect(ENV.BOOKING_HMAC_SECRET.length).toBeGreaterThanOrEqual(64);
    expect(ENV.BOOKING_HMAC_SECRET).toMatch(/^[0-9a-f]+$/i);
  });

  test('TOTP_ENCRYPTION_KEY 64+ char hex', () => {
    skipIfMissing('TOTP_ENCRYPTION_KEY');
    expect(ENV.TOTP_ENCRYPTION_KEY, 'TOTP_ENCRYPTION_KEY eksik').toBeTruthy();
    expect(ENV.TOTP_ENCRYPTION_KEY.length).toBeGreaterThanOrEqual(64);
    expect(ENV.TOTP_ENCRYPTION_KEY).toMatch(/^[0-9a-f]+$/i);
  });

  test('GOOGLE_API_KEY set (AIza prefix)', () => {
    skipIfMissing('GOOGLE_API_KEY');
    expect(ENV.GOOGLE_API_KEY, 'GOOGLE_API_KEY eksik').toBeTruthy();
    expect(ENV.GOOGLE_API_KEY).toMatch(/^AIza/);
  });
});

// ─── Genel Hazırlık Skoru ─────────────────────────────────────────────────────
test.describe('K9 — API Kalibrasyon Hazırlık Skoru', () => {
  test('Kritik servisler konfigüre (Cal.com + Resend + Telegram + Logtail)', () => {
    test.skip(
      Object.keys(ENV).length === 0,
      'No .env/.env.local present — CI injects no secrets (see ci.yml e2e job); local-only calibration readiness score',
    );
    const score: Record<string, boolean> = {
      'Cal.com API Key': !!ENV.CAL_COM_API_KEY?.match(/^cal_live_/),
      'Cal.com Event Type ID': !!ENV.CAL_COM_EVENT_TYPE_ID && Number(ENV.CAL_COM_EVENT_TYPE_ID) > 0,
      'Resend API Key': !!ENV.RESEND_API_KEY?.match(/^re_/),
      'Telegram Bot Token': !!ENV.TELEGRAM_BOT_TOKEN?.match(/^\d+:[\w-]+$/),
      'Logtail Token': !!ENV.LOGTAIL_SOURCE_TOKEN && ENV.LOGTAIL_SOURCE_TOKEN.length > 8,
      'Gemini API Key': !!ENV.GEMINI_API_KEY?.match(/^AIza/),
      'Pexels API Key': !!ENV.PEXELS_API_KEY && ENV.PEXELS_API_KEY.length > 20,
      'JWT Secret (64+)': !!ENV.JWT_SECRET && ENV.JWT_SECRET.length >= 64,
      'IndexNow Key': !!ENV.INDEXNOW_KEY?.match(/^[0-9a-f]{32}$/i),
      'Tunnel Token': !!ENV.TUNNEL_TOKEN && ENV.TUNNEL_TOKEN.length > 50,
    };

    const passed = Object.values(score).filter(Boolean).length;
    const total = Object.keys(score).length;

    const failures = Object.entries(score)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    if (failures.length > 0) {
      test.info().annotations.push({
        type: 'note',
        description: `Eksik: ${failures.join(', ')}`,
      });
    }

    test.info().annotations.push({
      type: 'score',
      description: `📊 API Kalibrasyon Skoru: ${passed}/${total} (${Math.round((passed / total) * 100)}%) | Servisler: ${Object.entries(
        score,
      )
        .map(([k, v]) => `${v ? '✅' : '❌'}${k}`)
        .join(', ')}`,
    });

    expect(passed, `Kritik servisler eksik: ${failures.join(', ')}`).toBeGreaterThanOrEqual(8);
  });
});
