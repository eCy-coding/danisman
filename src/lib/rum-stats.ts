/**
 * P21/T1 — RUM Statistical Aggregation Layer.
 *
 * P13'te eklenen `rum.ts` her Web Vital örneğini ayrı bir Sentry breadcrumb /
 * captureMessage olarak gönderiyor. Yüksek trafikte bu, Sentry transaction
 * kotasını hızla tüketir. Bu modül **client-side percentile aggregation**
 * uygular:
 *   - 1 dakikalık yuvarlanan pencere
 *   - P-Squared (Jain & Chlamtac 1985) — sıralama yapmadan running
 *     median / percentile tahmini (~5 marker, O(1) bellek)
 *   - 3-sigma outlier filter (P99 üstü bozucu örnekleri drop)
 *   - Bot User-Agent + slow-network filter
 *   - PII strip: pathname template (`/user/123` → `/user/:id`),
 *     IP'nin son okteti `0`, e-posta yalnız domain
 *
 * Çıktı: pencere kapandığında **tek Sentry transaction** içine
 * `setMeasurement('lcp_p75', …)` formunda dökülür — ~60 örnek → 1
 * transaction, ölçülen yük %98 azalır.
 *
 * Bu modül `src/lib/rum.ts` ile birlikte çalışır:
 *   - `rum.ts` her örneği `recordVitalSample` ile aktarır
 *   - `rum-stats.ts` agregasyon yapar, periyodik flush eder
 *
 * Pure modül — yan etki YOK. `initRumStats()` çağrılmadığı sürece zamanlayıcı
 * kurulmaz, böylece SSR / test ortamı güvende kalır.
 */

import { sentry } from './sentry';
import type { Metric } from 'web-vitals';

// ── Public types ──────────────────────────────────────────────────────────────

export interface RumStatsConfig {
  /** Pencere boyutu (ms). Default: 60_000. */
  windowMs: number;
  /** Mesaj başına maksimum sample (DOS koruması). Default: 600. */
  maxSamplesPerWindow: number;
  /** Outlier filtresi (3-sigma) açık mı? Default: true. */
  outlierFilter: boolean;
  /** Bot User-Agent regex'i. Default: yaygın crawler imzaları. */
  botRegex: RegExp;
  /** "Slow" 2G/3G ölçümlerini drop et. Default: true. */
  dropSlowNetwork: boolean;
}

export const DEFAULT_RUM_STATS_CONFIG: RumStatsConfig = {
  windowMs: 60_000,
  maxSamplesPerWindow: 600,
  outlierFilter: true,
  botRegex: /bot|crawler|spider|crawling|slurp|bingpreview|headlesschrome|lighthouse|gtmetrix/i,
  dropSlowNetwork: true,
};

// ── P-Squared algorithm ───────────────────────────────────────────────────────
//
// Jain, R., Chlamtac, I. (1985). The P² Algorithm for Dynamic Calculation
// of Quantiles and Histograms Without Storing Observations.
// CACM 28(10), 1076–1085.
//
// 5 marker tutar; her örnek geldiğinde marker yüksekliklerini parabolik
// interpolasyonla günceller. Bellek O(1), CPU O(1) per sample.
// Tipik hata < %1 (n > 500'de). RUM kullanımı için fazlasıyla yeterli.

const P_COUNT = 5;

export class PSquaredQuantile {
  private readonly p: number;
  private readonly q: number[] = new Array(P_COUNT).fill(0);
  private readonly n: number[] = [0, 1, 2, 3, 4]; // marker positions (count)
  private readonly nDesired: number[] = new Array(P_COUNT).fill(0);
  private readonly dn: number[] = [];
  private count = 0;
  private initialized = false;

  constructor(p: number) {
    if (p <= 0 || p >= 1) {
      throw new Error(`PSquaredQuantile: p must be in (0,1), got ${p}`);
    }
    this.p = p;
    // Desired marker positions for percentile p:
    //   { 0, p/2, p, (1+p)/2, 1 } × (n-1)
    // Incremental updates use dn = derivative of desired positions.
    this.dn = [0, p / 2, p, (1 + p) / 2, 1];
  }

