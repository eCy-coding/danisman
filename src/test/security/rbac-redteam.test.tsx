/**
 * Phase 0.5 — RBAC Red-Team Adversarial Tests
 *
 * Defense-in-depth verification: client-side guard + route guard.
 * 4 adversarial scenarios that Phase 0's security fixes must repel.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useCan } from '../../hooks/useCan';

// Mock useAdminAuth to control auth state deterministically
vi.mock('../../hooks/useAdminAuth', () => ({
  useAdminAuth: vi.fn(),
}));
import { useAdminAuth } from '../../hooks/useAdminAuth';
const mockUseAdminAuth = vi.mocked(useAdminAuth);

// Mock Navigate to capture redirect targets
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
    Outlet: () => <div data-testid="outlet" />,
    useNavigate: () => vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({ user: null, token: null });
  localStorage.clear();
});

// ─── Red-Team 1: Expired JWT → useCan returns false ────────────────────────
describe('Red-Team 1 — expired JWT session eviction', () => {
  it('useCan returns false when store cleared (simulating expired JWT logout)', () => {
    // After getMe() rejects (expired JWT), useAdminAuth calls storeLogout()
    // which sets user=null, token=null. Verify useCan reflects cleared state.
    useAppStore.setState({ user: null, token: null });

    const { result } = renderHook(() => useCan());

    expect(result.current('blog:create')).toBe(false);
    expect(result.current('user:role:change')).toBe(false);
    expect(result.current('booking:view')).toBe(false);
  });

  it('useCan returns false when token present but user missing (stale state)', () => {
    // Partial store state: token exists but user cleared — defensive check
    useAppStore.setState({ user: null, token: 'stale-token' });

    const { result } = renderHook(() => useCan());

    expect(result.current('blog:create')).toBe(false);
    expect(result.current('settings:edit')).toBe(false);
  });
});

// ─── Red-Team 2: AdminGuard isLoading spinner ───────────────────────────────
describe('Red-Team 2 — AdminGuard loading state (no flash-redirect)', () => {
  it('shows loading spinner while JWT verify in flight (isLoading=true)', async () => {
    mockUseAdminAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    // AdminGuard must show spinner BEFORE redirecting (P0-2 fix requirement)
    const { AdminGuard } = await import('../../components/admin/auth/AdminGuard');

    render(
      <MemoryRouter>
        <AdminGuard requiredRole="ADMIN" />
      </MemoryRouter>,
    );

    // Spinner present, no redirect
    const spinner = screen.getByLabelText('Yükleniyor');
    expect(spinner).toBeTruthy();
    expect(screen.queryByTestId('navigate')).toBeNull();
  });
});

// ─── Red-Team 3: Unauthenticated → redirect, no children leak ──────────────
describe('Red-Team 3 — AdminGuard unauthenticated redirect enforcement', () => {
  it('redirects to /admin/login when not authenticated', async () => {
    mockUseAdminAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { AdminGuard } = await import('../../components/admin/auth/AdminGuard');

    render(
      <MemoryRouter>
        <AdminGuard requiredRole="ADMIN">
          <div data-testid="protected-content">Secret admin data</div>
        </AdminGuard>
      </MemoryRouter>,
    );

    // Must redirect, never show protected content
    const nav = screen.getByTestId('navigate');
    expect(nav).toBeTruthy();
    expect(nav.getAttribute('data-to')).toBe('/admin/login');
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });
});

// ─── Red-Team 4: Role escalation — VIEWER cannot access ADMIN route ─────────
describe('Red-Team 4 — role escalation via VIEWER → ADMIN impossible', () => {
  it('shows Yetkisiz Erişim page when VIEWER accesses ADMIN route', async () => {
    mockUseAdminAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    // User in store is VIEWER (not ADMIN)
    useAppStore.setState({
      user: {
        id: 'u-viewer',
        email: 'viewer@ecypro.com',
        name: 'Viewer',
        role: 'VIEWER',
        totpEnabled: false,
      },
      token: 'valid-token',
    });

    const { AdminGuard } = await import('../../components/admin/auth/AdminGuard');

    render(
      <MemoryRouter>
        <AdminGuard requiredRole="ADMIN">
          <div data-testid="admin-only">Admin secret</div>
        </AdminGuard>
      </MemoryRouter>,
    );

    // Unauthorized page shown, protected content never renders
    expect(screen.getByText('Yetkisiz Erişim')).toBeTruthy();
    expect(screen.queryByTestId('admin-only')).toBeNull();
  });

  it('renders children when ADMIN accesses ADMIN route', async () => {
    mockUseAdminAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    useAppStore.setState({
      user: {
        id: 'u-admin',
        email: 'admin@ecypro.com',
        name: 'Admin',
        role: 'ADMIN',
        totpEnabled: false,
      },
      token: 'valid-token',
    });

    const { AdminGuard } = await import('../../components/admin/auth/AdminGuard');

    render(
      <MemoryRouter>
        <AdminGuard requiredRole="ADMIN">
          <div data-testid="admin-content">Admin area</div>
        </AdminGuard>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('admin-content')).toBeTruthy();
    expect(screen.queryByText('Yetkisiz Erişim')).toBeNull();
  });
});
