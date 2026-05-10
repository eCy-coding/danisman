/**
 * Breadcrumb — SEO Breadcrumb Navigasyonu
 * istek5.txt Phase 4: SEO & Geo — BreadcrumbList Schema
 *
 * Özellikler:
 * - Schema.org BreadcrumbList + JSON-LD (SEO snippet)
 * - Responsive: mobilde kısaltılmış (son 2 öğe), desktop tam
 * - Aktif (son) öğe: tıklanamaz, aria-current="page"
 * - Home ikonu (Ev) ilk öğe için
 * - i18n: "Anasayfa" / "Home" otomatik
 * - Separator: "/" veya ChevronRight
 *
 * Kullanım:
 *   <Breadcrumb items={[
 *     { label: { tr: 'Hizmetler', en: 'Services' }, href: '/services' },
 *     { label: { tr: 'Strateji', en: 'Strategy' } }, // current (no href)
 *   ]} />
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface BreadcrumbItem {
  label: { tr: string; en: string } | string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

function getLabel(item: BreadcrumbItem, lang: 'tr' | 'en'): string {
  if (typeof item.label === 'string') return item.label;
  return item.label[lang];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const { i18n } = useTranslation();
  const lang: 'tr' | 'en' = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  const allItems = [{ label: { tr: 'Anasayfa', en: 'Home' }, href: '/' }, ...items];

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: getLabel(item, lang),
      ...(item.href && { item: `https://ecypro.com${item.href}` }),
    })),
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label={lang === 'tr' ? 'Sayfa yolu' : 'Breadcrumb'}
        data-testid="breadcrumb"
        className={`flex items-center flex-wrap gap-1 text-xs text-slate-500 ${className}`}
      >
        <ol
          className="flex items-center flex-wrap gap-1"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {allItems.map((item, i) => {
            const isLast = i === allItems.length - 1;
            const label = getLabel(item, lang);
            const isHome = i === 0;

            return (
              <li
                key={i}
                className="flex items-center gap-1"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <meta itemProp="position" content={String(i + 1)} />

                {isLast ? (
                  <span
                    aria-current="page"
                    className="text-slate-300 font-medium truncate max-w-40 sm:max-w-none"
                    itemProp="name"
                  >
                    {label}
                  </span>
                ) : (
                  <>
                    <Link
                      to={item.href ?? '/'}
                      className="flex items-center gap-1 hover:text-slate-300 transition-colors focus:outline-none focus-visible:text-secondary"
                      itemProp="item"
                    >
                      {isHome && <Home size={11} aria-hidden="true" />}
                      <span itemProp="name">{label}</span>
                    </Link>
                    <ChevronRight
                      size={11}
                      className="text-slate-700 shrink-0"
                      aria-hidden="true"
                    />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
