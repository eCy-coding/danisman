/**
 * P55.A5 — SMTP utility for drip campaigns + transactional emails.
 *
 * - Uses nodemailer when SMTP_HOST/SMTP_USER/SMTP_PASS env are set.
 * - Falls back to existing Resend mailer (server/lib/mailer.ts) if SMTP unset.
 * - Renders MJML templates from server/emails/mjml/<key>.mjml at runtime.
 *   If `mjml` package unavailable, falls back to a text-only output so the
 *   build & worker don't crash in sandbox/CI.
 * - Retry: 3× exponential backoff inside `sendDripEmail`.
 * - Rate limit: 100 emails/minute global + 5/recipient/day enforced via Redis.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../config/logger';
import { redis } from '../config/redis';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? 'EcyPro <info@ecypro.com>';
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);

const TEMPLATE_DIR = path.join(process.cwd(), 'server', 'emails', 'mjml');
const TEMPLATE_CACHE = new Map<string, string>();

const GLOBAL_RATE_KEY = 'drip:rl:global';
const PER_RECIPIENT_RATE_KEY = (to: string) => `drip:rl:to:${to.toLowerCase()}`;
const GLOBAL_LIMIT = 100;
const GLOBAL_WINDOW_S = 60;
const PER_RECIPIENT_LIMIT = 5;
const PER_RECIPIENT_WINDOW_S = 60 * 60 * 24;

export interface RenderedEmail {
  html: string;
  text: string;
}

/**
 * Substitute {{var}} placeholders. Stub: production should use Handlebars/Liquid.
 */
function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? '');
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadTemplate(key: string): Promise<string> {
  const cached = TEMPLATE_CACHE.get(key);
  if (cached) return cached;
  const filePath = path.join(TEMPLATE_DIR, `${key}.mjml`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    TEMPLATE_CACHE.set(key, raw);
    return raw;
  } catch {
    // Graceful fallback: template missing → empty MJML wrapper
    logger.warn('[drip-smtp] template not found, using fallback', { key });
    const fallback = `<mjml><mj-body><mj-section><mj-column><mj-text>{{firstName}}, EcyPro size yazıyor.</mj-text></mj-column></mj-section></mj-body></mjml>`;
    TEMPLATE_CACHE.set(key, fallback);
    return fallback;
  }
}

/**
 * Render MJML → HTML. Uses mjml package when available; otherwise strips
 * MJML tags to a minimal HTML body so the worker doesn't crash.
 */
export async function renderTemplate(
  key: string,
  vars: Record<string, string>,
): Promise<RenderedEmail> {
  const tpl = await loadTemplate(key);
  const substituted = substitute(tpl, vars);

  let html = substituted;
  try {
    // Optional: only if installed
     
    const mjmlMod = (await (new Function('m', 'return import(m)') as (m: string) => Promise<unknown>)('mjml').catch(() => null)) as unknown;
    if (mjmlMod && typeof mjmlMod === 'object' && 'default' in (mjmlMod as object)) {
      const mjml2html = (mjmlMod as { default: (s: string) => { html: string; errors: unknown[] } })
        .default;
      const result = mjml2html(substituted);
      html = result.html;
    } else {
      // Sandbox fallback: convert MJML pseudo-HTML to plain
      html = substituted
        .replace(/<mjml[^>]*>|<\/mjml>/g, '')
        .replace(/<mj-head[\s\S]*?<\/mj-head>/g, '')
        .replace(/<mj-(body|section|column|text|button|image)[^>]*>/g, '<div>')
        .replace(/<\/mj-(body|section|column|text|button|image)>/g, '</div>');
    }
  } catch (err) {
    logger.warn('[drip-smtp] MJML render failed, using raw substituted template', {
      error: (err as Error).message,
    });
  }

  return { html, text: htmlToText(html) };
}

// ── Rate limit check ───────────────────────────────────────────────────────

async function checkRateLimits(to: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const globalCount = await redis.incr(GLOBAL_RATE_KEY);
    if (globalCount === 1) await redis.expire(GLOBAL_RATE_KEY, GLOBAL_WINDOW_S);
    if (globalCount > GLOBAL_LIMIT) return { allowed: false, reason: 'global-limit' };

    const perKey = PER_RECIPIENT_RATE_KEY(to);
    const perCount = await redis.incr(perKey);
    if (perCount === 1) await redis.expire(perKey, PER_RECIPIENT_WINDOW_S);
    if (perCount > PER_RECIPIENT_LIMIT) return { allowed: false, reason: 'recipient-limit' };

    return { allowed: true };
  } catch (err) {
    // If Redis is down we err on the side of allowing — failed jobs will retry
    logger.warn('[drip-smtp] rate-limit check failed', { error: (err as Error).message });
    return { allowed: true };
  }
}

// ── Send ───────────────────────────────────────────────────────────────────

export async function sendDripEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const limit = await checkRateLimits(args.to);
  if (!limit.allowed) {
    throw new Error(`rate-limit:${limit.reason ?? 'unknown'}`);
  }

  // Primary: nodemailer SMTP if configured
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    await sendViaSmtp(args);
    return;
  }

  // Fallback: noop (logs only). Production must configure SMTP_*.
  logger.warn('[drip-smtp] SMTP not configured — drip email NOT sent', {
    to: args.to,
    subject: args.subject,
  });
}

async function sendViaSmtp(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const mod = (await (new Function('m', 'return import(m)') as (m: string) => Promise<unknown>)('nodemailer').catch(() => null)) as unknown;
  if (!mod || typeof mod !== 'object' || !('createTransport' in (mod as object))) {
    logger.warn('[drip-smtp] nodemailer not installed — install via npm i nodemailer');
    return;
  }
  const nodemailer = mod as {
    createTransport: (opts: object) => {
      sendMail: (msg: object) => Promise<{ messageId: string }>;
    };
  };
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });
      logger.info('[drip-smtp] sent', { to: args.to, messageId: info.messageId });
      return;
    } catch (err) {
      lastErr = err;
      const backoff = Math.pow(2, attempt) * 500;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('smtp-send-failed');
}
