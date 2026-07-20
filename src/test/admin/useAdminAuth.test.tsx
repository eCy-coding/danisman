import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const {
  mockNavigate,
  mockSetAuth,
  mockStoreLogout,
  mockAuthApiLogin,
  mockAuthApiLogout,
  mockAuthApiGetMe,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSetAuth: vi.fn(),
  mockStoreLogout: vi.fn(),
  mockAuthApiLogin: vi.fn(),
  mockAuthApiLogout: vi.fn(),
  mockAuthApiGetMe: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

let mockStoreState = {
  user: null as null | {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string;
    totpEnabled: boolean;
  },
  token: null as string | null,
  totpRequired: false,
  totpVerified: false,
  setAuth: mockSetAuth,
  logout: mockStoreLogout,
};

vi.mock('@/stores/useAppStore', () => ({
  useAppStore: () => mockStoreState,
}));

vi.mock('@/lib/api', () => ({
  authApi: {
    login: mockAuthApiLogin,
    logout: mockAuthApiLogout,
    getMe: mockAuthApiGetMe,
  },
}));

import { useAdminAuth, __resetMeSingleFlightForTests } from '../../hooks/useAdminAuth';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useAdminAuth — isAuthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMeSingleFlightForTests();
    mockStoreState = {
      user: null,
      token: null,
      totpRequired: false,
      totpVerified: false,
      setAuth: mockSetAuth,
      logout: mockStoreLogout,
    };
    mockAuthApiGetMe.mockResolvedValue({ data: { data: {} } });
  });

  it('isAuthenticated=false when no user/token', async () => {
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('isAuthenticated=false when role is not ADMIN', async () => {
    mockStoreState.user = {
      id: '1',
      email: 'a@b.com',
      name: 'A',
      role: 'USER',
      totpEnabled: false,
    };
    mockStoreState.token = 'tok';
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('isAuthenticated=true when ADMIN user + token + no totp required', async () => {
    mockStoreState.user = {
      id: '1',
      email: 'a@b.com',
      name: 'A',
      role: 'ADMIN',
      totpEnabled: false,
    };
    mockStoreState.token = 'tok';
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('isAuthenticated=false when totp required but not verified', async () => {
    mockStoreState.user = {
      id: '1',
      email: 'a@b.com',
      name: 'A',
      role: 'ADMIN',
      totpEnabled: true,
    };
    mockStoreState.token = 'tok';
    mockStoreState.totpRequired = true;
    mockStoreState.totpVerified = false;
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('useAdminAuth — isLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMeSingleFlightForTests();
    mockStoreState = {
      user: null,
      token: null,
      totpRequired: false,
      totpVerified: false,
      setAuth: mockSetAuth,
      logout: mockStoreLogout,
    };
  });

  it('isLoading=false immediately when no token', async () => {
    mockAuthApiGetMe.mockResolvedValue({ data: { data: {} } });
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockAuthApiGetMe).not.toHaveBeenCalled();
  });

  it('isLoading=true then false when token present and getMe resolves', async () => {
    mockStoreState.token = 'valid-token';
    mockAuthApiGetMe.mockResolvedValue({ data: { data: {} } });
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockAuthApiGetMe).toHaveBeenCalledTimes(1);
  });

  it('calls storeLogout when getMe fails on mount', async () => {
    mockStoreState.token = 'expired-token';
    mockAuthApiGetMe.mockRejectedValue(new Error('401'));
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockStoreLogout).toHaveBeenCalledTimes(1);
  });
});

describe('useAdminAuth — login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMeSingleFlightForTests();
    mockStoreState = {
      user: null,
      token: null,
      totpRequired: false,
      totpVerified: false,
      setAuth: mockSetAuth,
      logout: mockStoreLogout,
    };
    mockAuthApiGetMe.mockResolvedValue({ data: { data: {} } });
  });

  it('login resolves with requiresTotp=false for standard admin', async () => {
    mockAuthApiLogin.mockResolvedValue({
      data: {
        data: {
          user: { id: '1', email: 'a@b.com', name: 'Admin', role: 'ADMIN', totpEnabled: false },
          token: 'tok',
          refreshToken: 'ref',
        },
      },
    });
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult!: { requiresTotp: boolean };
    await act(async () => {
      loginResult = await result.current.login('a@b.com', 'pass');
    });

    expect(loginResult.requiresTotp).toBe(false);
    expect(mockSetAuth).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ role: 'ADMIN' }) }),
    );
  });

  it('login resolves with requiresTotp=true for totp admin', async () => {
    mockAuthApiLogin.mockResolvedValue({
      data: {
        data: {
          user: { id: '1', email: 'a@b.com', name: 'Admin', role: 'ADMIN', totpEnabled: true },
          token: 'tok',
          refreshToken: 'ref',
        },
      },
    });
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult!: { requiresTotp: boolean };
    await act(async () => {
      loginResult = await result.current.login('a@b.com', 'pass');
    });

    expect(loginResult.requiresTotp).toBe(true);
  });

  it('login handles undefined name and totpEnabled gracefully', async () => {
    mockAuthApiLogin.mockResolvedValue({
      data: {
        data: {
          user: {
            id: '1',
            email: 'a@b.com',
            name: undefined,
            role: 'ADMIN',
            totpEnabled: undefined,
          },
          token: 'tok',
          refreshToken: 'ref',
        },
      },
    });
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult!: { requiresTotp: boolean };
    await act(async () => {
      loginResult = await result.current.login('a@b.com', 'pass');
    });

    expect(loginResult.requiresTotp).toBe(false);
    expect(mockSetAuth).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ name: '', totpEnabled: false }) }),
    );
  });

  it('login throws FORBIDDEN_NOT_ADMIN when role is USER', async () => {
    mockAuthApiLogin.mockResolvedValue({
      data: {
        data: {
          user: { id: '1', email: 'a@b.com', name: 'User', role: 'USER', totpEnabled: false },
          token: 'tok',
          refreshToken: 'ref',
        },
      },
    });
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('a@b.com', 'pass');
      }),
    ).rejects.toThrow('FORBIDDEN_NOT_ADMIN');
  });
});

