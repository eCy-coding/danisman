/**
 * Sprint 8 P43-T01 — canonical API response wrapper.
 *
 * Architect Sprint 7 closure spec (CONVERGENT):
 *   • `server/middleware/error.ts` ZATEN canonical `ApiErrorEnvelope`
 *     + `HttpError` class + `errorHandler` middleware sağlıyor (vault
 *     drift 15: Architect "STILL MISSING" dedi, gerçekte error envelope
 *     mevcut — sadece **success envelope** ve **discriminated union**
 *     `ApiResponse<T>` eksikti).
 *   • Bu modül **success** tarafı + **type-safe discriminated union**'u
 *     codify eder; error tarafını dokunmadan complement eder.
 *   • `meta.partialFailures` PR #46 Outbox WAL pattern ile entegre olur:
 *     Notion / Resend gibi opsiyonel servisler düşünce route hala 200
 *     döner ama `meta.partialFailures` consumer'a sinyal verir
 *     ("ok, but Notion sync deferred").
 *
 * Usage:
 *   import { success, type ApiResponse } from '../lib/api-response';
 *
 *   router.get('/foo', (req, res) => {
 *     res.json(success({ id: '1' }, { partialFailures: ['NOTION'] }));
 *   });
 *
 *   // Caller side (frontend):
 *   const body: ApiResponse<Foo> = await res.json();
 *   if (body.status === 'ok') { … body.data … }
 *   else { … body.code, body.message … }
 */

import type { ApiErrorEnvelope } from '../middleware/error';

export type { ApiErrorEnvelope } from '../middleware/error';

/**
 * Optional metadata attached to a successful response. Kept open-ended so
 * future fields (pagination, cache headers, version) can be appended
 * without breaking the discriminated union.
 */
export interface ApiSuccessMeta {
  /** Correlates with Winston logs + Sentry breadcrumbs (mirror of error envelope). */
  requestId?: string;
  /**
   * Services that returned a non-fatal failure during the request.
   * Used in conjunction with PR #46 outbox WAL — the route still
   * succeeded (primary write landed), but listed services will be retried
   * out-of-band. Consumer can show "Mesaj alındı, ancak senkronizasyon
   * gecikmeli" copy without polluting the happy path.
   */
  partialFailures?: readonly string[];
}

/**
 * Canonical successful API response envelope. Mirrors `ApiErrorEnvelope`
 * shape so the discriminated union below is exhaustive.
 */
export interface ApiSuccessEnvelope<T> {
  status: 'ok';
  data: T;
  meta?: ApiSuccessMeta;
}

/**
 * Discriminated union — every public API response MUST match this shape.
 * Routes can return either branch; `body.status === 'ok'` narrows the
 * type so callers cannot accidentally read `body.code` on success or
 * `body.data` on error.
 */
export type ApiResponse<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

/**
 * Build a typed success envelope. `meta` is silently dropped when empty
 * so the wire payload stays minimal for the common "no meta" case.
 */
export function success<T>(data: T, meta?: ApiSuccessMeta): ApiSuccessEnvelope<T> {
  const envelope: ApiSuccessEnvelope<T> = { status: 'ok', data };
  if (meta) {
    const hasRequestId = typeof meta.requestId === 'string' && meta.requestId.length > 0;
    const hasPartialFailures = Array.isArray(meta.partialFailures) && meta.partialFailures.length > 0;
    if (hasRequestId || hasPartialFailures) {
      envelope.meta = meta;
    }
  }
  return envelope;
}

/** Narrow guard for consumers that prefer functions over `body.status` checks. */
export function isApiSuccess<T>(body: ApiResponse<T>): body is ApiSuccessEnvelope<T> {
  return body.status === 'ok';
}

/** Narrow guard for the error branch. */
export function isApiError<T>(body: ApiResponse<T>): body is ApiErrorEnvelope {
  return body.status === 'error';
}
