/**
 * Sprint 8 P43-T01 — canonical API response wrapper unit tests.
 *
 * Co-located vitest (WEB_STANDARDS §7). Covers the contract from the
 * Architect spec: discriminated union narrowing, meta dropped when
 * empty, partialFailures threaded through, `isApiSuccess` /
 * `isApiError` guards.
 */
import { describe, it, expect } from 'vitest';

import {
  isApiError,
  isApiSuccess,
  success,
  type ApiErrorEnvelope,
  type ApiResponse,
} from './api-response';

describe('success', () => {
  it('builds a status=ok envelope with the data', () => {
    const env = success({ id: 'abc', count: 3 });
    expect(env.status).toBe('ok');
    expect(env.data).toEqual({ id: 'abc', count: 3 });
  });

  it('omits meta entirely when no meta arg is supplied', () => {
    const env = success({ ok: true });
    expect(env.meta).toBeUndefined();
  });

  it('omits meta when meta is provided but every field is empty', () => {
    const env = success({ ok: true }, { partialFailures: [] });
    expect(env.meta).toBeUndefined();
  });

  it('keeps meta when requestId is provided', () => {
    const env = success({ ok: true }, { requestId: 'req-123' });
    expect(env.meta).toEqual({ requestId: 'req-123' });
  });

  it('keeps meta.partialFailures when non-empty (Outbox WAL signal)', () => {
    const env = success({ ok: true }, { partialFailures: ['NOTION'] });
    expect(env.meta?.partialFailures).toEqual(['NOTION']);
  });

  it('threads both requestId and partialFailures together', () => {
    const env = success(
      { ok: true },
      { requestId: 'req-7', partialFailures: ['NOTION', 'RESEND'] as const },
    );
    expect(env.meta).toEqual({
      requestId: 'req-7',
      partialFailures: ['NOTION', 'RESEND'],
    });
  });

  it('drops meta when requestId is the empty string (defensive)', () => {
    const env = success({ ok: true }, { requestId: '' });
    expect(env.meta).toBeUndefined();
  });
});

describe('ApiResponse discriminated union', () => {
  const okBody: ApiResponse<{ id: string }> = success({ id: 'abc' });
  const errBody: ApiResponse<{ id: string }> = {
    status: 'error',
    code: 'VALIDATION_ERROR',
    message: 'bad input',
    requestId: 'req-1',
  } satisfies ApiErrorEnvelope;

  it('isApiSuccess narrows to the ok branch', () => {
    expect(isApiSuccess(okBody)).toBe(true);
    expect(isApiSuccess(errBody)).toBe(false);
    if (isApiSuccess(okBody)) {
      expect(okBody.data.id).toBe('abc');
    }
  });

  it('isApiError narrows to the error branch', () => {
    expect(isApiError(errBody)).toBe(true);
    expect(isApiError(okBody)).toBe(false);
    if (isApiError(errBody)) {
      expect(errBody.code).toBe('VALIDATION_ERROR');
      expect(errBody.message).toBe('bad input');
    }
  });
});