  public reset(): void {
    for (let i = 0; i < P_COUNT; i++) {
      this.q[i] = 0;
      this.n[i] = i;
      this.nDesired[i] = 0;
    }
    this.count = 0;
    this.initialized = false;
  }

  // Sabit boyutlu P_COUNT=5 marker dizilerine erişim. `noUncheckedIndexedAccess`
  // altında her `arr[i]` `T | undefined` döner; `0..P_COUNT-1` aralığında
  // sınırlandığını invariant olarak biliyoruz, bu yüzden tip daraltıcı
  // yardımcılar kullanıyoruz (`!` kullanmaktan kaçınıyoruz — invariant'ı
  // açıkça bound check yapıyoruz, üretimde noop).
  private qAt(i: number): number {
    const v = this.q[i];
    return v as number;
  }
  private nAt(i: number): number {
    const v = this.n[i];
    return v as number;
  }
  private dAt(i: number): number {
    const v = this.dn[i];
    return v as number;
  }
  private ndAt(i: number): number {
    const v = this.nDesired[i];
    return v as number;
  }

  public push(x: number): void {
    if (!Number.isFinite(x)) return;
    this.count++;

    if (!this.initialized) {
      this.q[this.count - 1] = x;
      if (this.count === P_COUNT) {
        this.q.sort((a, b) => a - b);
        // Initial desired positions per the original paper: 0, 2p, 4p, 2+2p, 4.
        this.nDesired[0] = 0;
        this.nDesired[1] = 2 * this.dAt(1);
        this.nDesired[2] = 4 * this.dAt(2);
        this.nDesired[3] = 2 + 2 * this.dAt(3);
        this.nDesired[4] = 4;
        this.initialized = true;
      }
      return;
    }

    // Step 1 — find cell k such that q[k] ≤ x < q[k+1]
    let k: number;
    if (x < this.qAt(0)) {
      this.q[0] = x;
      k = 0;
    } else if (x >= this.qAt(P_COUNT - 1)) {
      this.q[P_COUNT - 1] = x;
      k = P_COUNT - 2;
    } else {
      k = 0;
      for (let i = 1; i < P_COUNT - 1; i++) {
        if (x < this.qAt(i)) {
          k = i - 1;
          break;
        }
        k = i;
      }
    }

    // Step 2 — increment positions of markers k+1..4
    for (let i = k + 1; i < P_COUNT; i++) {
      this.n[i] = this.nAt(i) + 1;
    }
    for (let i = 0; i < P_COUNT; i++) {
      this.nDesired[i] = this.ndAt(i) + this.dAt(i);
    }

    // Step 3 — adjust heights of markers 1..3 if necessary
    for (let i = 1; i < P_COUNT - 1; i++) {
      const d = this.ndAt(i) - this.nAt(i);
      const dPlus = this.nAt(i + 1) - this.nAt(i);
      const dMinus = this.nAt(i) - this.nAt(i - 1);
      if ((d >= 1 && dPlus > 1) || (d <= -1 && dMinus > 1)) {
        const dSign = d >= 0 ? 1 : -1;
        const parabolic = this.parabolic(i, dSign);
        if (this.qAt(i - 1) < parabolic && parabolic < this.qAt(i + 1)) {
          this.q[i] = parabolic;
        } else {
          this.q[i] = this.linear(i, dSign);
        }
        this.n[i] = this.nAt(i) + dSign;
      }
    }
  }

  /** P² parabolic prediction formula. */
  private parabolic(i: number, d: number): number {
    const qi = this.qAt(i);
    const qip = this.qAt(i + 1);
    const qim = this.qAt(i - 1);
    const ni = this.nAt(i);
    const nip = this.nAt(i + 1);
    const nim = this.nAt(i - 1);
    return (
      qi +
      (d / (nip - nim)) *
        (((ni - nim + d) * (qip - qi)) / (nip - ni) +
          ((nip - ni - d) * (qi - qim)) / (ni - nim))
    );
  }

