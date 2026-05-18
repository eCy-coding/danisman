import { describe, it, expect, vi } from 'vitest';
import { adminEventBus } from './event-bus';

describe('P66 event-bus', () => {
  it('subscribe/publish round-trip', () => {
    const handler = vi.fn();
    const unsub = adminEventBus.subscribe(handler);
    adminEventBus.publish('contact.submitted', { email: 'test@example.com' });
    expect(handler).toHaveBeenCalledTimes(1);
    const evt = handler.mock.calls[0]?.[0];
    expect(evt?.type).toBe('contact.submitted');
    expect(evt?.payload).toEqual({ email: 'test@example.com' });
    unsub();
  });

  it('unsubscribe removes listener', () => {
    const handler = vi.fn();
    const unsub = adminEventBus.subscribe(handler);
    unsub();
    adminEventBus.publish('newsletter.subscribed', { email: 'a@b.c' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('listenerCount reflects active subscriptions', () => {
    const before = adminEventBus.listenerCount();
    const u1 = adminEventBus.subscribe(() => {});
    expect(adminEventBus.listenerCount()).toBe(before + 1);
    u1();
    expect(adminEventBus.listenerCount()).toBe(before);
  });
});