describe('useAdminAuth — logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMeSingleFlightForTests();
    mockStoreState = {
      user: null,
      token: null,
      totpRequired: false,
      totpVerified: false,
      setAuth: mockSetAuth,
      logout: mockStoreLogout,
    };
    mockAuthApiGetMe.mockResolvedValue({ data: { data: {} } });
  });

  it('logout calls storeLogout and navigates to /admin/login', async () => {
    mockAuthApiLogout.mockResolvedValue({});
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(mockStoreLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });

  it('logout still clears state and navigates even if authApi.logout fails', async () => {
    mockAuthApiLogout.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(mockStoreLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });
});

// M2 smoke fix — ProtectedRoute + AdminGuard + AdminSidebar each call
// useAdminAuth, which used to fire one GET /auth/me per consumer (5-6 per
// admin page load). Concurrent consumers must share one in-flight request.
describe('useAdminAuth — getMe single-flight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetMeSingleFlightForTests();
    mockStoreState = {
      user: {
        id: '1',
        email: 'a@b.com',
        name: 'A',
        role: 'ADMIN',
        totpEnabled: false,
      },
      token: 'shared-token',
      totpRequired: false,
      totpVerified: false,
      setAuth: mockSetAuth,
      logout: mockStoreLogout,
    };
  });

  it('two concurrent consumers share a single getMe request', async () => {
    mockAuthApiGetMe.mockResolvedValue({
      data: {
        data: {
          user: { id: '1', email: 'a@b.com', name: 'A', role: 'ADMIN', totpEnabled: false },
        },
      },
    });

    const first = renderHook(() => useAdminAuth(), { wrapper });
    const second = renderHook(() => useAdminAuth(), { wrapper });

    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));

    expect(mockAuthApiGetMe).toHaveBeenCalledTimes(1);
    expect(first.result.current.isAuthenticated).toBe(true);
    expect(second.result.current.isAuthenticated).toBe(true);
  });

  it('failure clears the cache so a later mount retries', async () => {
    mockAuthApiGetMe.mockRejectedValue(new Error('401'));

    const first = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    expect(mockStoreLogout).toHaveBeenCalledTimes(1);
    first.unmount();

    mockAuthApiGetMe.mockResolvedValue({
      data: {
        data: {
          user: { id: '1', email: 'a@b.com', name: 'A', role: 'ADMIN', totpEnabled: false },
        },
      },
    });

    const second = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));

    expect(mockAuthApiGetMe).toHaveBeenCalledTimes(2);
    expect(second.result.current.isAuthenticated).toBe(true);
  });

  it('successful result is reused by consumers mounting later in the session', async () => {
    mockAuthApiGetMe.mockResolvedValue({
      data: {
        data: {
          user: { id: '1', email: 'a@b.com', name: 'A', role: 'ADMIN', totpEnabled: false },
        },
      },
    });

    const first = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    first.unmount();

    // Simulates navigating to another admin page: new mounts reuse the
    // resolved flight instead of re-fetching.
    const second = renderHook(() => useAdminAuth(), { wrapper });
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));

    expect(mockAuthApiGetMe).toHaveBeenCalledTimes(1);
    expect(second.result.current.isAuthenticated).toBe(true);
  });
});
