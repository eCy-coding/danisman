import React from 'react';
import {
  Target,
  Handshake,
  Network,
  Brain,
  Zap,
  Cloud,
  TrendingUp,
  BarChart3,
  Settings,
  DollarSign,
  Cpu,
  BookOpen,
  FileText,
  Compass,
  Building2,
  ArrowRight,
  Factory,
  Newspaper,
  ClipboardList,
  PenLine,
  Database,
  BadgePercent,
} from 'lucide-react';
import { MEGA_MENUS } from '@/data/copy/common';
import { MENU_CATEGORIES, MENU_FORMATS, MENU_PICKS, MENU_HUB_HREF } from './insightsMenuData';

type Lang = 'tr' | 'en';

const ICON_MAP: Record<string, React.ReactNode> = {
  Target: <Target size={16} />,
  Handshake: <Handshake size={16} />,
  Network: <Network size={16} />,
  Brain: <Brain size={16} />,
  Zap: <Zap size={16} />,
  Cloud: <Cloud size={16} />,
  TrendingUp: <TrendingUp size={16} />,
  BarChart3: <BarChart3 size={16} />,
  Settings: <Settings size={16} />,
  DollarSign: <DollarSign size={16} />,
  Cpu: <Cpu size={16} />,
  Factory: <Factory size={16} />,
  BookOpen: <BookOpen size={16} />,
  FileText: <FileText size={16} />,
  Compass: <Compass size={16} />,
  Building2: <Building2 size={16} />,
  Database: <Database size={16} />,
  BadgePercent: <BadgePercent size={16} />,
};

const FORMAT_ICON: Record<string, React.ReactNode> = {
  makale: <Newspaper size={16} />,
  'vaka-analizi': <ClipboardList size={16} />,
  rapor: <BarChart3 size={16} />,
  'founder-letter': <PenLine size={16} />,
};

