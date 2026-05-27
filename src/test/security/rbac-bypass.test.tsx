/**
 * P0-3: AdminGuard Route + RBAC Bypass Security Tests
 * Failing tests — useCan() must read from Zustand store, NOT localStorage.
 * localStorage tampering must NOT elevate permissions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCan } from '../../hooks/useCan';

// Reset store between tests
import { useAppStore } from '../../store/useAppStore';

// Mock router
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('useCan — P0-3 RBAC Bypass Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store to unauthenticated state
    useAppStore.setState({ user: null, token: null });
    // Clear localStorage
    localStorage.clear();
  });

  it('returns false when no user in Zustand store (localStorage tamper ignored)', () => {
    // Attacker injects role=ADMIN into localStorage
    // eslint-disable-next-line no-restricted-syntax
    localStorage.setItem('ecypro_user', JSON.stringify({ role: 'ADMIN' }));
    localStorage.setItem(
      'ecypro-app-storage',
      JSON.stringify({ state: { user: { role: 'ADMIN' }, token: 'fake' } }),
    );

    const { result } = renderHook(() => useCan());

    // Must return false — no authenticated user in Zustand
    expect(result.current('blog:create')).toBe(false);
    expect(result.current('user:role:change')).toBe(false);
    expect(result.current('settings:edit')).toBe(false);
  });

  it('returns false for unauthenticated user on any permission', () => {
    // Zustand has no user, localStorage empty
    const { result } = renderHook(() => useCan());

    expect(result.current('blog:view')).toBe(false);
    expect(result.current('booking:view')).toBe(false);
  });

  it('returns correct permissions when Zustand has valid ADMIN user', () => {
    // Properly authenticated via Zustand (after real login flow)
    useAppStore.setState({
      user: {
        id: 'u1',
        email: 'admin@ecypro.com',
        name: 'Admin',
        role: 'ADMIN',
        totpEnabled: false,
      },
      token: 'valid-jwt',
    });

    const { result } = renderHook(() => useCan());

    expect(result.current('blog:create')).toBe(true);
    expect(result.current('user:role:change')).toBe(true);
    expect(result.current('blog:publish')).toBe(true);
  });

  it('CONSULTANT cannot access admin-only permissions', () => {
    useAppStore.setState({
      user: {
        id: 'u2',
        email: 'consultant@ecypro.com',
        name: 'Consultant',
        role: 'CONSULTANT',
        totpEnabled: false,
      },
      token: 'valid-jwt',
    });

    const { result } = renderHook(() => useCan());

    expect(result.current('blog:create')).toBe(true); // CONSULTANT can create
    expect(result.current('user:role:change')).toBe(false); // CONSULTANT cannot change roles
    expect(result.current('settings:edit')).toBe(false); // CONSULTANT cannot edit settings
  });

  it('localStorage role injection does NOT elevate CLIENT to ADMIN', () => {
    // Zustand has CLIENT user
    useAppStore.setState({
      user: {
        id: 'u3',
        email: 'client@ecypro.com',
        name: 'Client',
        role: 'CLIENT',
        totpEnabled: false,
      },
      token: 'valid-jwt',
    });

    // Attacker tries to inject ADMIN role via localStorage
    // eslint-disable-next-line no-restricted-syntax
    localStorage.setItem('ecypro_user', JSON.stringify({ role: 'ADMIN' }));

    const { result } = renderHook(() => useCan());

    // Should reflect CLIENT role from Zustand, not injected ADMIN
    expect(result.current('user:role:change')).toBe(false);
    expect(result.current('settings:edit')).toBe(false);
    expect(result.current('blog:publish')).toBe(false);
  });
});
