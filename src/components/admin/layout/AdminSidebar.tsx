import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  Briefcase 
} from 'lucide-react';
import { useAdminAuth } from '../../../hooks/useAdminAuth';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Briefcase, label: 'Services', path: '/admin/services' },
  { icon: FileText, label: 'Blog', path: '/admin/blog' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export const AdminSidebar: React.FC = () => {
  const { logout } = useAdminAuth();

  return (
    <aside className="w-64 bg-neutral/95 backdrop-blur-xl border-r border-white/5 h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-8 border-b border-white/5">
        <h2 className="text-xl font-serif text-white tracking-wide">
          EcyPro<span className="text-secondary">.</span>
          <span className="block text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">Control Tower</span>
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group
              ${isActive 
                ? 'bg-white/5 text-secondary border-l-2 border-secondary pl-[14px]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <item.icon size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
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
