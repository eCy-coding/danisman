/**
 * P23 BE Track 2 / Aşama 2 — Outbound webhook signer tests.
 *
 * We verify:
 *   1. sign() produces a stable signature over `${ts}.${body}`.
 *   2. verify() accepts a valid signature, rejects a tampered body.
 *   3. verify() rejects stale timestamps outside the 5-minute window.
 *   4. Timing-safe comparison: a length mismatch returns false without crash.
 */

import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { sign, verify } from './signer';

const SECRET = 'super-secret-do-not-leak';

describe('outbound webhook signer', () => {
  it('produces deterministic sha256= prefix signature', () => {
    const ts = 1715800000;
    const body = '{"hello":"world"}';
    const headers = sign({ secret: SECRET, body, timestamp: ts * 1000, deliveryId: 'd1', eventType: 'x' });
    const expected = createHmac('sha256', SECRET).update(`${ts}.${body}`).digest('hex');
    expect(headers['X-Webhook-Signature']).toBe(`sha256=${expected}`);
    expect(headers['X-Webhook-Timestamp']).toBe(String(ts));
    expect(headers['X-Webhook-Id']).toBe('d1');
    expect(headers['X-Webhook-Event']).toBe('x');
  });

  it('verify() accepts matching signature', () => {
    const body = '{"a":1}';
    const ts = Math.floor(Date.now() / 1000);
    const sig = createHmac('sha256', SECRET).update(`${ts}.${body}`).digest('hex');
    expect(verify({ secret: SECRET, body, timestamp: ts, signature: `sha256=${sig}` })).toEqual({
      ok: true,
      reason: undefined,
    });
  });

  it('verify() rejects tampered body', () => {
    const body = '{"a":1}';
    const ts = Math.floor(Date.now() / 1000);
    const sig = createHmac('sha256', SECRET).update(`${ts}.${body}`).digest('hex');
    expect(
      verify({ secret: SECRET, body: '{"a":2}', timestamp: ts, signature: `sha256=${sig}` }),
    ).toEqual({ ok: false, reason: undefined });
  });

  it('verify() rejects stale timestamps', () => {
    const body = 'x';
    const stale = Math.floor(Date.now() / 1000) - 3600;
    const sig = createHmac('sha256', SECRET).update(`${stale}.${body}`).digest('hex');
    expect(
      verify({ secret: SECRET, body, timestamp: stale, signature: `sha256=${sig}` }),
    ).toMatchObject({ ok: false, reason: 'stale' });
  });

  it('verify() rejects length mismatch without throwing', () => {
    const ts = Math.floor(Date.now() / 1000);
    expect(verify({ secret: SECRET, body: 'x', timestamp: ts, signature: 'sha256=deadbeef' }))
      .toMatchObject({ ok: false, reason: 'sig_length' });
  });
});
