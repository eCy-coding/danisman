/**
 * P23/T1 — SSE (Server-Sent Events) client with mathematical reconnect backoff.
 *
 * Yatay olarak `EventSource` üstüne kuruldu, **bidirectional değil**. Bidirectional
 * gerekiyorsa WebSocket'e gidilir; bu modülün rolü:
 *
 *   • Auto-reconnect — exponential backoff + jitter
 *   • Heartbeat detection — server 30s'de bir ping atmazsa kayıp = reconnect
 *   • Visibility-aware — tab gizliyse bağlantıyı kapat (mobil pil tasarrufu)
 *   • Auth — cookie-tabanlı (HttpOnly session); URL'de token YOK (URL leakage)
 *   • Topic multiplex — tek bağlantı üzerinden N adlı event channel
 *
 * ── Reconnect math ────────────────────────────────────────────────────────────
 *
 *   delay(n) = min(baseDelay · 2^n + random(0, baseDelay), maxDelay)
 *
 *   baseDelay = 1000ms, maxDelay = 32000ms
 *
 *   n   raw_2n      max_jitter    bucket_range (ms)
 *   0    1 000       1 000          1 000 –  2 000
 *   1    2 000       1 000          2 000 –  3 000
 *   2    4 000       1 000          4 000 –  5 000
 *   3    8 000       1 000          8 000 –  9 000
 *   4   16 000       1 000         16 000 – 17 000
 *   5   32 000       1 000         32 000 – 32 000  (clipped)
 *   6+  32 000       1 000         32 000 – 32 000  (saturated)
 *
 * Jitter koleksiyonel "thundering herd" problemini hafifletir: 10K istemci
 * aynı anda kopsa bile reconnect başarımı zamansal olarak yayılır.
 *
 * AWS Architecture Blog — "Exponential Backoff And Jitter" referansı; eşit
 * jitter (Full Jitter ≠ burada; Equal Jitter varyantı: base + random).
 *
 * ── Heartbeat math ────────────────────────────────────────────────────────────
 *
 *   serverInterval  = 30s
 *   missedThreshold = 2  →  zombieAfter = 60s + 5s tolerance = 65s
 *
 *   t > zombieAfter without {ping, message, open} → close + reconnect.
 */

import { sentry } from '../sentry';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SSEStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface SSEMessage<TData = unknown> {
  type: string;
  topic?: string;
  data?: TData;
  timestamp: number;
}

export interface SSEClientOptions {
  /** Tam URL veya `/api/stream` gibi göreli path. */
  url: string;
  /** Subscribe edilecek topic'ler. Backend bu listeyi `?topics=` query'sinden okur. */
  topics?: readonly string[];
  /** Otomatik yeniden bağlanma. Default `true`. */
  autoReconnect?: boolean;
  /** İlk gecikme — backoff için 2^n base. Default 1000ms. */
  baseDelayMs?: number;
  /** Üst sınır — backoff saturation. Default 32000ms. */
  maxDelayMs?: number;
  /** Sayısal jitter ceiling. Default `baseDelayMs` (Equal Jitter). */
  jitterCeilingMs?: number;
  /** Server'ın ping göndereceği nominal aralık. Default 30000ms. */
  heartbeatIntervalMs?: number;
  /** Heartbeat kayıp toleransı. Default 2 ping → 65s zombie penceresi. */
  missedHeartbeatThreshold?: number;
  /** Tab gizliyken bağlantıyı kapat. Default `true`. */
  closeOnHidden?: boolean;
  /** Sentry breadcrumb gönder. Default `true`. */
  breadcrumbs?: boolean;
}

type Handler = (msg: SSEMessage) => void;
type StatusHandler = (status: SSEStatus) => void;

// ── Backoff helper (export edilir, test edilebilir) ────────────────────────────

/**
 * Equal-jitter exponential backoff. **Saf fonksiyon** — yan etki yok.
 *
 *   delay = min(base * 2^attempt, max) + random(0, jitterCeiling)
 *
 * `attempt` 0-indexli. Negatifse 0 muamelesi görür.
 */