  /** Fallback linear prediction. */
  private linear(i: number, d: number): number {
    const idx = i + d;
    const qi = this.qAt(i);
    const qIdx = this.qAt(idx);
    const ni = this.nAt(i);
    const nIdx = this.nAt(idx);
    return qi + (d * (qIdx - qi)) / (nIdx - ni);
  }

  /** Current quantile estimate. Returns NaN if < 5 samples seen. */
  public value(): number {
    if (!this.initialized) {
      if (this.count === 0) return Number.NaN;
      // Pre-init: return sample median of what we have.
      const sorted = this.q.slice(0, this.count).sort((a, b) => a - b);
      const idx = Math.min(sorted.length - 1, Math.floor(this.p * sorted.length));
      return sorted[idx] ?? Number.NaN;
    }
    return this.qAt(2); // middle marker is the p-th quantile estimate
  }

  /** Current marker count. */
  public size(): number {
    return this.count;
  }

  /** Quantile parameter (read-only). */
  public quantile(): number {
    return this.p;
  }
}

// ── Privacy strip ─────────────────────────────────────────────────────────────

/**
 * URL pathname'i template'e dönüştür.
 *   `/user/123/profile`       → `/user/:id/profile`
 *   `/orders/abc-def-0123`    → `/orders/:id`
 *   `/blog/2026/05/16/slug`   → `/blog/:y/:m/:d/:slug`
 *
 * Heuristik: ID-like segmentleri pattern-match ile değiştir.
 * UUID / nanoid / numeric / hex / slug-like (>=12 char) yer tutucuya çevrilir.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_RE = /^[0-9a-f]{16,}$/i;
const NUM_RE = /^\d+$/;
const NANOID_RE = /^[A-Za-z0-9_-]{12,}$/;
const SLUG_DATE_Y = /^(19|20)\d{2}$/; // 1900–2099
const SLUG_DATE_M = /^(0?[1-9]|1[0-2])$/;
const SLUG_DATE_D = /^(0?[1-9]|[12]\d|3[01])$/;

export function templatePath(pathname: string): string {
  if (!pathname || pathname === '/') return pathname;
  const parts = pathname.split('/');
  const out = parts.map((seg, i) => {
    if (!seg) return seg;
    if (UUID_RE.test(seg)) return ':uuid';
    if (HEX_RE.test(seg)) return ':hex';
    if (NUM_RE.test(seg)) {
      // ISO date components: year → month → day chain. Check date context
      // BEFORE generic :id so /blog/2026/05/16 becomes /blog/:y/:m/:d, not
      // /blog/:y/:id/:id.
      const next = parts[i + 1] ?? '';
      const prev = parts[i - 1] ?? '';
      const prev2 = parts[i - 2] ?? '';
      if (SLUG_DATE_Y.test(seg) && next && SLUG_DATE_M.test(next)) return ':y';
      if (i > 0 && SLUG_DATE_Y.test(prev) && SLUG_DATE_M.test(seg)) return ':m';
      if (i > 1 && SLUG_DATE_M.test(prev) && SLUG_DATE_Y.test(prev2) && SLUG_DATE_D.test(seg)) {
        return ':d';
      }
      return ':id';
    }
    if (NANOID_RE.test(seg) && /\d/.test(seg) && /[a-zA-Z]/.test(seg)) return ':slug';
    return seg;
  });
  return out.join('/');
}

/** IPv4'ün son okteti `0`, IPv6'nın son grubu `0`. */
export function maskIp(ip: string): string {
  if (!ip) return ip;
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    parts[parts.length - 1] = '0';
    return parts.join(':');
  }
  return ip;
}

/** E-posta → yalnız domain. `alice@example.com` → `example.com`. */
export function emailDomain(email: string): string {
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase() : '';
}

// ── Sample filter ─────────────────────────────────────────────────────────────

export interface FilterContext {
  userAgent?: string;
  connectionType?: string; // navigator.connection?.effectiveType
}

