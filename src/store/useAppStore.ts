import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'CLIENT' | 'CONSULTANT' | 'ADMIN' | 'PREMIUM';
  avatarUrl?: string;
  totpEnabled: boolean;
}

export interface AppState {
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Session State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  totpRequired: boolean;
  totpVerified: boolean;
  isAuthenticated: boolean;
  setAuth: (payload: {
    user: User;
    token: string;
    refreshToken: string;
    totpRequired?: boolean;
  }) => void;
  setTotpVerified: (verified: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // UI Defaults
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),

      // Session Defaults — no DEV fixture (security: removed)
      user: null,
      token: null,
      refreshToken: null,
      totpRequired: false,
      totpVerified: false,
      isAuthenticated: false,

      setAuth: ({ user, token, refreshToken, totpRequired = false }) =>
        set({
          user,
          token,
          refreshToken,
          totpRequired,
          totpVerified: false,
          isAuthenticated: !totpRequired,
        }),

      setTotpVerified: (verified) =>
        set((state) => ({
          totpVerified: verified,
          isAuthenticated: !!state.user && !!state.token && verified,
        })),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          totpRequired: false,
          totpVerified: false,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'ecypro-app-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        totpVerified: state.totpVerified,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