export function computeBackoff(
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 32000,
  jitterCeilingMs = baseDelayMs,
  random: () => number = Math.random,
): number {
  const n = Math.max(0, Math.floor(attempt));
  // 2^30 ≈ 10^9 — JS sayı tipi taşmaz ama anlamsız büyür; cap n.
  const safeN = Math.min(n, 30);
  const exp = baseDelayMs * Math.pow(2, safeN);
  const core = Math.min(exp, maxDelayMs);
  const jitter = Math.max(0, jitterCeilingMs) * Math.max(0, Math.min(1, random()));
  return Math.floor(core + jitter);
}

// ── SSE Client ─────────────────────────────────────────────────────────────────

export class SSEClient {
  private es: EventSource | null = null;
  private status: SSEStatus = 'idle';
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPingAt = 0;
  private handlers = new Set<Handler>();
  private topicHandlers = new Map<string, Set<Handler>>();
  private statusHandlers = new Set<StatusHandler>();
  private destroyed = false;
  private visibilityBound = false;
  private opts: Required<Omit<SSEClientOptions, 'topics'>> & { topics: readonly string[] };

  constructor(options: SSEClientOptions) {
    this.opts = {
      url: options.url,
      topics: options.topics ?? [],
      autoReconnect: options.autoReconnect ?? true,
      baseDelayMs: options.baseDelayMs ?? 1000,
      maxDelayMs: options.maxDelayMs ?? 32000,
      jitterCeilingMs: options.jitterCeilingMs ?? (options.baseDelayMs ?? 1000),
      heartbeatIntervalMs: options.heartbeatIntervalMs ?? 30000,
      missedHeartbeatThreshold: options.missedHeartbeatThreshold ?? 2,
      closeOnHidden: options.closeOnHidden ?? true,
      breadcrumbs: options.breadcrumbs ?? true,
    };

    if (this.opts.closeOnHidden && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.visibilityBound = true;
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  connect(): void {
    if (this.destroyed) return;
    if (this.es && (this.status === 'open' || this.status === 'connecting')) return;
    this.openSocket();
  }

  /** Topic-spesifik dinleyici. Birden çok kez aynı handler eklemek O(1) dedupe. */
  on(topic: string, handler: Handler): () => void {
    let set = this.topicHandlers.get(topic);
    if (!set) {
      set = new Set();
      this.topicHandlers.set(topic, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  /** Tüm mesajları dinler (topic ayrımı yok). */
  onAny(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.status); // anlık durum
    return () => this.statusHandlers.delete(handler);
  }

  getStatus(): SSEStatus {
    return this.status;
  }

  close(): void {
    this.clearTimers();
    if (this.es) {
      this.es.close();
      this.es = null;
    }
    this.setStatus('closed');
  }

  destroy(): void {
    this.destroyed = true;
    if (this.visibilityBound && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    this.close();
    this.handlers.clear();
    this.topicHandlers.clear();
    this.statusHandlers.clear();
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private openSocket(): void {
    this.clearTimers();
    this.setStatus(this.attempt === 0 ? 'connecting' : 'reconnecting');

    const url = this.buildUrl();
    let es: EventSource;
    try {
      // `withCredentials: true` cookie auth için. Same-origin'de zaten geçer.
      es = new EventSource(url, { withCredentials: true });
    } catch (err) {
      this.breadcrumb('error', 'EventSource construction failed', { url, err: String(err) });
      this.scheduleReconnect();
      return;
    }

    this.es = es;
    this.lastPingAt = Date.now();
    this.armHeartbeat();

    es.onopen = () => {
      this.attempt = 0;
      this.setStatus('open');
      this.breadcrumb('info', 'sse.open', { url });
    };

    es.onmessage = (event) => {
      this.lastPingAt = Date.now();
      const msg = this.parseEvent(event);
      if (!msg) return;
      // Heartbeat sentinel — `type: 'ping'` server'dan beklenir.
      if (msg.type === 'ping' || msg.type === 'heartbeat') return;
      this.dispatch(msg);
    };

    es.onerror = () => {
      // EventSource readyState semantiği: CLOSED = 2, CONNECTING = 0, OPEN = 1.
      // CONNECTING = otomatik reconnect bekliyor; biz manuel yönetiriz.
      if (this.es && this.es.readyState === EventSource.CLOSED) {
        this.breadcrumb('warning', 'sse.error_closed', { attempt: this.attempt });
        this.scheduleReconnect();
      } else {
        // Geçici hata — handler tetiklendi ama state OPEN'dan dönmedi: pas geç.
        this.breadcrumb('warning', 'sse.error_transient', { attempt: this.attempt });
      }
    };
  }

  private buildUrl(): string {
    const topics = this.opts.topics;
    if (!topics.length) return this.opts.url;
    const sep = this.opts.url.includes('?') ? '&' : '?';
    return `${this.opts.url}${sep}topics=${encodeURIComponent(topics.join(','))}`;
  }

  private parseEvent(event: MessageEvent): SSEMessage | null {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') {
        return {
          type: parsed.type,
          topic: typeof parsed.topic === 'string' ? parsed.topic : undefined,
          data: parsed.data,
          timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
        };
      }
    } catch {
      // Non-JSON satırı — eski browser'larda ping olarak gelebilir; lastPingAt
      // zaten güncellendi, sessiz geç.
    }
    return null;
  }

  private dispatch(msg: SSEMessage): void {
    for (const h of this.handlers) {
      try {
        h(msg);
      } catch (err) {
        this.breadcrumb('error', 'sse.handler_throw', { type: msg.type, err: String(err) });
      }
    }
    if (msg.topic) {
      const set = this.topicHandlers.get(msg.topic);
      if (set) {
        for (const h of set) {
          try {
            h(msg);
          } catch (err) {
            this.breadcrumb('error', 'sse.topic_handler_throw', { topic: msg.topic, err: String(err) });
          }
        }
      }
    }
  }

  private armHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    const interval = this.opts.heartbeatIntervalMs;
    const threshold = this.opts.missedHeartbeatThreshold;
    // Tolerans: 5s gevşeklik — server scheduler jitter'ı için.
    const zombieAfter = interval * threshold + 5000;
    this.heartbeatTimer = setInterval(() => {
      if (this.status !== 'open') return;
      const idle = Date.now() - this.lastPingAt;
      if (idle > zombieAfter) {
        this.breadcrumb('warning', 'sse.heartbeat_lost', { idle, zombieAfter });
        this.recycleConnection();
      }
    }, Math.max(1000, Math.floor(interval / 2)));
  }

  private recycleConnection(): void {
    if (this.es) {
      this.es.close();
      this.es = null;
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.opts.autoReconnect || this.destroyed) {
      this.setStatus('closed');
      return;
    }
    this.setStatus('reconnecting');
    const delay = computeBackoff(
      this.attempt,
      this.opts.baseDelayMs,
      this.opts.maxDelayMs,
      this.opts.jitterCeilingMs,
    );
    this.attempt += 1;
    this.breadcrumb('info', 'sse.reconnect_scheduled', { attempt: this.attempt, delay });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setStatus(next: SSEStatus): void {
    if (this.status === next) return;
    this.status = next;
    for (const h of this.statusHandlers) {
      try {
        h(next);
      } catch {
        // sessiz geç — status handler'ı kendi sorununu çözer
      }
    }
  }

  private onVisibilityChange = (): void => {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      // Pil + bant tasarrufu — server-side de pencerenin idle olduğunu görür.
      if (this.es) {
        this.es.close();
        this.es = null;
      }
      this.clearTimers();
      this.setStatus('idle');
    } else if (!this.destroyed) {
      this.attempt = 0; // visibility geri geldi → temiz başlangıç
      this.connect();
    }
  };

  private breadcrumb(
    level: 'info' | 'warning' | 'error',
    message: string,
    data?: Record<string, unknown>,
  ): void {
    if (!this.opts.breadcrumbs) return;
    try {
      sentry.addBreadcrumb({
        category: 'sse',
        message,
        level,
        data,
      });
    } catch {
      // Sentry init edilmemişse sessiz geç
    }
  }
}

// ── Singleton factory (default app stream) ────────────────────────────────────

let _default: SSEClient | null = null;

export function getDefaultSSEClient(): SSEClient {
  if (_default) return _default;
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const url = `${apiBase.replace(/\/$/, '')}/stream`;
  _default = new SSEClient({ url });
  _default.connect();
  return _default;
}

export function resetDefaultSSEClient(): void {
  if (_default) _default.destroy();
  _default = null;
}
