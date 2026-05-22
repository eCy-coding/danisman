import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetType = 'revenue' | 'activity' | 'ai-summary' | 'traffic' | 'users';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  minH: number; // minimum height in tailwind classes or similar
}

interface DashboardState {
  widgets: Widget[];
  toggleWidget: (id: string) => void;
  setWidgets: (widgets: Widget[]) => void;
  resetLayout: () => void;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'ai-summary', type: 'ai-summary', title: 'Executive AI Brief', visible: true, minH: 2 },
  { id: 'revenue', type: 'revenue', title: 'Revenue Overview', visible: true, minH: 2 },
  { id: 'traffic', type: 'traffic', title: 'Live Traffic', visible: true, minH: 2 },
  { id: 'activity', type: 'activity', title: 'Recent Activity', visible: true, minH: 2 },
  { id: 'users', type: 'users', title: 'User Growth', visible: true, minH: 2 },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgets: DEFAULT_WIDGETS,
      toggleWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
        })),
      setWidgets: (widgets) => set({ widgets }),
      resetLayout: () => set({ widgets: DEFAULT_WIDGETS }),
    }),
    {
      name: 'dashboard-layout',
    },
  ),
);
