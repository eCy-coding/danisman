/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  User,
  Search,
  FileText,
  Home,
  Briefcase,
  Users,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Toggle with Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] bg-neutral-900 border border-white/10 rounded-xl shadow-2xl p-0 z-[9999] overflow-hidden"
    >
      <div className="flex items-center border-b border-white/10 px-4">
        <Search className="w-5 h-5 text-slate-400 mr-2" />
        <Command.Input
          className="w-full h-14 bg-transparent outline-none text-white placeholder:text-slate-400 text-[16px]"
          placeholder={t('nav.search') || 'Type a command or search...'}
        />
      </div>

      <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 scroll-py-2">
        <Command.Empty className="py-6 text-center text-sm text-slate-400">
          No results found.
        </Command.Empty>

        <Command.Group
          heading="Navigation"
          className="px-2 py-1.5 text-xs font-medium text-slate-400 mb-2"
        >
          <Command.Item
            onSelect={() => runCommand(() => navigate('/'))}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 rounded-md aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Command.Item>
          <Command.Item
            onSelect={() => runCommand(() => navigate('/services'))}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 rounded-md aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Services</span>
          </Command.Item>
          <Command.Item
            onSelect={() => runCommand(() => navigate('/team'))}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 rounded-md aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Team</span>
          </Command.Item>
        </Command.Group>

        <Command.Group
          heading="Resources"
          className="px-2 py-1.5 text-xs font-medium text-slate-400 mb-2"
        >
          <Command.Item
            onSelect={() => runCommand(() => navigate('/perspektifler'))}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 rounded-md aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Insights / Blog</span>
          </Command.Item>
          <Command.Item
            onSelect={() => runCommand(() => navigate('/contact'))}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 rounded-md aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Contact & Quote</span>
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-medium text-slate-400">
          <Command.Item
            onSelect={() => runCommand(() => (window.location.href = 'mailto:info@ecypro.com'))}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 rounded-md aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Email Support</span>
          </Command.Item>
        </Command.Group>
      </Command.List>

      <div className="border-t border-white/10 px-4 py-2 text-[10px] text-slate-400 flex justify-between">
        <span>Navigation</span>
        <div className="flex gap-2">
          <span>Cmd K to close</span>
          <span>↑↓ to navigate</span>
          <span>Enter to select</span>
        </div>
      </div>
    </Command.Dialog>
  );
};
