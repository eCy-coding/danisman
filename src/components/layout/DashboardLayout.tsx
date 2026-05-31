import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calculator,
  FileText,
  Settings,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/useAppStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAppStore();

  const sidebarItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', href: '/dashboard' },
    { icon: <Calculator size={20} />, label: 'Consulting Module', href: '/dashboard/consulting' },
    { icon: <FileText size={20} />, label: 'Reports', href: '/dashboard/reports' },
    { icon: <MessageSquare size={20} />, label: 'Messages', href: '/dashboard/messages' },
    { icon: <Users size={20} />, label: 'Team', href: '/dashboard/team' },
    { icon: <Settings size={20} />, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-neutral flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-900 border-r border-white/10 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-serif font-bold">
              E
            </div>
            <span className="font-serif font-bold text-xl text-white">eCyPro</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
                    ${
                      isActive
                        ? 'bg-primary/5 text-primary'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }
                 `}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
            onClick={logout}
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="p-6 md:p-12 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
