/**
 * P36-T10: AdminSidebar with role-based menu filtering via useCan
 * P36-T09: Shortcut hint ? badge displayed in footer
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Briefcase,
  Calendar,
  BarChart3,
  Bot,
  Mail,
  Users,
  UserCircle,
  Keyboard,
  Shield,
  ClipboardList,
  TrendingUp,
  Terminal,
} from 'lucide-react';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { CommandPalette } from '../CommandPalette';
import { useCan } from '../../../hooks/useCan';
import { openAdminHelpModal } from '../../../hooks/useAdminShortcuts';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  permission?: string; // if set, only show when useCan(permission) is true
}

const MENU_ITEMS: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
  { icon: Mail, label: 'Contacts', path: '/admin/contacts', permission: 'contact:view' },
  { icon: Calendar, label: 'Bookings', path: '/admin/bookings', permission: 'booking:view:all' },
  { icon: Briefcase, label: 'Services', path: '/admin/services', permission: 'service:view' },
  { icon: FileText, label: 'Content', path: '/admin/blog', permission: 'blog:view' },
  { icon: Users, label: 'Newsletter', path: '/admin/newsletter', permission: 'newsletter:view' },
  { icon: Bot, label: 'AI Creator', path: '/admin/ai' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics', permission: 'analytics:view' },
  { icon: UserCircle, label: 'Users', path: '/admin/users', permission: 'user:view' },
  { icon: Shield, label: 'Sessions', path: '/admin/sessions', permission: 'settings:view' },
  { icon: ClipboardList, label: 'Audit Log', path: '/admin/audit-log', permission: 'audit:view' },
  { icon: TrendingUp, label: 'CRM', path: '/admin/crm', permission: 'contact:view' },
  {
    icon: Terminal,
    label: 'Dev Analytics',
    path: '/admin/dev-analytics',
    permission: 'analytics:view',
  },
  { icon: Settings, label: 'Settings', path: '/admin/settings', permission: 'settings:view' },
];

export const AdminSidebar: React.FC = () => {
  const { logout } = useAdminAuth();
  const can = useCan();

  // Filter menu items by role permission (P36-T10)
  const visibleItems = MENU_ITEMS.filter((item) => !item.permission || can(item.permission));

  return (
    <aside className="w-64 bg-neutral/95 backdrop-blur-xl border-r border-white/5 h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-8 border-b border-white/5">
        <h2 className="text-xl font-serif text-white tracking-wide">
          EcyPro<span className="text-secondary">.</span>
          <span className="block text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">
            Control Tower
          </span>
        </h2>
      </div>

      <div className="px-4 pt-4 pb-2">
        <CommandPalette />
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group
              ${
                isActive
                  ? 'bg-white/5 text-secondary border-l-2 border-secondary pl-3.5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <item.icon size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-1">
        {/* P36-T09: Keyboard shortcuts hint — opens ? help modal */}
        <button
          onClick={openAdminHelpModal}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
        >
          <Keyboard size={16} />
          <span className="text-xs font-medium">Kısayollar</span>
          <kbd className="ml-auto text-[10px] font-mono bg-white/5 border border-white/10 rounded px-1 text-slate-600">
            ?
          </kbd>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
