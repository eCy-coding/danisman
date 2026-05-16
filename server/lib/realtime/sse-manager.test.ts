/**
 * P23 BE Track 2 / Aşama 1 — SSE manager unit tests.
 *
 * The manager owns indices + frame writing. We verify:
 *   1. Fan-out: publish() reaches every subscriber of the topic and nobody else.
 *   2. Per-user / per-IP / total caps.
 *   3. Cleanup removes a client from every secondary index.
 *   4. SSE frame format conforms to spec (multi-line data:, optional event:).
 */

import { describe, it, expect, vi } from 'vitest';
import { SseManager, formatFrame } from './sse-manager';

/** Build a minimal Express `Response` stub with a writable spy. */
function fakeRes(): { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn>; writableEnded: boolean } {
  return {
    write: vi.fn(() => true),
    end: vi.fn(),
    writableEnded: false,
  };
}

describe('SseManager', () => {
  it('fans out a topic publish to every subscriber', () => {
    const mgr = new SseManager({ heartbeatMs: 0 });
    const a = fakeRes();
    const b = fakeRes();
    const c = fakeRes();
    mgr.add({ userId: 'u1', ip: '1.1.1.1', topics: new Set(['blog:comments']), res: a as never });
    mgr.add({ userId: 'u2', ip: '1.1.1.2', topics: new Set(['blog:comments']), res: b as never });
    mgr.add({ userId: 'u3', ip: '1.1.1.3', topics: new Set(['analytics:tick']), res: c as never });

    const written = mgr.publish('blog:comments', { type: 'new', data: { id: 7 } });
    expect(written).toBe(2);
    expect(a.write).toHaveBeenCalled();
    expect(b.write).toHaveBeenCalled();
    expect(c.write).not.toHaveBeenCalled();
  });

  it('enforces per-user, per-IP and total caps', () => {
    const mgr = new SseManager({ perUser: 2, perIp: 3, total: 4, heartbeatMs: 0 });
    const res = (): never => fakeRes() as never;
    mgr.add({ userId: 'u1', ip: '1.1.1.1', topics: new Set(['t']), res: res() });
    mgr.add({ userId: 'u1', ip: '1.1.1.1', topics: new Set(['t']), res: res() });
    expect(mgr.canAccept('u1', '1.1.1.1')).toEqual({ ok: false, reason: 'per_user_limit' });

    mgr.add({ userId: 'u2', ip: '1.1.1.1', topics: new Set(['t']), res: res() });
    expect(mgr.canAccept('u3', '1.1.1.1')).toEqual({ ok: false, reason: 'per_ip_limit' });

    mgr.add({ userId: 'u3', ip: '9.9.9.9', topics: new Set(['t']), res: res() });
    expect(mgr.canAccept('u4', '8.8.8.8')).toEqual({ ok: false, reason: 'process_total_limit' });
  });

  it('cleanup removes the client from user, ip, and topic indices', () => {
    const mgr = new SseManager({ heartbeatMs: 0 });
    const r = fakeRes();
    const c = mgr.add({
      userId: 'u1',
      ip: '1.2.3.4',
      topics: new Set(['x', 'y']),
      res: r as never,
    });
    expect(mgr.stats().total).toBe(1);
    mgr.remove(c.id);
    expect(mgr.stats().total).toBe(0);
    expect(mgr.publish('x', { data: 'noop' })).toBe(0);
    expect(r.end).toHaveBeenCalled();
  });

  it('drops the client when the response back-pressures (write returns false)', () => {
    const mgr = new SseManager({ heartbeatMs: 0 });
    const r = fakeRes();
    r.write.mockReturnValueOnce(false);
    mgr.add({ userId: 'u1', ip: '2.2.2.2', topics: new Set(['t']), res: r as never });
    expect(mgr.publish('t', { data: 'x' })).toBe(0);
    expect(mgr.stats().total).toBe(0);
  });
});

describe('formatFrame', () => {
  it('writes a single-line data payload as one data: line', () => {
    expect(formatFrame({ data: { a: 1 } })).toBe('data: {"a":1}\n\n');
  });

  it('emits event: when type is set', () => {
    // String payloads are passed through verbatim (no re-stringification)
    // so partners receive exactly what we sent.
    expect(formatFrame({ type: 'job:done', data: 'hi' })).toBe(
      'event: job:done\ndata: hi\n\n',
    );
  });

  it('splits multi-line strings per SSE spec', () => {
    expect(formatFrame({ data: 'a\nb' })).toBe('data: a\ndata: b\n\n');
  });
});
