/**
 * Shared health-probe detection used by every rate-limit middleware.
 *
 * Why this exists (P99 follow-up):
 *   `app.use('/api', limiter)` strips `/api` from `req.path` before the
 *   limiter sees it — so `req.path === '/api/v1/health'` is permanently
 *   false. The previous skip implementation only worked through
 *   `req.originalUrl` exact-match and broke as soon as Render appended
 *   any query string. On top of that, `tierRateLimiter` was mounted
 *   globally without ANY skip at all, so platform probes burned the
 *   anonymous tier (60/15min) and triggered the 429 → instance recover
 *   loop visible in Render Events.
 *
 * Detection rules (any one matches → skip):
 *   1. originalUrl path component is one of the known probe paths
 *      (`/health`, `/api/health`, `/api/v1/health`, `/api/v1/ping`,
 *      `/__health`, `/ready`, `/api/ready`, `/api/v1/ready`). Query
 *      strings, trailing slashes, and case are tolerated.
 *   2. The User-Agent matches a known platform health checker:
 *      - `Go-http-client/*`            Render's internal probe
 *      - `Render/*`, `Render-Health-*` Render-branded probes
 *      - `UptimeRobot/*`, `Better Uptime Bot`, `Better-Uptime-Bot`,
 *        `Pingdom*`, `kube-probe/*`    other platforms we tolerate
 *
 * Keep this list narrow on purpose — broad UA matching defeats the
 * limiter's primary job. Anything not on the allowlist still flows
 * through the normal budget.
 */

import type { Request } from 'express';

const HEALTH_PATHS = new Set<string>([
  '/health',
  '/api/health',
  '/api/v1/health',
  '/api/v1/ping',
  '/__health',
  '/ready',
  '/api/ready',
  '/api/v1/ready',
]);

const HEALTH_UA_PATTERNS: RegExp[] = [
  /^Go-http-client\//i, // Render internal probes ship via the Go stdlib client.
  /^Render(\/|-)/i, // Render-branded probes (some regions tag themselves).
  /^Better[- ]Uptime[- ]Bot/i,
  /^UptimeRobot\//i,
  /^Pingdom\.com_bot/i,
  /^kube-probe\//i,
];

/** Extract the path component of originalUrl, lowercased + trimmed of trailing slashes. */
function normalizedPath(req: Request): string {
  const raw = req.originalUrl ?? req.url ?? '';
  const q = raw.indexOf('?');
  const pathPart = (q >= 0 ? raw.slice(0, q) : raw).toLowerCase();
  if (pathPart.length > 1 && pathPart.endsWith('/')) {
    return pathPart.slice(0, -1);
  }
  return pathPart;
}

/**
 * True when the request looks like a liveness/readiness probe and must
 * bypass rate limiting. Used by both `generalLimiter` and the default
 * `tierRateLimiter`. Routes that need a different policy can compose
 * their own skip via `tierRateLimit({ skip })`.
 */
export function isHealthProbe(req: Request): boolean {
  if (HEALTH_PATHS.has(normalizedPath(req))) return true;

  const ua = req.get?.('user-agent') ?? '';
  if (ua && HEALTH_UA_PATTERNS.some((pattern) => pattern.test(ua))) return true;

  return false;
}
