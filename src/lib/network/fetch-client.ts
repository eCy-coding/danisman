/**
 * P15 — Network resilience: fetch wrapper.
 *
 * Standardize:
 *   • timeout (default 10s, upload 30s)
 *   • 5xx → exponential backoff retry (3 attempts: 250ms, 750ms, 2000ms)
 *   • Network error → enqueue (POST/PUT/PATCH/DELETE only)
 *   • 4xx → propagate to caller (user error)
 *
 * Public API:
 *   networkFetch(input, init) → Promise<Response>
 *     - aynı fetch signature
 *     - hata: throw `NetworkError` (kind + status)
 *
 * NOT: GET'leri kuyruğa almaz çünkü read-only ve idempotent.
 */

import { Logger } from '../logger';
import { enqueue } from './retry-queue';

export type NetworkErrorKind = 'timeout' | 'network' | '5xx' | 'aborted';

export class NetworkError extends Error {
  kind: NetworkErrorKind;
  status?: number;
  constructor(kind: NetworkErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'NetworkError';
    this.kind = kind;
    if (typeof status === 'number') {
      this.status = status;
    }
  }
}

export interface NetworkFetchOptions extends RequestInit {
  timeoutMs?: number;
  retryOn5xx?: boolean;
  /** Offline iken POST/PUT/PATCH/DELETE'i retry queue'ya at. Default: true. */
  queueOnOffline?: boolean;
  idempotencyKey?: string;
}

const DEFAULT_TIMEOUT = 10_000;
const RETRY_BACKOFFS = [250, 750, 2_000];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isWriteMethod(method?: string): boolean {
  if (!method) return false;
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

function buildHeaders(init?: RequestInit): Record<string, string> {
  const h = init?.headers;
  if (!h) return {};
  if (h instanceof Headers) {
    const obj: Record<string, string> = {};
    h.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }
  if (Array.isArray(h)) {
    return Object.fromEntries(h);
  }
  return { ...(h as Record<string, string>) };
}

export async function networkFetch(
  input: string,
  options: NetworkFetchOptions = {},
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    retryOn5xx = true,
    queueOnOffline = true,
    idempotencyKey,
    signal: externalSignal,
    ...init
  } = options;

  // Idempotency-Key header (auto)
  const headers = buildHeaders(init);
  if (idempotencyKey && !headers['Idempotency-Key']) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const method = (init.method ?? 'GET').toUpperCase();

  // Offline guard — write methods straight to queue.
  if (
    queueOnOffline &&
    isWriteMethod(method) &&
    typeof navigator !== 'undefined' &&
    navigator.onLine === false
  ) {
    enqueue({
      id: idempotencyKey ?? `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: input,
      method: method as 'POST',
      headers,
      body: typeof init.body === 'string' ? init.body : JSON.stringify(init.body ?? {}),
    });
    throw new NetworkError('network', 'Offline — request queued for retry');
  }

  let lastErr: NetworkError | null = null;

  for (let attempt = 0; attempt <= (retryOn5xx ? RETRY_BACKOFFS.length : 0); attempt++) {
    if (attempt > 0) await sleep(RETRY_BACKOFFS[attempt - 1] ?? 2_000);

    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), timeoutMs);
    const composed = externalSignal
      ? composeSignals([ac.signal, externalSignal])
      : ac.signal;

    try {
      const res = await fetch(input, { ...init, headers, signal: composed });
      clearTimeout(tid);

      if (res.ok) return res;
      if (res.status >= 500 && res.status < 600 && retryOn5xx && attempt < RETRY_BACKOFFS.length) {
        lastErr = new NetworkError('5xx', `Server error ${res.status}`, res.status);
        Logger.warn(`[networkFetch] 5xx attempt=${attempt + 1}/${RETRY_BACKOFFS.length + 1}`, {
          status: res.status,
        });
        continue;
      }
      // 4xx → propagate
      return res;
    } catch (err) {
      clearTimeout(tid);
      if ((err as { name?: string } | null)?.name === 'AbortError') {
        if (ac.signal.aborted) {
          lastErr = new NetworkError('timeout', `Timeout after ${timeoutMs}ms`);
        } else {
          throw new NetworkError('aborted', 'Request aborted');
        }
      } else {
        lastErr = new NetworkError('network', (err as Error)?.message ?? 'Network error');
      }
      if (attempt >= RETRY_BACKOFFS.length || !retryOn5xx) break;
    }
  }

  // Offline + write method → queue & throw.
  if (
    queueOnOffline &&
    isWriteMethod(method) &&
    lastErr &&
    (lastErr.kind === 'network' || lastErr.kind === 'timeout')
  ) {
    enqueue({
      id: idempotencyKey ?? `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: input,
      method: method as 'POST',
      headers,
      body: typeof init.body === 'string' ? init.body : JSON.stringify(init.body ?? {}),
    });
  }

  throw lastErr ?? new NetworkError('network', 'Unknown failure');
}

function composeSignals(signals: AbortSignal[]): AbortSignal {
  const ac = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      ac.abort();
      return ac.signal;
    }
    s.addEventListener('abort', () => ac.abort(), { once: true });
  }
  return ac.signal;
}
