import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_TOKEN_KEY = 'ecypro_admin_token';
const MOCK_TOKEN = 'ecy_golden_key_2025';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (token === MOCK_TOKEN) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (password: string) => {
    // Mock password check
    if (password === 'admin123') { // Temporary hardcoded password
      localStorage.setItem(ADMIN_TOKEN_KEY, MOCK_TOKEN);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setIsAuthenticated(false);
    navigate('/admin/login');
  };

  return { isAuthenticated, isLoading, login, logout };
};
