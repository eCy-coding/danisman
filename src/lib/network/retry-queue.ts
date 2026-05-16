/**
 * P15 — Network resilience: retry queue.
 *
 * Offline iken yapılan POST request'leri localStorage'da saklar; `online`
 * event'inde otomatik flush. Max 10 saklanan request, FIFO. Her request
 * Idempotency-Key ile retry-safe.
 *
 * Public API:
 *   enqueue(req) → kuyruğa ekle
 *   flush()      → tüm queue'yu çalıştır (online iken)
 *   size()       → bekleyen sayısı
 *   clear()      → tümünü sil (logout sırasında çağrılır)
 *
 * NOT: Bu module FE-only — `fetch` global'i kullanır. Backend wire-up form-by-form.
 */

import { Logger } from '../logger';

const KEY = 'ecypro:retry-queue';
const MAX = 10;

export interface QueuedRequest {
  /** Stable id (idempotency key). */
  id: string;
  url: string;
  body: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  enqueuedAt: number;
  attempts: number;
}

function readQueue(): QueuedRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as QueuedRequest[];
  } catch (err) {
    Logger.warn('[retry-queue] corrupted localStorage, resetting', err as Error);
    return [];
  }
}

function writeQueue(q: QueuedRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(q));
  } catch (err) {
    // QuotaExceeded or private mode — drop silently, retry-queue is best-effort.
    Logger.warn('[retry-queue] write failed', err as Error);
  }
}

export function enqueue(req: Omit<QueuedRequest, 'enqueuedAt' | 'attempts'>): boolean {
  const queue = readQueue();
  if (queue.length >= MAX) {
    Logger.warn('[retry-queue] full — dropping oldest');
    queue.shift();
  }
  // Idempotency: skip if same id already queued.
  if (queue.some((q) => q.id === req.id)) {
    return false;
  }
  queue.push({ ...req, enqueuedAt: Date.now(), attempts: 0 });
  writeQueue(queue);
  return true;
}

export function size(): number {
  return readQueue().length;
}

export function clear(): void {
  writeQueue([]);
}

/**
 * Flush queue. Network errors put the request back on the queue (max 3 attempts).
 * 4xx responses drop the request (client error, won't succeed on retry).
 */
export async function flush(): Promise<{ ok: number; failed: number; dropped: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { ok: 0, failed: 0, dropped: 0 };
  const remaining: QueuedRequest[] = [];
  let ok = 0;
  let failed = 0;
  let dropped = 0;

  for (const req of queue) {
    if (typeof fetch === 'undefined') {
      remaining.push(req);
      failed++;
      continue;
    }
    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      if (res.ok) {
        ok++;
        continue;
      }
      // 4xx → drop (client error, won't fix itself)
      if (res.status >= 400 && res.status < 500) {
        Logger.warn(`[retry-queue] dropping ${req.id} → ${res.status}`);
        dropped++;
        continue;
      }
      // 5xx → keep, bump attempts
      const next = { ...req, attempts: req.attempts + 1 };
      if (next.attempts >= 3) {
        dropped++;
      } else {
        remaining.push(next);
      }
      failed++;
    } catch (err) {
      // Network error → keep on queue, bump attempts
      Logger.warn(`[retry-queue] network err ${req.id}`, err as Error);
      const next = { ...req, attempts: req.attempts + 1 };
      if (next.attempts >= 3) {
        dropped++;
      } else {
        remaining.push(next);
      }
      failed++;
    }
  }

  writeQueue(remaining);
  return { ok, failed, dropped };
}

/**
 * Bind auto-flush to the `online` event. Safe to call multiple times — uses a
 * module-level dedupe flag.
 */
let listenerBound = false;
export function bindAutoFlush(): void {
  if (listenerBound) return;
  if (typeof window === 'undefined') return;
  listenerBound = true;
  window.addEventListener('online', () => {
    void flush().then((r) => {
      if (r.ok || r.dropped) {
        Logger.info('[retry-queue] flush done', r);
      }
    });
  });
}