interface MegaMenuProps {
  menuId: 'services' | 'insights';
  isOpen: boolean;
  lang: Lang;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/** Insights-only panel (istek.md v2 §PHASE 2): Kategoriler + Formatlar +
 *  Öne Çıkanlar + promo, ≤30 links. SEKTÖRLER / HAKKIMIZDA groups removed
 *  (BUG-03) — they live under their own nav items. */
const InsightsColumns: React.FC<{ lang: Lang; onClose: () => void }> = ({ lang, onClose }) => (
  <>
    <div className="p-6">
      <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">
        {lang === 'tr' ? 'Kategoriler' : 'Categories'}
      </p>
      <ul className="space-y-0.5" role="menu">
        {MENU_CATEGORIES.map((cat) => (
          <li key={cat.slug} role="none">
            <a
              href={cat.href}
              role="menuitem"
              onClick={onClose}
              className="group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors leading-tight">
                {cat.label[lang]}
              </span>
              <span className="text-[10px] tabular-nums text-slate-600 group-hover:text-slate-400 transition-colors">
                {cat.count}
              </span>
            </a>
          </li>
        ))}
        <li role="none">
          <a
            href={MENU_HUB_HREF}
            role="menuitem"
            onClick={onClose}
            className="group flex items-center gap-1.5 px-2.5 py-2 mt-1 text-xs font-bold text-primary hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
          >
            {lang === 'tr' ? 'Tüm kategoriler' : 'All categories'}
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </li>
      </ul>
    </div>

    <div className="p-6">
      <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">
        {lang === 'tr' ? 'Formatlar' : 'Formats'}
      </p>
      <ul className="space-y-1" role="menu">
        {MENU_FORMATS.map((f) => (
          <li key={f.slug} role="none">
            <a
              href={f.href}
              role="menuitem"
              onClick={onClose}
              className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <span className="shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-150">
                {FORMAT_ICON[f.slug]}
              </span>
              <span className="flex items-center justify-between gap-2 min-w-0 flex-1">
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors leading-tight">
                  {f.label[lang]}
                </span>
                <span className="text-[10px] tabular-nums text-slate-600 group-hover:text-slate-400 transition-colors">
                  {f.count}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>

    <div className="p-6">
      <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">
        {lang === 'tr' ? 'Öne Çıkanlar' : 'Editor’s Picks'}
      </p>
      <ul className="space-y-2" role="menu">
        {MENU_PICKS.map((pick) => (
          <li key={pick.slug} role="none">
            <a
              href={pick.href}
              role="menuitem"
              onClick={onClose}
              className="group flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {pick.coverImage && (
                <img
                  src={pick.coverImage}
                  alt=""
                  loading="lazy"
                  width={56}
                  height={32}
                  className="shrink-0 w-14 h-8 rounded-md object-cover border border-white/8"
                />
              )}
              <span className="block text-xs font-semibold text-slate-300 group-hover:text-white leading-snug transition-colors line-clamp-2">
                {pick.title}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  </>
);

export const MegaMenu: React.FC<MegaMenuProps> = ({
  menuId,
  isOpen,
  lang,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  const data = MEGA_MENUS[menuId];
  if (!data) return null;

  const bottomBar =
    menuId === 'insights'
      ? {
          label: lang === 'tr' ? 'Strateji & AI içgörüleri' : 'Strategy & AI insights',
          href: MENU_HUB_HREF,
          cta: lang === 'tr' ? 'Tüm içgörüleri keşfedin' : 'Explore all insights',
        }
      : {
          label: lang === 'tr' ? 'Tüm hizmetlerimizi keşfedin' : 'Explore all our services',
          href: '/services',
          cta: lang === 'tr' ? 'Tümünü gör' : 'View all',
        };

  return (
    <div
      role="region"
      id={`mega-menu-${menuId}`}
      data-testid={`mega-menu-${menuId}`}
      aria-label={menuId === 'services' ? 'Hizmetler açılır paneli' : 'Perspektifler açılır paneli'}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 w-225 max-w-[95vw] transition-all duration-250 origin-top z-50 ${
        isOpen
          ? 'opacity-100 scale-100 visible translate-y-0'
          : 'opacity-0 scale-[0.97] invisible -translate-y-2 pointer-events-none'
      }`}
    >
      {/* Subtle backdrop: separates the panel from page content (no blur — doctrine). */}
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 -z-10 bg-black/35"
          data-testid={`mega-menu-${menuId}-backdrop`}
        />
      )}
      {/* Opaque surface (doctrine A9): /98 translucency let the hero H1 ghost
          through the open panel — solid #0a0f1c kills the overlap garble. */}
      <div className="bg-[#0a0f1c] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-white/8 overflow-hidden ring-1 ring-white/5">
        <div className="grid grid-cols-4 divide-x divide-white/5">
          {menuId === 'insights' ? (
            <InsightsColumns lang={lang} onClose={onClose} />
          ) : (
            data.sections.map((section) => (
              <div key={section.id} className="p-6">
                <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">
                  {section.title[lang]}
                </p>
                {/* APG Disclosure Navigation: plain link list — ARIA menu
                    roles would demand full menubar keyboard semantics. */}
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        onClick={onClose}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      >
                        <span className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-150">
                          {ICON_MAP[item.iconName] ?? <Target size={16} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-200 group-hover:text-white transition-colors leading-tight mb-0.5">
                            {item.label[lang]}
                          </span>
                          <span className="block text-xs text-slate-500 group-hover:text-slate-400 leading-snug transition-colors line-clamp-2">
                            {item.description[lang]}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}

          {/* Featured panel */}
          <div
            className={`p-6 bg-linear-to-br ${data.featured.gradient} flex flex-col justify-between`}
          >
            <div>
              <span className="inline-block text-[10px] font-bold tracking-[0.2em] text-secondary uppercase border border-secondary/30 bg-secondary/10 rounded-full px-2.5 py-1 mb-4">
                {data.featured.tag[lang]}
              </span>
              {/* S13-P4 F8 — Navbar MegaMenu featured panel was using <h3>, */}
              {/* placing AI Olgunluk Analizi / 2026 AI Dönüşüm Raporu in the */}
              {/* document outline BEFORE the <h1> hero, breaking heading */}
              {/* hierarchy for screen readers and Google's outline parser. */}
              {/* These are navigation labels (not content), so demote to */}
              {/* <p> with the same visual class set. Hierarchy now starts */}
              {/* at the hero <h1>. */}
              <p className="text-base font-bold text-white leading-snug mb-3">
                {data.featured.title[lang]}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {data.featured.description[lang]}
              </p>
            </div>
            <a
              href={data.featured.href}
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-white border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/20 rounded-lg px-4 py-2.5 transition-all duration-200 group w-fit"
            >
              {data.featured.cta[lang]}
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between bg-white/1">
          <p className="text-xs text-slate-600">{bottomBar.label}</p>
          <a
            href={bottomBar.href}
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-1 group"
          >
            {bottomBar.cta}
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};
