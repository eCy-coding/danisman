const REQUIRED = [
  'DATABASE_URL',
  'RESEND_API_KEY',
  'NOTION_API_KEY',
  'NOTION_DB_PROSPECTS',
] as const;
const OPTIONAL = [
  'CALENDLY_WEBHOOK_SECRET',
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
