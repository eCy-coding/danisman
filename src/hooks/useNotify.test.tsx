/**
 * Sprint 8 P43-T02b — useNotify canonical hook tests.
 *
 * Co-located vitest. Mocks `sonner` so we can assert the exact `toast.*`
 * surface the hook calls without rendering a real toaster.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
  },
}));

const STABLE_T = (key: string, opts?: { services?: string; defaultValue?: string }) => {
  if (key === 'notify.partial_failure' && opts?.services) {
    return `partial::${opts.services}`;
  }
  return opts?.defaultValue ?? key;
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: STABLE_T }),
}));

import { toast } from 'sonner';
import { useNotify } from './useNotify';

const mockToast = toast as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  warning: ReturnType<typeof vi.fn>;
  promise: ReturnType<typeof vi.fn>;
};

describe('useNotify', () => {
  beforeEach(() => {
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    mockToast.warning.mockClear();
    mockToast.promise.mockClear();
  });

  it('success() routes to toast.success', () => {
    const { result } = renderHook(() => useNotify());
    result.current.success('Mesaj alındı');
    expect(mockToast.success).toHaveBeenCalledWith('Mesaj alındı');
    expect(mockToast.success).toHaveBeenCalledTimes(1);
  });

  it('error() routes to toast.error', () => {
    const { result } = renderHook(() => useNotify());
    result.current.error('Bir şey ters gitti');
    expect(mockToast.error).toHaveBeenCalledWith('Bir şey ters gitti');
  });

  it('info() routes to toast.info', () => {
    const { result } = renderHook(() => useNotify());
    result.current.info('Bilgilendirme');
    expect(mockToast.info).toHaveBeenCalledWith('Bilgilendirme');
  });

  it('partialFailure() with empty array is a no-op', () => {
    const { result } = renderHook(() => useNotify());
    result.current.partialFailure([]);
    expect(mockToast.warning).not.toHaveBeenCalled();
  });

  it('partialFailure() joins multiple services and emits warning', () => {
    const { result } = renderHook(() => useNotify());
    result.current.partialFailure(['NOTION', 'RESEND']);
    expect(mockToast.warning).toHaveBeenCalledTimes(1);
    expect(mockToast.warning).toHaveBeenCalledWith(expect.stringContaining('NOTION, RESEND'));
  });

  it('partialFailure() resolves i18n key with services interpolation', () => {
    const { result } = renderHook(() => useNotify());
    result.current.partialFailure(['NOTION']);
    expect(mockToast.warning).toHaveBeenCalledWith('partial::NOTION');
  });

  it('loading() wraps a promise via toast.promise and returns the same promise', async () => {
    const { result } = renderHook(() => useNotify());
    const promise = Promise.resolve('done');
    const returned = result.current.loading(promise, {
      loading: 'L',
      success: 'S',
      error: 'E',
    });
    expect(mockToast.promise).toHaveBeenCalledWith(promise, {
      loading: 'L',
      success: 'S',
      error: 'E',
    });
    await expect(returned).resolves.toBe('done');
  });

  it('returns a stable api reference across re-renders (useMemo)', () => {
    const { result, rerender } = renderHook(() => useNotify());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
