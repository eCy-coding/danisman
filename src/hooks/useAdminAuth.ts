import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { authApi } from '@/lib/api';

interface LoginResult {
  requiresTotp: boolean;
}

// Single-flight cache for GET /auth/me. ProtectedRoute, AdminGuard (route +
// page level) and AdminSidebar all call useAdminAuth, which used to fire one
// getMe per consumer (5-6 requests per admin page load). All concurrent
// consumers now share one in-flight promise per token; a failure clears the
// cache so a later mount can retry, and a token change starts a fresh flight.
let meFlight: { token: string; promise: ReturnType<typeof authApi.getMe> } | null = null;

const getMeSingleFlight = (token: string): ReturnType<typeof authApi.getMe> => {
  if (meFlight?.token === token) return meFlight.promise;
  const promise = authApi.getMe().catch((err) => {
    if (meFlight?.token === token) meFlight = null;
    throw err;
  });
  meFlight = { token, promise };
  return promise;
};

export const __resetMeSingleFlightForTests = (): void => {
  meFlight = null;
};

export const useAdminAuth = () => {
  const {
    user,
    token,
    refreshToken,
    totpRequired,
    totpVerified,
    setAuth,
    logout: storeLogout,
  } = useAppStore();
  const navigate = useNavigate();
  // MUST start as true: guard shows spinner until JWT verify completes, preventing flash-redirect on reload.
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    getMeSingleFlight(token)
      .then((res) => {
        const { user: apiUser, token: freshToken } = res.data.data;
        setAuth({
          user: {
            id: apiUser.id,
            email: apiUser.email,
            name: apiUser.name ?? '',
            role: apiUser.role as 'ADMIN',
            avatarUrl: apiUser.avatarUrl,
            totpEnabled: apiUser.totpEnabled ?? false,
          },
          token: freshToken ?? token,
          refreshToken: refreshToken ?? '',
          totpRequired: apiUser.totpEnabled ?? false,
        });
      })
      .catch(() => {
        // JWT invalid or expired — clear auth state so guard redirects to login
        storeLogout();
      })
      .finally(() => {
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isAuthenticated =
    !!user && !!token && user.role === 'ADMIN' && (!totpRequired || totpVerified);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const res = await authApi.login({ email, password });
    const { user: apiUser, token: apiToken, refreshToken: apiRefresh } = res.data.data;

    if (apiUser.role !== 'ADMIN') {
      throw new Error('FORBIDDEN_NOT_ADMIN');
    }

    setAuth({
      user: {
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.name ?? '',
        role: apiUser.role as 'ADMIN',
        avatarUrl: apiUser.avatarUrl,
        totpEnabled: apiUser.totpEnabled ?? false,
      },
      token: apiToken,
      refreshToken: apiRefresh,
      totpRequired: apiUser.totpEnabled ?? false,
    });

    return { requiresTotp: apiUser.totpEnabled ?? false };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort: always clear local state even if server call fails
    }
    storeLogout();
    navigate('/admin/login');
  };

  return { isAuthenticated, isLoading, login, logout };
};
