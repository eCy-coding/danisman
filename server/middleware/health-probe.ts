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
import { verifyAccessToken } from './auth';

const HEALTH_PATHS = new Set<string>([
  '/health',
  '/api/health',
  '/api/v1/health',
  '/api/v1/ping',
  '/__health',
  '/ready',
  '/api/ready',
  '/api/v1/ready',
  // K8s-standard probes (Sprint 10 Phase 10B P46)
  '/healthz',
  '/readyz',
  '/api/healthz',
  '/api/readyz',
  '/api/v1/healthz',
  '/api/v1/readyz',
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

// Track 1 launch — third-party webhook ingress paths. Calendly fires from
// its own IP pool and Calendly itself enforces per-customer rate limits;
// the cheap IP-bucket limiter would shed legitimate `invitee.created`
// events under burst (multiple bookings in the same second), so we skip
// the generic limiter on these paths. Auth still lives inside the route
// via HMAC verify — bypassing rate limit does NOT bypass auth.
const WEBHOOK_PATHS = new Set<string>(['/api/v1/calendly', '/api/calendly']);

export function isThirdPartyWebhook(req: Request): boolean {
  return WEBHOOK_PATHS.has(normalizedPath(req));
}

// Research-bridge plane (calibration root-fix). The local NotebookLM worker
// polls claim/patch every 15s with an ApiKey; on localhost it shares the
// browser's IP, so the per-IP general bucket double-counts it and starves
// BOTH (bridge claims hit 429 mid-job). The bridge already pays the
// stricter `tierRateLimiter` api-key budget (600/15min) and full ApiKey
// auth inside the route — exempting it from the generic IP bucket removes
// the double count without weakening anything. Narrow on purpose: exact
// path prefix AND an x-api-key header present (validity enforced by
// apiKeyAuth; an invalid key still dies at auth).
const BRIDGE_PATH_PREFIXES = ['/api/v1/admin/research/bridge', '/api/admin/research/bridge'];

export function isResearchBridge(req: Request): boolean {
  if (!req.headers['x-api-key']) return false;
  const path = normalizedPath(req);
  return BRIDGE_PATH_PREFIXES.some((p) => path.startsWith(p));
}

/**
 * Admin-plane requests carrying a SIGNATURE-VALID ADMIN/EDITOR JWT skip the
 * generic per-IP bucket (calibration root-fix #2). One operator + the bridge
 * + anonymous visitors share a single IP on localhost/NAT, so panel clicks
 * were starving the 100/15min budget mid-workflow ("Durum güncellenemedi"
 * 429s during the approval chain). These requests still pay the tier
 * limiter's per-USER admin budget (1000/15min) and full `authenticate`
 * (incl. blacklist) inside the route — nothing is un-authenticated here.
 * The peek result is cached on the request for the tier layer to reuse.
 */
const ADMIN_PLANE = /^\/api(\/v1)?\/admin\//;

export function isVerifiedAdminPlane(req: Request): boolean {
  if (!ADMIN_PLANE.test(normalizedPath(req))) return false;
  const r = req as Request & { __jwtPeek?: { id: string; role: string } | null };
  if (r.__jwtPeek === undefined) {
    const h = req.headers.authorization;
    const token = typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7) : undefined;
    r.__jwtPeek = token ? verifyAccessToken(token) : null;
  }
  const role = r.__jwtPeek?.role;
  return role === 'ADMIN' || role === 'EDITOR';
}

export function isRateLimitExempt(req: Request): boolean {
  return (
    isHealthProbe(req) ||
    isThirdPartyWebhook(req) ||
    isResearchBridge(req) ||
    isVerifiedAdminPlane(req)
  );
}
