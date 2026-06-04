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
  Newspaper,
  FolderOpen,
  PenSquare,
  Tags,
  // P44-T07 Round-4: KVKK / ESG / Fintech / Succession nav icons
  Leaf,
  Landmark,
  Crown,
  ShieldAlert,
  Trash2,
  FileWarning,
} from 'lucide-react';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { CommandPalette } from '../CommandPalette';
import { useCan } from '../../../hooks/useCan';
import { openAdminHelpModal } from '../../../hooks/useAdminShortcuts';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';

interface MenuItem {
  type?: 'link' | 'section';
  icon?: React.ElementType;
  label: string;
  path?: string;
  permission?: string;
  indent?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
  { icon: Mail, label: 'Contacts', path: '/admin/contacts', permission: 'contact:view' },
  { icon: Calendar, label: 'Bookings', path: '/admin/bookings', permission: 'booking:view:all' },
  { icon: Briefcase, label: 'Services', path: '/admin/services', permission: 'service:view' },
  { icon: FileText, label: 'Blog', path: '/admin/blog', permission: 'blog:view' },
  // ── Perspektifler editorial CMS ──────────────────────────────────────────
  { type: 'section', label: 'Perspektifler', permission: 'blog:view' },
  {
    icon: Newspaper,
    label: 'Editoryal',
    path: '/admin/insights',
    permission: 'blog:view',
    indent: true,
  },
  {
    icon: FolderOpen,
    label: 'Kategoriler',
    path: '/admin/insights/categories',
    permission: 'blog:view',
    indent: true,
  },
  {
    icon: PenSquare,
    label: 'Makaleler',
    path: '/admin/insights/posts',
    permission: 'blog:view',
    indent: true,
  },
  {
    icon: Tags,
    label: 'Yazarlar & Etiketler',
    path: '/admin/insights/metadata',
    permission: 'blog:view',
    indent: true,
  },
  // ────────────────────────────────────────────────────────────────────────
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
  // P44-T07 Round-4: KVKK / regulatory compliance suite — backend routes were
  // wired this round; previously orphan UI now reachable through the sidebar.
  { type: 'section', label: 'KVKK & Regülasyon' },
  {
    icon: ShieldAlert,
    label: 'DSAR (m.11)',
    path: '/admin/dsar',
    permission: 'dsar:view',
    indent: true,
  },
  {
    icon: FileWarning,
    label: 'Veri İhlali (m.12)',
    path: '/admin/breach',
    permission: 'breach:view',
    indent: true,
  },
  {
    icon: Trash2,
    label: 'Saklama & İmha (m.7)',
    path: '/admin/retention',
    permission: 'retention:view',
    indent: true,
  },
  { icon: Leaf, label: 'ESG (ESRS)', path: '/admin/esg', indent: true },
  {
    icon: Landmark,
    label: 'Fintech Uyum',
    path: '/admin/fintech-compliance',
    indent: true,
  },
  { icon: Crown, label: 'Halefiyet', path: '/admin/succession', indent: true },
];

export const AdminSidebar: React.FC = () => {
  const { logout } = useAdminAuth();
  const can = useCan();

  const visibleItems = MENU_ITEMS.filter((item) => !item.permission || can(item.permission));

  return (
    <aside className="w-64 bg-neutral/95 border-r border-white/5 h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-8 border-b border-white/5">
        <h2 className="text-xl font-serif text-white tracking-wide">
          eCyPro<span className="text-secondary">.</span>
          <span className="block text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">
            Control Tower
          </span>
        </h2>
      </div>

      <div className="px-4 pt-4 pb-2">
        <CommandPalette />
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <div
                key={`section-${idx}`}
                className="px-4 pt-4 pb-1 text-[10px] font-mono uppercase tracking-widest text-slate-600"
              >
                {item.label}
              </div>
            );
          }
          if (!item.path || !item.icon) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-lg transition-all duration-300 group
                ${item.indent ? 'px-3 py-2 ml-2' : 'px-4 py-3'}
                ${
                  isActive
                    ? 'bg-white/5 text-secondary border-l-2 border-secondary'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
                ${item.indent && !isActive ? 'text-slate-500' : ''}
              `}
            >
              <Icon
                size={item.indent ? 15 : 18}
                className="group-hover:scale-110 transition-transform shrink-0"
              />
              <span className={`font-medium ${item.indent ? 'text-xs' : 'text-sm'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-1">
        {/* Phase 5.5: Theme + Language toggles */}
        <div className="flex items-center gap-2 px-1 py-1.5">
          <ThemeToggle />
          <LanguageToggle />
        </div>
        {/* P36-T09: Keyboard shortcuts hint — opens ? help modal */}
        <button
          type="button"
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
          type="button"
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
