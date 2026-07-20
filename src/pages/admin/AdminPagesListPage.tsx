/**
 * P57.4 — Static pages list.
 *
 * 17 static page'i listeler; her satır "Düzenle" linkiyle PageEdit'e.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Breadcrumb, DataTable, type Column } from '../../components/admin/ui';

interface PageItem {
  id: string;
  label: string;
  path: string;
  description: string;
}

const PAGES: PageItem[] = [
  {
    id: 'home',
    label: 'Anasayfa',
    path: '/',
    description: 'Hero, trust signals, hizmet kartları, CTA',
  },
  {
    id: 'about',
    label: 'Hakkımızda',
    path: '/about',
    description: 'Kurum hikayesi, founder, ekip',
  },
  {
    id: 'methodology',
    label: 'Metodoloji',
    path: '/methodology',
    description: '5-katmanlı engagement süreci',
  },
  {
    id: 'pricing',
    label: 'Ücretlendirme',
    path: '/pricing',
    description: 'Paketler ve yatırım aralıkları',
  },
  {
    id: 'contact',
    label: 'İletişim',
    path: '/contact',
    description: 'Discovery Call form + telefon + WhatsApp',
  },
  { id: 'faq', label: 'SSS', path: '/faq', description: 'Sık sorulan sorular' },
  { id: 'team', label: 'Ekip', path: '/team', description: 'Ekip üyeleri ve rolleri' },
  { id: 'careers', label: 'Kariyer', path: '/careers', description: 'Açık pozisyonlar' },
  {
    id: 'press',
    label: 'Press Kit',
    path: '/press',
    description: 'Medya kiti — founder bio, logo, brand',
  },
  { id: 'speaking', label: 'Konuşmacılık', path: '/speaking', description: 'Etkinlik + konferans' },
  {
    id: 'industries',
    label: 'Sektörler',
    path: '/industries',
    description: '12 sektör derin uzmanlığı',
  },
  {
    id: 'locations',
    label: 'Lokasyonlar',
    path: '/locations',
    description: 'Türkiye + Avrupa ofisleri',
  },
  { id: 'partners', label: 'Ortaklar', path: '/partners', description: 'Stratejik ortaklıklar' },
  {
    id: 'events',
    label: 'Etkinlikler',
    path: '/events',
    description: 'Yaklaşan etkinlikler + webinar',
  },
  {
    id: 'privacy',
    label: 'Gizlilik',
    path: '/privacy',
    description: 'KVKK + GDPR aydınlatma metni',
  },
  { id: 'terms', label: 'Kullanım Şartları', path: '/terms', description: 'Kullanım koşulları' },
  {
    id: 'data-rights',
    label: 'KVKK Hakları',
    path: '/data-rights',
    description: 'KVKK kapsamında veri sahibi hakları',
  },
];

const columns: Column<PageItem>[] = [
  {
    key: 'label',
    label: 'Sayfa',
    sortable: true,
    render: (r) => <span className="text-white font-semibold">{r.label}</span>,
  },
  {
    key: 'path',
    label: 'URL',
    render: (r) => <code className="text-xs text-secondary">{r.path}</code>,
  },
  {
    key: 'description',
    label: 'Açıklama',
    hideOnMobile: true,
    render: (r) => <span className="text-slate-400 text-xs">{r.description}</span>,
  },
  {
    key: 'edit',
    label: 'Eylemler',
    srOnlyLabel: true,
    align: 'right',
    render: (r) => (
      <Link
        to={`/admin/pages/${r.id}/edit`}
        className="inline-flex items-center gap-1 text-secondary text-xs hover:underline"
      >
        Düzenle <ArrowRight size={11} />
      </Link>
    ),
  },
];

export const AdminPagesListPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <header>
        <h1 className="text-2xl font-serif font-bold text-white">Statik Sayfalar</h1>
        <p className="text-sm text-slate-400 mt-1">17 sayfanın içeriği — block-based override.</p>
      </header>
      <DataTable columns={columns} data={PAGES} getId={(r) => r.id} pageSize={50} />
    </div>
  );
};

export default AdminPagesListPage;