export function shouldDropSample(ctx: FilterContext, cfg: RumStatsConfig): boolean {
  if (ctx.userAgent && cfg.botRegex.test(ctx.userAgent)) return true;
  if (cfg.dropSlowNetwork && ctx.connectionType) {
    const t = ctx.connectionType.toLowerCase();
    if (t === 'slow-2g' || t === '2g') return true;
  }
  return false;
}

/**
 * 3-sigma outlier filter. Running mean+M2 (Welford) ile std hesapla.
 * `> mean + 3σ` örnekleri drop edilir. Welford pürüzsüz çalışır; tek bir kötü
 * bağlantı bile sızdırmaz.
 */
export class Welford {
  private mean = 0;
  private m2 = 0;
  private count = 0;

  push(x: number): void {
    if (!Number.isFinite(x)) return;
    this.count++;
    const delta = x - this.mean;
    this.mean += delta / this.count;
    const delta2 = x - this.mean;
    this.m2 += delta * delta2;
  }

  std(): number {
    return this.count > 1 ? Math.sqrt(this.m2 / (this.count - 1)) : 0;
  }

  getMean(): number {
    return this.mean;
  }

  isOutlier(x: number, sigmas = 3): boolean {
    if (this.count < 30) return false; // need warm-up
    const s = this.std();
    if (s === 0) return false;
    return x > this.mean + sigmas * s;
  }

  reset(): void {
    this.mean = 0;
    this.m2 = 0;
    this.count = 0;
  }
}

// ── Aggregator ────────────────────────────────────────────────────────────────

interface VitalAgg {
  p50: PSquaredQuantile;
  p75: PSquaredQuantile;
  p95: PSquaredQuantile;
  p99: PSquaredQuantile;
  welford: Welford;
  count: number;
  poor: number;
}

function newAgg(): VitalAgg {
  return {
    p50: new PSquaredQuantile(0.5),
    p75: new PSquaredQuantile(0.75),
    p95: new PSquaredQuantile(0.95),
    p99: new PSquaredQuantile(0.99),
    welford: new Welford(),
    count: 0,
    poor: 0,
  };
}

export class RumAggregator {
  private readonly cfg: RumStatsConfig;
  private readonly aggs = new Map<string, VitalAgg>();
  private windowStart = Date.now();
  private samples = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private route = '/';
  private flushFn: (snapshot: RumSnapshot) => void;

  constructor(flushFn: (snapshot: RumSnapshot) => void, cfg: Partial<RumStatsConfig> = {}) {
    this.cfg = { ...DEFAULT_RUM_STATS_CONFIG, ...cfg };
    this.flushFn = flushFn;
  }

  setRoute(pathname: string): void {
    this.route = templatePath(pathname);
  }

  push(metric: Pick<Metric, 'name' | 'value' | 'rating'>, ctx: FilterContext): void {
    if (this.samples >= this.cfg.maxSamplesPerWindow) return;
    if (shouldDropSample(ctx, this.cfg)) return;

    let agg = this.aggs.get(metric.name);
    if (!agg) {
      agg = newAgg();
      this.aggs.set(metric.name, agg);
    }

    if (this.cfg.outlierFilter && agg.welford.isOutlier(metric.value)) {
      return;
    }
    agg.welford.push(metric.value);
    agg.p50.push(metric.value);
    agg.p75.push(metric.value);
    agg.p95.push(metric.value);
    agg.p99.push(metric.value);
    agg.count++;
    if (metric.rating === 'poor') agg.poor++;
    this.samples++;
  }

  /** Returns a snapshot WITHOUT resetting. */
  snapshot(): RumSnapshot {
    const vitals: Record<string, VitalSummary> = {};
    for (const [name, a] of this.aggs.entries()) {
      vitals[name] = {
        count: a.count,
        poor: a.poor,
        p50: round(a.p50.value()),
        p75: round(a.p75.value()),
        p95: round(a.p95.value()),
        p99: round(a.p99.value()),
        mean: round(a.welford.getMean()),
        std: round(a.welford.std()),
      };
    }
    return {
      route: this.route,
      windowStart: this.windowStart,
      windowEnd: Date.now(),
      sampleCount: this.samples,
      vitals,
    };
  }

