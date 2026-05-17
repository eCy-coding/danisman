/**
 * P23 BE Track 2 / Aşama 5 — Cache-Control directive tests.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  buildCacheControl,
  setCache,
  cacheControl,
  defaultCacheByMethod,
} from './cache-control';

describe('buildCacheControl', () => {
  it('returns immutable + 1y for static-immutable', () => {
    expect(buildCacheControl('static-immutable')).toBe('public, max-age=31536000, immutable');
  });
  it('returns 5m + 1d SWR for html', () => {
    expect(buildCacheControl('html')).toBe('public, max-age=300, stale-while-revalidate=86400');
  });
  it('returns 60s browser + 5m CDN for api-public-get', () => {
    expect(buildCacheControl('api-public-get')).toBe('public, max-age=60, s-maxage=300');
  });
  it('returns private must-revalidate for api-private-get', () => {
    expect(buildCacheControl('api-private-get')).toBe('private, max-age=0, must-revalidate');
  });
  it('returns no-store for no-store class', () => {
    expect(buildCacheControl('no-store')).toBe('no-store');
  });
  it('honours overrides', () => {
    expect(buildCacheControl('html', { maxAge: 60, staleWhileRevalidate: 3600 })).toBe(
      'public, max-age=60, stale-while-revalidate=3600',
    );
  });
});

function fakeRes() {
  const headers: Record<string, string> = {};
  return {
    setHeader: vi.fn((k: string, v: string) => {
      headers[k] = v;
    }),
    getHeader: vi.fn((k: string) => headers[k]),
    headers,
  };
}

describe('setCache', () => {
  it('writes Cache-Control + Vary', () => {
    const res = fakeRes();
    setCache(res as never, 'api-public-get');
    expect(res.headers['Cache-Control']).toBe('public, max-age=60, s-maxage=300');
    expect(res.headers['Vary']).toBe('Accept-Language, Accept-Encoding, Cookie');
  });
});

describe('cacheControl middleware factory', () => {
  it('applies the directive and calls next()', () => {
    const mw = cacheControl('html');
    const res = fakeRes();
    const next = vi.fn();
    mw({} as never, res as never, next);
    expect(res.headers['Cache-Control']).toBe('public, max-age=300, stale-while-revalidate=86400');
    expect(next).toHaveBeenCalled();
  });
});

describe('defaultCacheByMethod', () => {
  it('forces no-store for POST', () => {
    const res = fakeRes();
    const next = vi.fn();
    defaultCacheByMethod()({ method: 'POST', headers: {} } as never, res as never, next);
    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('uses public for anonymous GET', () => {
    const res = fakeRes();
    defaultCacheByMethod()({ method: 'GET', headers: {} } as never, res as never, vi.fn());
    expect(res.headers['Cache-Control']).toBe('public, max-age=60, s-maxage=300');
  });

  it('drops to private for GET with Authorization header', () => {
    const res = fakeRes();
    defaultCacheByMethod()(
      { method: 'GET', headers: { authorization: 'Bearer x' } } as never,
      res as never,
      vi.fn(),
    );
    expect(res.headers['Cache-Control']).toBe('private, max-age=0, must-revalidate');
  });

  it('drops to private for GET with session cookie', () => {
    const res = fakeRes();
    defaultCacheByMethod()(
      { method: 'GET', headers: { cookie: 'access_token=abc' } } as never,
      res as never,
      vi.fn(),
    );
    expect(res.headers['Cache-Control']).toBe('private, max-age=0, must-revalidate');
  });

  it('does not overwrite an explicit Cache-Control already set upstream', () => {
    const res = fakeRes();
    res.setHeader('Cache-Control', 'no-cache, no-store');
    defaultCacheByMethod()({ method: 'GET', headers: {} } as never, res as never, vi.fn());
    expect(res.headers['Cache-Control']).toBe('no-cache, no-store');
  });
});
