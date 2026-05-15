/**
 * BE-2 — Production env validation (Zod)
 *
 * Tek doğru env kaynağı. `server/env.ts` içindeki dotenv loader
 * `process.env`'i doldurduktan SONRA bu modül import edilirse,
 * Zod schema validation çalıştırır ve fail-fast davranır:
 *
 *   - Production'da eksik/hatalı env → process.exit(1)
 *   - Test/dev'de eksik env → uyarı + güvenli default'lar
 *
 * Kullanım:
 *   import { env } from './config/env';
 *   const port = env.PORT;
 *
 * Mevcut `process.env.X` okuyan kodlar değişmeden çalışmaya
 * devam eder; bu modül sadece bir tip-güvenli erişim katmanı + boot-time guard.
 */

import { z } from 'zod';

// ─── Schema ───────────────────────────────────────────────

const NodeEnv = z.enum(['development', 'test', 'production']);

const envSchema = z.object({
  // ── Required (her zaman) ────────────────────────────────
  NODE_ENV: NodeEnv.default('development'),
  PORT: z
    .string()
    .default('3001')
    .transform((v) => Number.parseInt(v, 10))
    .pipe(z.number().int().min(1).max(65535)),

  // ── Required in production ──────────────────────────────
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid Postgres URL (postgresql://...)')
    .startsWith('postgres', 'DATABASE_URL must use postgres:// or postgresql:// scheme')
    .optional(),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters in production')
    .optional(),
  CORS_ORIGIN: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),

  // ── Optional knobs ──────────────────────────────────────
  JWT_EXPIRES_IN: z.string().default('7d'),
  TRUST_PROXY: z.string().default('1'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),

  REDIS_URL: z.string().url().optional(),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
  RATE_LIMIT_MAX: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : undefined))
    .pipe(z.number().int().positive().optional()),

  // ── Optional integrations ───────────────────────────────
  LOGTAIL_SOURCE_TOKEN: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  CALCOM_API_KEY: z.string().optional(),
  CALCOM_EVENT_TYPE_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  GEMINI_API_KEY: z.string().optional(),
  WEBHOOK_HMAC_SECRET: z.string().optional(),
  HIBP_API_KEY: z.string().optional(),

  // ── Release / observability ─────────────────────────────
  npm_package_version: z.string().optional(),
  RELEASE_VERSION: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// ─── Production-specific extra requirements ───────────────

const productionRequiredKeys = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'] as const;

// ─── Validate ─────────────────────────────────────────────

function format(issues: z.ZodIssue[]): string {
  return issues
    .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
}

function validate(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const lines = [
      '[env] FATAL — environment validation failed:',
      format(parsed.error.issues),
    ].join('\n');
    // eslint-disable-next-line no-console
    console.error(lines);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // Non-prod: surface but do not exit. Strip the offending fields so the
    // relaxed re-parse cannot rethrow on the same Zod issues (every offending
    // field in this schema is .optional() — removing it is safe in dev/test).
    const cleaned: Record<string, string | undefined> = { ...process.env };
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') delete cleaned[key];
    }
    cleaned.NODE_ENV = 'development';
    return envSchema.parse(cleaned);
  }
  const data = parsed.data;

  if (data.NODE_ENV === 'production') {
    const missing = productionRequiredKeys.filter((k) => !data[k]);
    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        `[env] FATAL — production requires: ${missing.join(', ')} (currently missing or empty)`,
      );
      process.exit(1);
    }
  }

  return data;
}

export const env: Env = validate();

// Convenience guards (read-only)
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDev = env.NODE_ENV === 'development';
