import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Home,
  Briefcase,
  Factory,
  Newspaper,
  Tag,
  Users,
  Mail,
} from 'lucide-react';
import { NAV_ITEMS } from '@/data/copy/common';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MegaMenu } from './MegaMenu';
import { NEWEST_POST_DATE } from './insightsMenuData';
import { useScrollToSection } from '../common/useScrollToSection';
import { trackEvent } from '../../lib/analytics';
import { getCalendlyCta, hasExternalCalendly } from '../../lib/cta/calendly';
import { useTranslation } from '@/lib/i18n';
import { useBodyLock } from '@/hooks/useBodyLock';
import { useKeyPress } from '@/hooks/useKeyPress';
import { type MultiLang } from '@/lib/i18n';
import { EcyLogo } from '@/components/ui/EcyLogo';
import { CONTACT_CONFIG } from '../../constants';

interface NavItem {
  id: string;
  href: string;
  label: MultiLang;
  icon?: React.ReactNode;
  /** Lucide icon key resolved via NAV_ICON_MAP (BUG-02 "replace with real
   *  icons" path — data file stays JSX-free, same pattern as MegaMenu). */
  iconName?: string;
  hasMegaMenu?: boolean;
  children?: NavItem[];
}

const NAV_ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home size={15} />,
  Briefcase: <Briefcase size={15} />,
  Factory: <Factory size={15} />,
  Newspaper: <Newspaper size={15} />,
  Tag: <Tag size={15} />,
  Users: <Users size={15} />,
  Mail: <Mail size={15} />,
};

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');

  const { i18n } = useTranslation();
  const lang = ((i18n.language || 'en').startsWith('tr') ? 'tr' : 'en') as 'tr' | 'en';

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = useScrollToSection();
  const dropdownTimeoutRef = useRef<number | null>(null);
  const dropdownOpenTimeoutRef = useRef<number | null>(null);
  const dropdownOpenScrollY = useRef(0);
  const navRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  // Custom Hooks
  useBodyLock(isOpen);
  useKeyPress('Escape', () => {
    setIsOpen(false);
    // APG disclosure: Esc must return focus to the disclosure trigger,
    // otherwise keyboard users are dropped at <body>.
    setActiveDropdown((current) => {
      if (current) {
        const trigger = navRef.current?.querySelector<HTMLElement>(
          `[data-testid="navbar-link-${current}"]`,
        );
        trigger?.focus();
      }
      return null;
    });
  });

  // BUG-01: panels must never survive a navigation — close on route change.
  useEffect(() => {
    setActiveDropdown(null);
    setIsOpen(false);
  }, [location.pathname]);

  // D-6 float governance: one dismissible "Yeni" badge on the Perspektifler
  // nav item replaces the SocialProofToast on insights surfaces. Fresh content
  // = newest post younger than 14 days; visiting the hub dismisses it.
  const [showYeniBadge, setShowYeniBadge] = useState(false);
  useEffect(() => {
    try {
      const dismissedFor = localStorage.getItem('perspektifler_yeni_seen');
      const fresh = Date.now() - new Date(NEWEST_POST_DATE).getTime() < 14 * 24 * 3600 * 1000;
      setShowYeniBadge(fresh && dismissedFor !== NEWEST_POST_DATE);
    } catch {
      setShowYeniBadge(false);
    }
  }, []);
  useEffect(() => {
    if (location.pathname.startsWith('/perspektifler')) {
      try {
        localStorage.setItem('perspektifler_yeni_seen', NEWEST_POST_DATE);
      } catch {
        /* private mode */
      }
      setShowYeniBadge(false);
    }
  }, [location.pathname]);

  // BUG-01: close on outside click/tap.
  useEffect(() => {
    if (!activeDropdown) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [activeDropdown]);

  // BUG-01: close once the reader scrolls >100px away from where the panel opened.
  useEffect(() => {
    if (!activeDropdown) return;
    dropdownOpenScrollY.current = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - dropdownOpenScrollY.current) > 100) {
        setActiveDropdown(null);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeDropdown]);

  // Active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-10% 0px -40% 0px' },
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, label: string) => {
    trackEvent('Navbar', 'Click', label);
    setIsOpen(false);
    setActiveDropdown(null);
    if (href.startsWith('#')) {
      scrollToSection(e, href);
    }
  };

  const handleDropdownEnter = (id: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    if (dropdownOpenTimeoutRef.current) clearTimeout(dropdownOpenTimeoutRef.current);
    if (activeDropdown) {
      // A panel is already open — switch immediately.
      setActiveDropdown(id);
      return;
    }
    // Hover-intent: a drive-by cursor must not pop the panel (BUG-01).
    dropdownOpenTimeoutRef.current = window.setTimeout(() => {
      setActiveDropdown(id);
    }, 220);
  };

  const handleDropdownLeave = () => {
    if (dropdownOpenTimeoutRef.current) clearTimeout(dropdownOpenTimeoutRef.current);
    dropdownTimeoutRef.current = window.setTimeout(() => {
      setActiveDropdown(null);
    }, 200); // 200ms delay for better UX
  };

  const toggleMobileAccordion = (id: string) => {
    setMobileExpanded(mobileExpanded === id ? null : id);
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
        scrolled
          ? 'glass shadow-glow border-white/5 py-3'
          : 'bg-transparent border-transparent py-6'
      }`}
      role="navigation"
      aria-label="Ana Navigasyon"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-full">
        {/* Logo */}
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero', 'Logo')}
          className="flex items-center h-full group relative z-50 outline-none -ml-2"
          aria-label="eCyPro Anasayfa"
        >
          <EcyLogo size="sm" variant="full" />
        </a>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-8 xl:space-x-10">
          {(Object.values(NAV_ITEMS) as NavItem[]).map((item) => {
            const isDropdown = item.children && item.children.length > 0;
            const isActive = activeSection === item.href.substring(1);

            return (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions
              <div
                key={item.id}
                className="relative h-full flex items-center"
                onMouseEnter={() => isDropdown && handleDropdownEnter(item.id)}
                onMouseLeave={() => isDropdown && handleDropdownLeave()}
              >
                <a
                  href={item.href}
                  onClick={(e) =>
                    !isDropdown && handleNavClick(e, item.href, item.label[lang] || '')
                  }
                  onFocus={() => isDropdown && setActiveDropdown(item.id)}
                  data-testid={`navbar-link-${item.id}`}
                  data-active={isActive ? 'true' : 'false'}
                  className={`text-sm font-medium transition-all duration-300 flex items-center gap-1 py-4 tracking-wide outline-none ${
                    isActive
                      ? 'text-secondary'
                      : 'text-gray-300 hover:text-secondary hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  }`}
                  aria-haspopup={isDropdown}
                  aria-expanded={activeDropdown === item.id}
                  aria-controls={
                    isDropdown && item.hasMegaMenu ? `mega-menu-${item.id}` : undefined
                  }
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* BUG-02 follow-through: real lucide icons via iconName
                      (boxes render only when an icon actually exists). */}
                  {(item.icon || (item.iconName && NAV_ICON_MAP[item.iconName])) && (
                    <div
                      className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                  ${
                    isActive
                      ? 'bg-linear-to-br from-primary to-primary-dark text-white shadow-glow'
                      : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                  }
                `}
                      aria-hidden="true"
                    >
                      {item.icon ?? NAV_ICON_MAP[item.iconName as string]}
                    </div>
                  )}
                  {item.label[lang]}
                  {item.id === 'insights' && showYeniBadge && (
                    <span
                      data-testid="perspektifler-yeni-badge"
                      className="ml-1 rounded-full bg-secondary/20 border border-secondary/40 text-secondary text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5"
                    >
                      Yeni
                    </span>
                  )}
                  {isDropdown && (
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${activeDropdown === item.id ? 'rotate-180 text-secondary' : ''}`}
                    />
                  )}
                </a>

                {/* Active Indicator (Premium Underline) */}
                <span
                  className={`absolute bottom-2 left-0 h-0.5 bg-linear-to-r from-secondary to-orange-400 transition-all duration-300 ${
                    isActive
                      ? 'w-full shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                      : 'w-0 group-hover:w-full'
                  }`}
                ></span>

                {/* Mega-Menu or Simple Dropdown */}
                {isDropdown &&
                item.hasMegaMenu &&
                (item.id === 'services' || item.id === 'insights') ? (
                  <MegaMenu
                    menuId={item.id as 'services' | 'insights'}
                    isOpen={activeDropdown === item.id}
                    lang={lang}
                    onClose={() => setActiveDropdown(null)}
                    onMouseEnter={() => handleDropdownEnter(item.id)}
                    onMouseLeave={handleDropdownLeave}
                  />
                ) : (
                  isDropdown &&
                  !item.hasMegaMenu && (
                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 w-72 transition-all duration-300 transform origin-top z-50 ${
                        activeDropdown === item.id
                          ? 'opacity-100 scale-100 visible translate-y-0'
                          : 'opacity-0 scale-95 invisible -translate-y-2'
                      }`}
                      role="menu"
                    >
                      <div className="bg-surface/95 rounded-xl shadow-2xl border border-white/10 overflow-hidden py-2 ring-1 ring-black/5">
                        {item.children!.map((child) => (
                          <a
                            key={child.id}
                            href={child.href}
                            onClick={(e) => handleNavClick(e, child.href, child.label[lang] || '')}
                            className="block px-6 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium border-l-2 border-transparent hover:border-secondary outline-none group"
                            role="menuitem"
                          >
                            <span className="group-hover:translate-x-1 transition-transform duration-200 block">
                              {child.label[lang]}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Right Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Language Switcher (URL-aware) */}
          <LanguageSwitcher className="border border-white/10 rounded px-1 py-0.5" />

          {/* WhatsApp CTA */}
          <a
            href={CONTACT_CONFIG.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('Navbar', 'Click', 'WhatsApp')}
            aria-label="WhatsApp ile iletişime geç"
            className="inline-flex items-center gap-2 text-[#25D366] hover:text-white border border-[#25D366]/30 hover:bg-[#25D366]/10 px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <MessageCircle size={15} aria-hidden="true" />
            <span className="hidden xl:inline">WhatsApp</span>
          </a>

          {/* Assessment CTA */}
          <a
            href="/maturity-assessment"
            onClick={(e) => handleNavClick(e, '/maturity-assessment', 'Assessment CTA')}
            className="hidden xl:block btn-premium text-xs tracking-wider"
          >
            {lang === 'tr' ? 'ÜCRETSİZ ANALİZ' : 'FREE ANALYSIS'}
          </a>

          {/* Primary CTA — Calendly if configured, else in-app booking modal */}
          {(() => {
            const cta = getCalendlyCta('navbar');
            const useExternal = hasExternalCalendly();
            const sharedClass =
              'btn-premium-gold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]';
            return useExternal ? (
              <a
                href={cta.href}
                target={cta.target}
                rel={cta.rel}
                {...cta.dataAttrs}
                data-testid="navbar-book-call"
                onClick={() => trackEvent('Navbar', 'Click', 'Book a Call')}
                className={sharedClass}
              >
                {lang === 'tr' ? 'Görüşme Planla' : 'Book a Call'}
              </a>
            ) : (
              <button
                type="button"
                data-testid="navbar-book-call"
                {...cta.dataAttrs}
                onClick={() => {
                  trackEvent('Navbar', 'Click', 'Book a Call');
                  window.dispatchEvent(new CustomEvent('open-booking'));
                }}
                className={sharedClass}
              >
                {lang === 'tr' ? 'Görüşme Planla' : 'Book a Call'}
              </button>
            );
          })()}
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="lg:hidden text-white hover:bg-white/5 transition-colors p-2 z-50 outline-none focus:ring-2 focus:ring-secondary rounded-lg"
          data-testid="mobile-menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-neutral z-40 lg:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-28 px-8 pb-10 overflow-y-auto">
          {(Object.values(NAV_ITEMS) as NavItem[]).map((item) => {
            const isDropdown = item.children && item.children.length > 0;
            const isExpanded = mobileExpanded === item.id;

            return (
              <div key={item.id} className="mb-4 border-b border-white/5 last:border-0 pb-4">
                {isDropdown ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleMobileAccordion(item.id)}
                      className="flex items-center justify-between w-full text-left text-xl font-sans font-medium text-white py-2 outline-none focus:text-secondary"
                      aria-expanded={isExpanded}
                    >
                      <span className="flex items-center gap-3">
                        {item.iconName && NAV_ICON_MAP[item.iconName] && (
                          <span className="text-slate-400" aria-hidden="true">
                            {NAV_ICON_MAP[item.iconName]}
                          </span>
                        )}
                        {item.label[lang]}
                      </span>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="pl-4 space-y-3 border-l-2 border-white/10 ml-1 py-2">
                        {item.children!.map((child) => (
                          <a
                            key={child.id}
                            href={child.href}
                            onClick={(e) =>
                              handleNavClick(e, child.href, `Mobile ${child.label[lang]}`)
                            }
                            className="block text-base font-medium text-slate-300 hover:text-secondary py-1 outline-none focus:text-secondary"
                          >
                            {child.label[lang]}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href, `Mobile ${item.label[lang]}`)}
                    className="flex items-center gap-3 text-xl font-sans font-medium text-white hover:text-secondary py-2 outline-none focus:text-secondary"
                  >
                    {item.iconName && NAV_ICON_MAP[item.iconName] && (
                      <span className="text-slate-400" aria-hidden="true">
                        {NAV_ICON_MAP[item.iconName]}
                      </span>
                    )}
                    {item.label[lang]}
                  </a>
                )}
              </div>
            );
          })}

          {/* Mobile Actions */}
          <div className="mt-auto pt-8 space-y-4">
            <div className="flex justify-center gap-6 pb-4 border-b border-white/10">
              <LanguageSwitcher className="text-base" />
            </div>
            <a
              href={CONTACT_CONFIG.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('Navbar', 'Click', 'Mobile WhatsApp')}
              aria-label="WhatsApp ile iletişime geç"
              className="flex items-center justify-center gap-2 w-full py-3 border border-[#25D366]/40 text-[#25D366] font-bold rounded-lg hover:bg-[#25D366]/10 transition-colors"
            >
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, '#contact', 'Mobile CTA')}
              className="block text-center w-full py-4 btn-premium-gold font-bold uppercase tracking-widest rounded-lg shadow-lg active:scale-95 transition-transform"
            >
              {lang === 'tr' ? 'Tanışma Toplantısı Planla' : 'Book Discovery Call'}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};
