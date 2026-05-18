/**
 * P58 — AdminPageEdit (static page block override).
 *
 * Minimal block override editor: title + heroSubtitle + body free-form text.
 * Block editor (Hero/Section/FAQ/CTA composable blocks) P59'da geliştirilecek.
 * Backend GET/PATCH /api/admin/content/page/:pageId (Redis-backed).
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Breadcrumb, FormField, fieldClassName } from '../../components/admin/ui';

interface PageOverride {
  title?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface OverrideResponse {
  status: string;
  data: PageOverride;
}

export const AdminPageEditPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PageOverride>({});

  const query = useQuery<OverrideResponse>({
    queryKey: ['admin-page-override', id],
    queryFn: () => apiClient.get(`/admin/content/page/${id}`).then((r) => r.data as OverrideResponse),
    enabled: !!id,
  });

  useEffect(() => {
    if (query.data?.data) setData(query.data.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: (payload: PageOverride) => apiClient.patch(`/admin/content/page/${id}`, payload),
    onSuccess: () => toast.success('Sayfa içeriği güncellendi'),
    onError: () => toast.error('Kayıt başarısız oldu'),
  });

  const upd = <K extends keyof PageOverride>(k: K, v: PageOverride[K]) => setData((d) => ({ ...d, [k]: v }));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Yönetim', to: '/admin' },
        { label: 'Sayfalar', to: '/admin/pages' },
        { label: id },
      ]} />
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/pages')}
            aria-label="Sayfa listesine geri dön"
            className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={14} /> Geri
          </button>
          <h1 className="text-2xl font-serif font-bold text-white">Sayfa: {id}</h1>
        </div>
        <button
          type="button"
          onClick={() => save.mutate(data)}
          disabled={save.isPending}
          aria-label="Sayfa içeriğini kaydet"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90 disabled:opacity-50"
        >
          <Save size={14} /> {save.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </header>

      <div className="max-w-3xl space-y-4">
        <FormField label="Başlık" tooltip="Sayfanın H1'i (override).">
          <input type="text" value={data.title ?? ''} onChange={(e) => upd('title', e.target.value)} className={fieldClassName} />
        </FormField>
        <FormField label="Hero Başlık" tooltip="Üst banner başlığı.">
          <input type="text" value={data.heroTitle ?? ''} onChange={(e) => upd('heroTitle', e.target.value)} className={fieldClassName} />
        </FormField>
        <FormField label="Hero Alt Başlık">
          <textarea value={data.heroSubtitle ?? ''} onChange={(e) => upd('heroSubtitle', e.target.value)} className={`${fieldClassName} min-h-[80px]`} />
        </FormField>
        <FormField label="Gövde" hint="Markdown desteklenir. Block editor P59'da gelir.">
          <textarea value={data.body ?? ''} onChange={(e) => upd('body', e.target.value)} className={`${fieldClassName} min-h-[300px] font-mono text-xs`} />
        </FormField>
        <h2 className="text-sm font-semibold text-white pt-4 border-t border-white/5">SEO</h2>
        <FormField label="Meta Title" hint="Tarayıcı sekmesi ve arama sonuçları başlığı (max 60 karakter)">
          <input type="text" value={data.metaTitle ?? ''} onChange={(e) => upd('metaTitle', e.target.value)} className={fieldClassName} maxLength={60} />
        </FormField>
        <FormField label="Meta Description" hint="Arama sonuçlarındaki kısa açıklama (max 160 karakter)">
          <textarea value={data.metaDescription ?? ''} onChange={(e) => upd('metaDescription', e.target.value)} className={`${fieldClassName} min-h-[80px]`} maxLength={160} />
        </FormField>

        <Link to="/admin/pages" className="text-xs text-slate-400 hover:text-white inline-block mt-4">
          ← Tüm sayfaları gör
        </Link>
      </div>
    </div>
  );
};

export default AdminPageEditPage;
