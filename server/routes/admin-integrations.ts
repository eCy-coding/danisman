/**
 * S14 R24 — Admin Integrations Status Endpoint
 *
 * Single source of truth for ops: hangi integration env'lerle yapılandırılmış,
 * hangileri runtime'da reachable, ve missing olanlar için sahip için açık
 * action öğeleri. Admin paneli /admin/security veya benzeri ops sayfasından
 * çağrılır ve hızlı bir green/yellow/red dashboard sağlar.
 *
 * Tasarım kararları:
 *   - Endpoint admin-only (RBAC + authenticate)
 *   - Probe sonuçları cache YOK — gerçek-zamanlı snapshot (debug/ops için)
 *   - Her integration için latency budget < 1s (parallel Promise.all)
 *   - Hassas key/secret asla response'a leak etmez (sadece presence flag)
 *   - Status: 'configured' | 'unconfigured' | 'unreachable' | 'degraded'
 *
 * Response shape:
 *   {
 *     status: 'ok',
 *     data: {
 *       overall: 'green' | 'yellow' | 'red',
 *       integrations: {
 *         postgres: { status, latencyMs?, detail? },
 *         redis:    { status, latencyMs?, detail? },
 *         sentry:   { status, dsnPresent, releasePresent },
 *         notion:   { status, apiKeyPresent, dbPresent },
 *         resend:   { status, apiKeyPresent },
 *         telegram: { status, tokenPresent, chatIdPresent },
 *         betterstack: { status, heartbeatPresent },
 *         calendly:  { status, signingKeyPresent },
 *         posthogServer: { status, keyPresent }
 *       },
 *       deployment: { commit?, uptime, environment }
 *     }
 *   }
 */
import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { probeDatabase, probeRedis } from '../lib/health/probes';
import { logger } from '../config/logger';

const router = Router();

type IntegrationStatus = 'configured' | 'unconfigured' | 'unreachable' | 'degraded';

interface IntegrationReport {
  status: IntegrationStatus;
  latencyMs?: number;
  detail?: string;
  [k: string]: unknown;
}

function presence(key: string): boolean {
  const v = process.env[key];
  return typeof v === 'string' && v.trim().length > 0;
}

router.get(
  '/status',
  authenticate as Parameters<typeof router.get>[1],
  requireRole(['ADMIN']) as Parameters<typeof router.get>[1],
  async (_req: Request, res: Response) => {
    try {
      const start = Date.now();

      // ── Critical: Postgres + Redis (parallel) ─────────────
      const [dbProbe, redisProbe] = await Promise.all([probeDatabase(), probeRedis()]);

      const postgres: IntegrationReport = {
        status: dbProbe.status === 'ok' ? 'configured' : 'unreachable',
        latencyMs: dbProbe.latencyMs,
        detail: dbProbe.detail,
      };

      const redis: IntegrationReport = {
        status:
          redisProbe.status === 'ok'
            ? 'configured'
            : redisProbe.status === 'degraded'
              ? 'degraded'
              : 'unreachable',
        latencyMs: redisProbe.latencyMs,
        detail: redisProbe.detail,
      };

      // ── Telemetry: Sentry + PostHog (presence-only) ───────
      const sentry: IntegrationReport = {
        status: presence('SENTRY_DSN') ? 'configured' : 'unconfigured',
        dsnPresent: presence('SENTRY_DSN'),
        releasePresent: presence('SENTRY_RELEASE') || presence('RENDER_GIT_COMMIT'),
      };

      const posthogServer: IntegrationReport = {
        status:
          presence('POSTHOG_API_KEY') || presence('VITE_POSTHOG_KEY')
            ? 'configured'
            : 'unconfigured',
        keyPresent: presence('POSTHOG_API_KEY'),
      };

      // ── Outbound: Resend + Notion + Telegram + Calendly + BetterStack
      const resend: IntegrationReport = {
        status: presence('RESEND_API_KEY') ? 'configured' : 'unconfigured',
        apiKeyPresent: presence('RESEND_API_KEY'),
      };

      const notion: IntegrationReport = {
        status:
          presence('NOTION_API_KEY') && presence('NOTION_DB_PROSPECTS')
            ? 'configured'
            : 'unconfigured',
        apiKeyPresent: presence('NOTION_API_KEY'),
        dbPresent: presence('NOTION_DB_PROSPECTS'),
      };

      const telegram: IntegrationReport = {
        status:
          presence('TELEGRAM_BOT_TOKEN') && presence('TELEGRAM_CHAT_ID')
            ? 'configured'
            : 'unconfigured',
        tokenPresent: presence('TELEGRAM_BOT_TOKEN'),
        chatIdPresent: presence('TELEGRAM_CHAT_ID'),
      };

      const betterstack: IntegrationReport = {
        status: presence('BETTERSTACK_HEARTBEAT_URL') ? 'configured' : 'unconfigured',
        heartbeatPresent: presence('BETTERSTACK_HEARTBEAT_URL'),
      };

      const calendly: IntegrationReport = {
        status: presence('CALENDLY_WEBHOOK_SIGNING_KEY') ? 'configured' : 'unconfigured',
        signingKeyPresent: presence('CALENDLY_WEBHOOK_SIGNING_KEY'),
      };

      // ── Aggregate overall status ──────────────────────────
      // red    = any critical (postgres) failure
      // yellow = any non-critical degraded/unconfigured
      // green  = everything configured + reachable
      const allReports = {
        postgres,
        redis,
        sentry,
        notion,
        resend,
        telegram,
        betterstack,
        calendly,
        posthogServer,
      };
      const overall: 'green' | 'yellow' | 'red' =
        postgres.status === 'unreachable'
          ? 'red'
          : Object.values(allReports).some(
                (r) => r.status === 'unconfigured' || r.status === 'degraded',
              )
            ? 'yellow'
            : 'green';

      const commitSha =
        process.env.RENDER_GIT_COMMIT || process.env.SENTRY_RELEASE || process.env.RELEASE_VERSION;

      res.json({
        status: 'ok',
        data: {
          overall,
          integrations: allReports,
          deployment: {
            commit: commitSha ? commitSha.replace(/^ecypro@/, '').slice(0, 8) : null,
            uptime: Math.round(process.uptime()),
            environment: process.env.NODE_ENV || 'unknown',
          },
          generatedAt: new Date().toISOString(),
          probeDurationMs: Date.now() - start,
        },
      });
    } catch (err) {
      logger.error('[admin-integrations] status probe failed', {
        err: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        status: 'error',
        message: 'Integration status probe failed',
      });
    }
  },
);

export default router;
