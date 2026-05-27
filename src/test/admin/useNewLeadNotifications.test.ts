import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

type EventSourceEventMap = {
  message: (event: MessageEvent) => void;
  error: (event: Event) => void;
};

class MockEventSource {
  static OPEN = 1;
  static CLOSED = 2;
  readyState = MockEventSource.OPEN;
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private _listeners: Partial<EventSourceEventMap> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  static instances: MockEventSource[] = [];

  addEventListener<K extends keyof EventSourceEventMap>(type: K, listener: EventSourceEventMap[K]) {
    this._listeners[type] = listener;
  }

  removeEventListener<K extends keyof EventSourceEventMap>(type: K) {
    delete this._listeners[type];
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  emit(type: 'message', data: unknown) {
    const listener = this._listeners[type] ?? this.onmessage;
    if (listener) {
      listener(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

vi.stubGlobal('EventSource', MockEventSource);

import { useNewLeadNotifications } from '../../hooks/useNewLeadNotifications';

describe('useNewLeadNotifications', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens SSE connection to /api/admin/events', () => {
    renderHook(() => useNewLeadNotifications({ onNewLead: vi.fn() }));
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]?.url).toContain('/api/admin/events');
  });

  it('calls onNewLead callback when new_candidate message received', () => {
    const onNewLead = vi.fn();
    renderHook(() => useNewLeadNotifications({ onNewLead }));

    act(() => {
      MockEventSource.instances[0]?.emit('message', {
        type: 'new_candidate',
        data: { name: 'Ahmet', company: 'ACME', id: 'p1' },
      });
    });

    expect(onNewLead).toHaveBeenCalledWith({ name: 'Ahmet', company: 'ACME', id: 'p1' });
  });

  it('closes EventSource on unmount', () => {
    const { unmount } = renderHook(() => useNewLeadNotifications({ onNewLead: vi.fn() }));
    const instance = MockEventSource.instances[0]!;
    unmount();
    expect(instance.readyState).toBe(MockEventSource.CLOSED);
  });

  it('ignores non-new_candidate message types', () => {
    const onNewLead = vi.fn();
    renderHook(() => useNewLeadNotifications({ onNewLead }));

    act(() => {
      MockEventSource.instances[0]?.emit('message', { type: 'ping', data: {} });
    });

    expect(onNewLead).not.toHaveBeenCalled();
  });

  it('reconnects after onerror with exponential backoff', () => {
    vi.useFakeTimers();
    MockEventSource.instances = [];

    renderHook(() => useNewLeadNotifications({ onNewLead: vi.fn() }));
    expect(MockEventSource.instances).toHaveLength(1);

    act(() => {
      MockEventSource.instances[0]!.onerror?.(new Event('error'));
    });

    // First reconnect delay = min(1000 * 2^0, 30000) = 1000ms
    act(() => {
      vi.advanceTimersByTime(1001);
    });

    expect(MockEventSource.instances.length).toBeGreaterThanOrEqual(2);

    vi.useRealTimers();
  });

  it('does not reconnect after unmount', async () => {
    vi.useFakeTimers();
    MockEventSource.instances = [];

    const { unmount } = renderHook(() => useNewLeadNotifications({ onNewLead: vi.fn() }));

    // Trigger error then immediately unmount
    act(() => {
      MockEventSource.instances[0]!.onerror?.(new Event('error'));
    });
    unmount();

    // Advance past reconnect window
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should still be 1 (the one that errored, not a new reconnect)
    expect(MockEventSource.instances).toHaveLength(1);

    vi.useRealTimers();
  });
});
