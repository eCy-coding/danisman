import { renderHook, act } from '@testing-library/react';
import { useCountUp } from '@/lib/useCountUp';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useCountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with start value', () => {
    const { result } = renderHook(() => useCountUp({ end: 100, duration: 2000, start: 0 }));
    // Initial render might be start value or end value depending on implementation. 
    // The hook sets count to start (default 0) initially.
    expect(result.current).toBe(0);
  });

  it('should count up to end value', () => {
    const { result } = renderHook(() => useCountUp({ end: 100, duration: 1000, start: 0 }));
    
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current).toBe(100);
  });
});
