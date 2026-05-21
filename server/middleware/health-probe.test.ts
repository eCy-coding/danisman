/**
 * Unit coverage for the shared health-probe detector.
 *
 * Mirrors the Render incident: every health hit (path or Go-http-client UA)
 * MUST bypass the rate limiter; everything else MUST flow through.
 */

import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { isHealthProbe } from './health-probe';

function mkReq(opts: { url: string; ua?: string }): Request {
  const headers: Record<string, string> = {};
  if (opts.ua) headers['user-agent'] = opts.ua;
  return {
    originalUrl: opts.url,
    url: opts.url,
    headers,
    get(name: string) {
      return headers[name.toLowerCase()];
    },
  } as unknown as Request;
}

describe('isHealthProbe — path matching', () => {
  it.each([
    '/api/v1/health',
    '/api/health',
    '/health',
    '/__health',
    '/api/v1/ping',
    '/api/v1/ready',
    '/api/ready',
    '/ready',
  ])('matches %s', (url) => {
    expect(isHealthProbe(mkReq({ url }))).toBe(true);
  });

  it('matches with query string appended', () => {
    expect(isHealthProbe(mkReq({ url: '/api/v1/health?cb=12345' }))).toBe(true);
  });

  it('matches with trailing slash', () => {
    expect(isHealthProbe(mkReq({ url: '/api/v1/health/' }))).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(isHealthProbe(mkReq({ url: '/API/V1/Health' }))).toBe(true);
  });

  it('does NOT match an unrelated route that contains "health"', () => {
    expect(isHealthProbe(mkReq({ url: '/api/v1/healthcheck' }))).toBe(false);
    expect(isHealthProbe(mkReq({ url: '/api/v1/user-health' }))).toBe(false);
  });
});

describe('isHealthProbe — User-Agent matching', () => {
  it('matches Render Go HTTP client probe', () => {
    expect(isHealthProbe(mkReq({ url: '/api/v1/bookings', ua: 'Go-http-client/1.1' }))).toBe(true);
  });

  it('matches UptimeRobot', () => {
    expect(
      isHealthProbe(
        mkReq({ url: '/api/v1/bookings', ua: 'UptimeRobot/2.0 (https://uptimerobot.com)' }),
      ),
    ).toBe(true);
  });

  it('matches Better Uptime Bot', () => {
    expect(isHealthProbe(mkReq({ url: '/api/v1/bookings', ua: 'Better Uptime Bot' }))).toBe(true);
  });

  it('does NOT match a regular browser UA', () => {
    expect(
      isHealthProbe(
        mkReq({
          url: '/api/v1/bookings',
          ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        }),
      ),
    ).toBe(false);
  });

  it('returns false on a request with no UA + non-health path', () => {
    expect(isHealthProbe(mkReq({ url: '/api/v1/bookings' }))).toBe(false);
  });
});
