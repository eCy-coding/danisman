import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  // Added 'premium' to role type to match RoleGuard usage
  role: 'admin' | 'consultant' | 'client' | 'premium';
  avatarUrl?: string;
}

export interface AppState {
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Session State
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // UI Defaults
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),

      // Session Defaults
      user: import.meta.env.DEV ? {
        id: '1',
        name: 'Emre Can',
        email: 'admin@ecypro.com',
        role: 'admin',
        avatarUrl: 'https://github.com/shadcn.png'
      } : null,
      isAuthenticated: import.meta.env.DEV,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'ecypro-app-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }), 
    }
  )
);
