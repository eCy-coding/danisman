/**
 * StickyTableOfContents — Blog/Makale İçindekiler Tablosu
 * istek5.txt Phase 2: UI/UX + Phase 3: Media/Content Reading
 *
 * - `h2` ve `h3` başlıklarını DOM'dan otomatik parse eder
 * - IntersectionObserver: görüntüdeki başlık aktif olarak vurgulanır
 * - Scroll progress yüzdesi gösterir
 * - Mobilde gizli (lg:block), masaüstünde sticky sağ sütun
 * - Smooth scroll + URL hash günceller
 * - A11y: nav + aria-label + aria-current
 *
 * Kullanım:
 *   <StickyTableOfContents contentRef={articleRef} />
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { List, ChevronRight, BookOpen } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface TOCItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface StickyTableOfContentsProps {
  contentRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

function extractHeadings(container: HTMLElement): TOCItem[] {
  const nodes = container.querySelectorAll('h2, h3');
  const items: TOCItem[] = [];
  nodes.forEach((node) => {
    const el = node as HTMLElement;
    if (!el.id) {
      el.id =
        el.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9ğüşıöç]+/gi, '-')
          .replace(/^-|-$/g, '') ?? `h-${items.length}`;
    }
    items.push({
      id: el.id,
      text: el.textContent ?? '',
      level: el.tagName === 'H2' ? 2 : 3,
    });
  });
  return items;
}

export const StickyTableOfContents: React.FC<StickyTableOfContentsProps> = ({
  contentRef,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  // Parse headings from content
  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new MutationObserver(() => {
      if (contentRef.current) {
        setItems(extractHeadings(contentRef.current));
      }
    });

    setItems(extractHeadings(contentRef.current));
    observer.observe(contentRef.current, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [contentRef]);

  // Active heading tracking + scroll progress
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    // Scroll progress within the article
    const rect = el.getBoundingClientRect();
    const totalHeight = el.scrollHeight - window.innerHeight;
    const scrolled = -rect.top;
    setProgress(Math.min(100, Math.max(0, (scrolled / totalHeight) * 100)));

    // Active heading: last one above viewport top
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((h): h is HTMLElement => h !== null);

    let current = '';
    headings.forEach((h) => {
      const hRect = h.getBoundingClientRect();
      if (hRect.top <= 100) current = h.id;
    });
    if (current) setActiveId(current);
  }, [items, contentRef]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollTo = (id: string): void => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };

  if (items.length < 2) return null;

  return (
    <aside
      data-testid="table-of-contents"
      aria-label={lang === 'tr' ? 'İçindekiler tablosu' : 'Table of contents'}
      className={`hidden lg:block w-56 shrink-0 ${className}`}
    >
      <div className="sticky top-28 space-y-3">
        {/* Header */}
        <button
          type="button"
          onClick={() => setCollapsed((p) => !p)}
          className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
          aria-expanded={!collapsed}
          aria-controls="toc-list"
        >
          <span className="flex items-center gap-1.5">
            <List size={12} aria-hidden="true" />
            {lang === 'tr' ? 'İçindekiler' : 'Contents'}
          </span>
          <span className="text-secondary font-bold">{Math.round(progress)}%</span>
        </button>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>

        {/* List */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.nav
              id="toc-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <ol className="space-y-1 border-l border-white/8 pl-3">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => scrollTo(item.id)}
                      aria-current={activeId === item.id ? 'location' : undefined}
                      className={`flex items-center gap-1 text-xs leading-relaxed text-left w-full transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded ${
                        item.level === 3 ? 'pl-3' : ''
                      } ${
                        activeId === item.id
                          ? 'text-secondary font-medium'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {activeId === item.id && (
                        <ChevronRight
                          size={10}
                          className="shrink-0 text-secondary"
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate">{item.text}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Reading time estimate */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <BookOpen size={10} aria-hidden="true" />
          <span>
            {lang === 'tr'
              ? `${Math.ceil(items.length * 0.8)} dk okuma süresi`
              : `~${Math.ceil(items.length * 0.8)} min read`}
          </span>
        </div>
      </div>
    </aside>
  );
};
