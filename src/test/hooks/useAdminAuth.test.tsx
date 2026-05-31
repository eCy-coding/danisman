/**
 * P0-2: useAdminAuth.isLoading Race Condition
 * Tests verify isLoading starts true, becomes false after JWT verify.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useAppStore } from '../../stores/useAppStore';

// Controlled promise — lets tests observe isLoading=true while getMe is in-flight
let resolveGetMe: (v: unknown) => void;
let rejectGetMe: (err: unknown) => void;

vi.mock('../../lib/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
    getMe: vi.fn().mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveGetMe = resolve;
          rejectGetMe = reject;
        }),
    ),
  },
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

const MOCK_USER = {
  id: 'u1',
  email: 'admin@ecypro.com',
  name: 'Admin',
  role: 'ADMIN' as const,
  totpEnabled: false,
  avatarUrl: undefined,
};
const MOCK_GET_ME_RESPONSE = { data: { data: { user: MOCK_USER, token: 'mock-jwt-token' } } };

describe('useAdminAuth — P0-2 isLoading Race', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Seed token so hook calls getMe() (non-null token path)
    useAppStore.setState({ user: MOCK_USER, token: 'mock-jwt-token' });
  });

  afterEach(() => {
    useAppStore.setState({ user: null, token: null });
  });

  it('isLoading must be TRUE on initial render (before JWT verify resolves)', async () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    // getMe is pending — isLoading must be true
    expect(result.current.isLoading).toBe(true);

    // Resolve promise to clean up
    act(() => {
      resolveGetMe(MOCK_GET_ME_RESPONSE);
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('isLoading becomes false after JWT verify completes', async () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      resolveGetMe(MOCK_GET_ME_RESPONSE);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('isLoading becomes false when no token exists (fast-path)', async () => {
    // No token — effect immediately sets isLoading false without network call
    useAppStore.setState({ user: null, token: null });
    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('isLoading becomes false even when getMe fails (expired JWT)', async () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      rejectGetMe({ response: { status: 401 } });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
