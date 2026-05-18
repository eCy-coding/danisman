/**
 * P57.1 — Admin Breadcrumb (route-aware).
 *
 * useLocation parse → segment[] → label map → render.
 * Pages can also pass explicit `items` to override.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

const LABEL_MAP: Record<string, string> = {
  admin: 'Yönetim',
  dashboard: 'Pano',
  contacts: 'İletişim',
  newsletter: 'Bülten',
  campaigns: 'Kampanyalar',
  blog: 'Blog',
  bookings: 'Randevular',
  services: 'Hizmetler',
  pages: 'Sayfalar',
  leads: 'Lead Yönetimi',
  crm: 'CRM',
  users: 'Kullanıcılar',
  sessions: 'Oturumlar',
  audit: 'Audit Log',
  'audit-log': 'Audit Log',
  analytics: 'Analitik',
  settings: 'Ayarlar',
  media: 'Medya Kütüphanesi',
  help: 'Yardım',
  profile: 'Profil',
  notifications: 'Bildirimler',
  ai: 'AI Asistan',
};

function deriveItems(pathname: string): BreadcrumbItem[] {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'admin') return [];
  const items: BreadcrumbItem[] = [{ label: 'Yönetim', to: '/admin' }];
  let path = '';
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    path += `/${p}`;
    items.push({
      label: LABEL_MAP[p] ?? p,
      to: i < parts.length - 1 ? `/admin${path}` : undefined,
    });
  }
  return items;
}

export const Breadcrumb: React.FC<{ items?: BreadcrumbItem[] }> = ({ items }) => {
  const { pathname } = useLocation();
  const trail = items ?? deriveItems(pathname);
  if (trail.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex items-center gap-1.5 flex-wrap">
        {trail.map((item, idx) => {
          const isLast = idx === trail.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              {idx === 0 && <Home size={12} className="text-slate-500" aria-hidden="true" />}
              {item.to && !isLast ? (
                <Link to={item.to} className="text-slate-400 hover:text-white transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-white font-semibold' : 'text-slate-400'}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight size={12} className="text-slate-600" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