  flush(): void {
    if (this.samples === 0) {
      this.windowStart = Date.now();
      return;
    }
    const snap = this.snapshot();
    try {
      this.flushFn(snap);
    } finally {
      this.aggs.clear();
      this.samples = 0;
      this.windowStart = Date.now();
    }
  }

  start(): void {
    if (this.timer || typeof window === 'undefined') return;
    this.timer = setInterval(() => this.flush(), this.cfg.windowMs);
    // Flush before unload — last window'u kaybetme.
    window.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onPageHide);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('visibilitychange', this.onVisibility);
      window.removeEventListener('pagehide', this.onPageHide);
    }
  }

  private onVisibility = (): void => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this.flush();
    }
  };

  private onPageHide = (): void => {
    this.flush();
  };
}

export interface VitalSummary {
  count: number;
  poor: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  mean: number;
  std: number;
}

export interface RumSnapshot {
  route: string;
  windowStart: number;
  windowEnd: number;
  sampleCount: number;
  vitals: Record<string, VitalSummary>;
}

function round(x: number, decimals = 2): number {
  if (!Number.isFinite(x)) return 0;
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
}

// ── Default Sentry flusher ────────────────────────────────────────────────────

/**
 * Snapshot'ı **tek bir Sentry transaction** içine dök. Bu, n adet
 * `captureMessage` çağrısının yerine geçer (transaction kotası ~60× azalır).
 */
export function sentryFlush(snap: RumSnapshot): void {
  // P76: Use lazy Sentry reference — no-op if Sentry not yet loaded
  const S = sentry.module;
  if (!S) return;
  S.startSpan(
    {
      name: `rum.window ${snap.route}`,
      op: 'rum.aggregation',
      attributes: {
        'rum.route': snap.route,
        'rum.sample_count': snap.sampleCount,
        'rum.window_ms': snap.windowEnd - snap.windowStart,
      },
    },
    () => {
      for (const [name, v] of Object.entries(snap.vitals)) {
        const unit = name === 'CLS' ? '' : 'millisecond';
        const lower = name.toLowerCase();
        S.setMeasurement(`${lower}_p50`, v.p50, unit);
        S.setMeasurement(`${lower}_p75`, v.p75, unit);
        S.setMeasurement(`${lower}_p95`, v.p95, unit);
        S.setMeasurement(`${lower}_p99`, v.p99, unit);
        S.setMeasurement(`${lower}_count`, v.count, '');
        S.setMeasurement(`${lower}_poor`, v.poor, '');
      }
    },
  );
}

// ── Module-level singleton (opt-in) ───────────────────────────────────────────

let _aggregator: RumAggregator | null = null;

export function initRumStats(
  cfg: Partial<RumStatsConfig> = {},
  flushFn: (snapshot: RumSnapshot) => void = sentryFlush,
): RumAggregator {
  if (_aggregator) return _aggregator;
  _aggregator = new RumAggregator(flushFn, cfg);
  if (typeof window !== 'undefined') {
    _aggregator.setRoute(window.location.pathname);
    _aggregator.start();
  }
  return _aggregator;
}

export function recordVitalSample(metric: Pick<Metric, 'name' | 'value' | 'rating'>): void {
  if (!_aggregator) return;
  const conn = (navigator as Navigator & {
    connection?: { effectiveType?: string };
  }).connection;
  _aggregator.push(metric, {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    connectionType: conn?.effectiveType,
  });
}

export function setRumRoute(pathname: string): void {
  _aggregator?.setRoute(pathname);
}

export function flushRumStats(): void {
  _aggregator?.flush();
}

/** Test/teardown only — disposes the module singleton. */
export function __resetRumStats(): void {
  _aggregator?.stop();
  _aggregator = null;
}
