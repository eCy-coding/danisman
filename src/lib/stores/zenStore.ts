import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ZenState {
  isZenMode: boolean;
  toggleZen: () => void;
}

export const useZenStore = create<ZenState>()(
  persist(
    (set) => ({
      isZenMode: false,
      toggleZen: () => set((state) => ({ isZenMode: !state.isZenMode })),
    }),
    {
      name: 'ecypro-zen',
    },
  ),
);
