/**
 * Multi-Service Health Checker — eCyPro
 *
 * Async-checks all critical external services in parallel with timeouts.
 * Used by /api/health/services endpoint.
 *
 * Services checked:
 *   database   — Prisma $queryRaw SELECT 1 (1.5s timeout)
 *   redis      — Redis PING (500ms timeout, optional)
 *   calcom     — Cal.com v2 /event-types (3s timeout)
 *   telegram   — Telegram getMe (3s timeout)
 *   resend     — Resend /domains (3s timeout)
 *   logtail    — Token presence check (instant)
 *   gemini     — OpenAI-compat /models (3s timeout)
 *   docker_pg  — TCP socket to 127.0.0.1:5433 (1s timeout)
 */

import * as net from 'net';
import { prisma } from '../config/db';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

export type ServiceStatus = 'ok' | 'degraded' | 'down' | 'unconfigured';

export interface ServiceCheck {
  status: ServiceStatus;
  latencyMs?: number;
  detail?: string;
}

export interface HealthReport {
  overall: 'healthy' | 'degraded' | 'critical';
  checkedAt: string;
  services: Record<string, ServiceCheck>;
}

// ─── Timeout helper ──────────────────────────────────────────────────────────

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function measure<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const t = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - t };
}

// ─── Individual checks ────────────────────────────────────────────────────────

async function checkDatabase(): Promise<ServiceCheck> {
  try {
    const { result, ms } = await measure(() =>
      withTimeout(
        prisma.$queryRaw`SELECT 1`.then(() => 'ok' as const),
        1500,
        'down' as const,
      ),
    );
    return { status: result, latencyMs: ms };
  } catch (err) {
    logger.warn('[Health] DB check failed', { message: (err as Error).message });
    return { status: 'down', detail: (err as Error).message.slice(0, 80) };
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  try {
    const { result, ms } = await measure(() =>
      withTimeout(
        redis.ping().then(() => 'ok' as const),
        500,
        'degraded' as const,
      ),
    );
    return { status: result, latencyMs: ms };
  } catch {
    return { status: 'degraded', detail: 'Redis unavailable (optional)' };
  }
}

async function checkCalCom(): Promise<ServiceCheck> {
  const apiKey = process.env.CAL_COM_API_KEY;
  if (!apiKey?.startsWith('cal_live_')) {
    return { status: 'unconfigured', detail: 'CAL_COM_API_KEY not set' };
  }
  try {
    const { result, ms } = await measure(async () => {
      const r = await withTimeout(
        fetch('https://api.cal.com/v2/me', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'cal-api-version': '2024-08-13',
          },
          signal: AbortSignal.timeout(3000),
        }),
        3500,
        null,
      );
      if (!r) return 'down' as const;
      return r.ok ? ('ok' as const) : ('degraded' as const);
    });
    return { status: result, latencyMs: ms };
  } catch (err) {
    return { status: 'down', detail: (err as Error).message.slice(0, 80) };
  }
}

async function checkTelegram(): Promise<ServiceCheck> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { status: 'unconfigured', detail: 'TELEGRAM_BOT_TOKEN not set' };
  }
  try {
    const { result, ms } = await measure(async () => {
      const r = await withTimeout(
        fetch(`https://api.telegram.org/bot${token}/getMe`, {
          signal: AbortSignal.timeout(3000),
        }),
        3500,
        null,
      );
      if (!r) return { status: 'down' as const, username: undefined };
      const data = (await r.json()) as { ok: boolean; result?: { username: string } };
      return {
        status: data.ok ? ('ok' as const) : ('degraded' as const),
        username: data.result?.username,
      };
    });
    return {
      status: result.status,
      latencyMs: ms,
      detail: result.username ? `@${result.username}` : undefined,
    };
  } catch (err) {
    return { status: 'down', detail: (err as Error).message.slice(0, 80) };
  }
}

async function checkResend(): Promise<ServiceCheck> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey?.startsWith('re_')) {
    return { status: 'unconfigured', detail: 'RESEND_API_KEY not set' };
  }
  try {
    const { result, ms } = await measure(async () => {
      const r = await withTimeout(
        fetch('https://api.resend.com/emails', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(3000),
        }),
        3500,
        null,
      );
      if (!r) return { status: 'down' as const, code: 0 };
      return { status: r.ok ? ('ok' as const) : ('degraded' as const), code: r.status };
    });
    const detail =
      result.code === 401
        ? 'sandbox key — ecypro.com domain verify gerekli'
        : result.code > 0
          ? `HTTP ${result.code}`
          : undefined;
    return { status: result.status, latencyMs: ms, detail };
  } catch (err) {
    return { status: 'down', detail: (err as Error).message.slice(0, 80) };
  }
}

async function checkLogtail(): Promise<ServiceCheck> {
  const token = process.env.LOGTAIL_SOURCE_TOKEN;
  if (!token || token.length < 8) {
    return { status: 'unconfigured', detail: 'LOGTAIL_SOURCE_TOKEN not set' };
  }
  return { status: 'ok', detail: `token: ${token.slice(0, 4)}****` };
}

async function checkGemini(): Promise<ServiceCheck> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey?.startsWith('AIza')) {
    return { status: 'unconfigured', detail: 'GEMINI_API_KEY not set' };
  }
  const baseUrl =
    process.env.OPENAI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai';
  try {
    const { result, ms } = await measure(async () => {
      const r = await withTimeout(
        fetch(`${baseUrl}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(3000),
        }),
        3500,
        null,
      );
      if (!r) return 'down' as const;
      return r.ok ? ('ok' as const) : ('degraded' as const);
    });
    return { status: result, latencyMs: ms };
  } catch (err) {
    return { status: 'down', detail: (err as Error).message.slice(0, 80) };
  }
}

async function checkDockerPostgres(): Promise<ServiceCheck> {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const match = dbUrl.match(/@([^/:]+):(\d+)\//);
  const host = match?.[1] ?? '127.0.0.1';
  const port = parseInt(match?.[2] ?? '5433', 10);

  return new Promise((resolve) => {
    const t = Date.now();
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ status: 'down', latencyMs: Date.now() - t, detail: `${host}:${port} timeout` });
    }, 1000);

    socket.connect(port, host, () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({ status: 'ok', latencyMs: Date.now() - t, detail: `${host}:${port}` });
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ status: 'down', latencyMs: Date.now() - t, detail: err.message.slice(0, 60) });
    });
  });
}

// ─── Main health check ────────────────────────────────────────────────────────

export async function checkAllServices(): Promise<HealthReport> {
  const [database, redis_check, calcom, telegram, resend, logtail, gemini, docker_pg] =
    await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkCalCom(),
      checkTelegram(),
      checkResend(),
      checkLogtail(),
      checkGemini(),
      checkDockerPostgres(),
    ]);

  const services: Record<string, ServiceCheck> = {
    database,
    redis: redis_check,
    calcom,
    telegram,
    resend,
    logtail,
    gemini,
    docker_pg,
  };

  const statuses = Object.values(services).map((s) => s.status);
  const critical = statuses.filter((s) => s === 'down').length;
  const degraded = statuses.filter((s) => s === 'degraded').length;

  const overall: HealthReport['overall'] =
    critical > 0 ? 'critical' : degraded > 0 ? 'degraded' : 'healthy';

  return {
    overall,
    checkedAt: new Date().toISOString(),
    services,
  };
}
