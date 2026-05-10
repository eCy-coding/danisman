import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TOKEN_KEY = 'ecypro_admin_session';

function getAdminPassword(): string | undefined {
  return import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;
}

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const session = sessionStorage.getItem(TOKEN_KEY);
    setIsAuthenticated(!!session && session.length > 8);
    setIsLoading(false);
  }, []);

  const login = (password: string): boolean => {
    const adminPassword = getAdminPassword();
    if (!adminPassword) {
      // No admin password configured — deny access in all environments
      return false;
    }
    if (password === adminPassword) {
      // Session token: random UUID stored in sessionStorage (cleared on tab close)
      const sessionToken = crypto.randomUUID();
      sessionStorage.setItem(TOKEN_KEY, sessionToken);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
    navigate('/admin/login');
  };

  return { isAuthenticated, isLoading, login, logout };
};
