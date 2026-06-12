import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Admin-route suppression contract: marketing Director toasts must never
// fire inside /admin (the popup used to cover the editor's save button and
// swallow clicks — calibration finding). Public routes keep the behavior.

const toastFn = vi.fn();
vi.mock('sonner', () => ({ toast: (...a: unknown[]) => toastFn(...a) }));

import { processDirectorActions } from './toast-manager';

const WELCOME = [
  {
    type: 'NOTIFY' as const,
    payload: { variant: 'welcome-back', message: 'Welcome back! Schedule a free consultation.' },
  },
];

function setPath(pathname: string) {
  window.history.replaceState({}, '', pathname);
}

beforeEach(() => {
  vi.useFakeTimers();
  toastFn.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  setPath('/');
});

describe('processDirectorActions admin suppression', () => {
  it('does NOT toast on /admin routes', () => {
    setPath('/admin/insights/posts/abc/edit');
    processDirectorActions(WELCOME as never);
    vi.runAllTimers();
    expect(toastFn).not.toHaveBeenCalled();
  });

  it('toasts on public routes', () => {
    setPath('/perspektifler');
    processDirectorActions(WELCOME as never);
    vi.runAllTimers();
    expect(toastFn).toHaveBeenCalledTimes(1);
    expect(toastFn.mock.calls[0][0]).toBe('Welcome Back');
  });
});
