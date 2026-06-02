const REQUIRED = [
  'DATABASE_URL',
  'RESEND_API_KEY',
  'NOTION_API_KEY',
  'NOTION_DB_PROSPECTS',
] as const;
// Sprint 9 P44-T06: env-name drift fix. The Calendly route reads
// `CALENDLY_WEBHOOK_SIGNING_KEY` (canonical, matched in server/config/env.ts
// + server/routes/calendly.ts). The old `CALENDLY_WEBHOOK_SECRET` name only
// lived here, which made the preflight warning misleading: ops who set the
// canonical key still saw "Missing optional ENV", and ops who set the legacy
// key satisfied preflight but boot-time HMAC verification still rejected
// every webhook with 503. Aligning the warning to the canonical key.
const OPTIONAL = [
  'CALENDLY_WEBHOOK_SIGNING_KEY',
  'SENTRY_DSN',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[FATAL] Missing required ENV: ${missing.join(', ')}`);
    process.exit(1);
  }
  OPTIONAL.forEach((k) => {
    if (!process.env[k]) {
      console.warn(`[WARN] Missing optional ENV: ${k}`);
    }
  });
}
