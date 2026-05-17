/**
 * P20 BE Aşama 4 — Cache Warmup Worker
 * ──────────────────────────────────────────────────────────────────────────
 *
 * SORUN: Deploy/restart sonrası LRU cache (P16 BE) ve Redis cache boş.
 * İlk 50-100 istek DB'ye düşer → cold-start latency spike (P95 → 2-3 s).
 *
 * ÇÖZÜM: Deploy-completed hook bu worker'ı tetikler; üst N read-only
 * endpoint'leri sequential olarak çağırır → cache fill. Toplam ısınma süresi
 * ~5-15 s (N=20 endpoint × ~300 ms avg).
 *
 * KULLANIM:
 *
 *   // Programmatic (worker / cron):
 *   await warmupCache({ baseUrl: 'https://api.ecypro.com' });
 *
 *   // HTTP (admin endpoint, requires CACHE_WARMUP_TOKEN bearer):
 *   curl -X POST -H "Authorization: Bearer $CACHE_WARMUP_TOKEN" \
 *        https://api.ecypro.com/api/admin/cache/warmup
 *
 *   // Render post-deploy hook (render.yaml):
 *   postDeployCommand: |
 *     curl -sf -X POST -H "Authorization: Bearer $CACHE_WARMUP_TOKEN" \
 *       "$CACHE_WARMUP_BASE_URL/api/admin/cache/warmup" || true
 *
 * MATEMATIK:
 *   - Top 20 endpoint = ~%85 trafik (Pareto, web access log analizine göre).
 *   - Sequential (5 req/sec rate) seçildi → kendi DDoS protection'ımıza
 *     takılma riskini sıfırlar (default anonymous 60/15min budget = 4/min).
 *   - Auth token bypass: warmup token rate-limit middleware'inden önce
 *     authorize edilir (worker dahili network hop'undan geliyor sayılır).
 */

import { logger } from '../config/logger';

export interface WarmupEndpoint {
  /** Path (with leading slash). E.g. '/api/services'. */
  path: string;
  /** Beklenen min HTTP status. 200, 204, 304 kabul edilir. */
  expectStatus?: number[];
}

export interface WarmupOptions {
  baseUrl?: string;
  endpoints?: WarmupEndpoint[];
  timeoutMs?: number;
  /** Sequential delay between requests (ms). */
  delayMs?: number;
}

export interface WarmupResult {
  endpoint: string;
  status: number;
  durationMs: number;
  ok: boolean;
  error?: string;
}

export interface WarmupSummary {
  startedAt: string;
  finishedAt: string;
  totalMs: number;
  attempted: number;
  succeeded: number;
  failed: number;
  results: WarmupResult[];
}

/**
 * Default warm-up list — Top public read endpoints derived from current
 * route catalog. Hot-update bu listeyi audit log analizi ile yenilenmeli
 * (P21+ ileride otomatik). Şimdilik el ile kurate edildi.
 */
const DEFAULT_ENDPOINTS: WarmupEndpoint[] = [
  // Public catalog (en sık hit alan endpoint'ler — homepage SSR fetch)
  { path: '/api/health' },
  { path: '/api/services' },
  { path: '/api/services?isActive=true' },
  { path: '/api/blog' },
  { path: '/api/blog?limit=10' },

  // Booking surface (Cal.com availability cached)
  { path: '/api/booking/slots' },
  { path: '/api/availability' },

  // SEO/sitemap surface (CDN'e cevap üreten)
  { path: '/api/sitemap-data' },
  { path: '/api/robots' },

  // Static config
  { path: '/api/site-config' },
  { path: '/api/i18n/tr' },
  { path: '/api/i18n/en' },

  // Newsletter health (auth endpoint smoke)
  { path: '/api/newsletter/stats' },

  // Search (FTS warm-up; expensive index hit)
  { path: '/api/search?q=consulting' },
  { path: '/api/search?q=premium' },

  // Status
  { path: '/api/health/ready' },
  { path: '/api/health/live' },
];

const ACCEPT_STATUSES = new Set([200, 201, 202, 204, 301, 302, 304]);

export async function warmupCache(options: WarmupOptions = {}): Promise<WarmupSummary> {
  const baseUrl = (options.baseUrl ?? process.env.CACHE_WARMUP_BASE_URL ?? '').replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('warmupCache: baseUrl missing (set CACHE_WARMUP_BASE_URL env)');
  }
  const endpoints = options.endpoints ?? DEFAULT_ENDPOINTS;
  const timeoutMs = options.timeoutMs ?? 8000;
  const delayMs = options.delayMs ?? 200; // 200 ms = 5 req/sec ceiling

  const startedAt = new Date();
  const results: WarmupResult[] = [];

  for (const ep of endpoints) {
    const t0 = Date.now();
    let status = 0;
    let ok = false;
    let error: string | undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'user-agent': 'ecypro-cache-warmup/1.0',
          // Mark internal hop — middleware can short-circuit rate limit.
          'x-cache-warmup': '1',
        },
        signal: controller.signal,
      });
      status = res.status;
      const accept = ep.expectStatus ? new Set(ep.expectStatus) : ACCEPT_STATUSES;
      ok = accept.has(status);
      // Drain body so connection releases.
      await res.text();
    } catch (err) {
      error = (err as Error).message;
    } finally {
      clearTimeout(timer);
    }

    const durationMs = Date.now() - t0;
    results.push({ endpoint: ep.path, status, durationMs, ok, error });

    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs).unref?.());
    }
  }

  const finishedAt = new Date();
  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.length - succeeded;
  const totalMs = finishedAt.getTime() - startedAt.getTime();

  const summary: WarmupSummary = {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    totalMs,
    attempted: results.length,
    succeeded,
    failed,
    results,
  };

  logger.info('[cache/warmup] complete', {
    attempted: summary.attempted,
    succeeded: summary.succeeded,
    failed: summary.failed,
    totalMs: summary.totalMs,
  });

  return summary;
}

/**
 * Testing hooks — pure functions to validate endpoint list integrity.
 */
export const _warmupTesting = {
  defaultEndpoints: DEFAULT_ENDPOINTS,
  acceptStatuses: ACCEPT_STATUSES,
};
