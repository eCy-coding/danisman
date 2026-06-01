import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { authApi } from '@/lib/api';

interface LoginResult {
  requiresTotp: boolean;
}

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
    authApi
      .getMe()
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
