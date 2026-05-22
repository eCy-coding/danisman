/**
 * P57.5 — Generic admin collection CRUD page.
 *
 * Route: /admin/collections/:type
 * Backend: GET/POST/PATCH/DELETE /api/admin/collections/:type/:id
 *
 * Schema her tip için sabit field set; inline add + edit (Drawer) + delete.
 * Türkçe primary. Sandbox'ta tek dosya 7 koleksiyonu sürdürür.
 */

import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../lib/api';
import {
  Breadcrumb,
  DataTable,
  Drawer,
  FormField,
  fieldClassName,
  ConfirmDialog,
  type Column,
} from '../../components/admin/ui';

interface Item extends Record<string, unknown> {
  id: string;
  createdAt?: number;
}

interface ListResponse {
  status: string;
  data: { items: Item[]; total: number };
}

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'url';
  required?: boolean;
  tooltip?: string;
  hint?: string;
}

interface CollectionConfig {
  title: string;
  fields: FieldDef[];
  displayCols: string[]; // keys to render in DataTable
}

const CONFIGS: Record<string, CollectionConfig> = {
  testimonials: {
    title: 'Testimonials (Müşteri Sözleri)',
    fields: [
      { key: 'name', label: 'Müşteri Adı', type: 'text', required: true },
      { key: 'role', label: 'Görev / Şirket', type: 'text' },
      { key: 'quote', label: 'Söz', type: 'textarea', required: true, hint: '2-4 cümle' },
      { key: 'rating', label: 'Puan (1-5)', type: 'number' },
      { key: 'anonymized', label: 'Anonim mi?', type: 'text', hint: 'evet / hayır' },
    ],
    displayCols: ['name', 'role', 'quote'],
  },
  team: {
    title: 'Ekip Üyeleri',
    fields: [
      { key: 'name', label: 'Ad Soyad', type: 'text', required: true },
      { key: 'role', label: 'Rol', type: 'text', required: true },
      { key: 'bio', label: 'Kısa Biyografi', type: 'textarea' },
      { key: 'photoUrl', label: 'Foto URL', type: 'url' },
      { key: 'linkedin', label: 'LinkedIn', type: 'url' },
    ],
    displayCols: ['name', 'role', 'linkedin'],
  },
  'case-studies': {
    title: 'Vaka Analizleri',
    fields: [
      { key: 'title', label: 'Başlık', type: 'text', required: true },
      { key: 'industry', label: 'Sektör', type: 'text' },
      { key: 'service', label: 'Hizmet', type: 'text' },
      { key: 'challenge', label: 'Sorun', type: 'textarea' },
      { key: 'solution', label: 'Çözüm', type: 'textarea' },
      { key: 'outcome', label: 'Sonuç', type: 'textarea' },
      { key: 'anonymized', label: 'Anonim mi?', type: 'text', hint: 'evet / hayır' },
    ],
    displayCols: ['title', 'industry', 'service'],
  },
  pillars: {
    title: 'Pillar Sayfaları',
    fields: [
      {
        key: 'slug',
        label: 'Slug',
        type: 'text',
        required: true,
        tooltip: 'URL parçası, örn: stratejik-donusum',
      },
      { key: 'title', label: 'Başlık', type: 'text', required: true },
      { key: 'subtitle', label: 'Alt Başlık', type: 'text' },
      { key: 'executiveSummary', label: 'Yönetici Özeti', type: 'textarea' },
    ],
    displayCols: ['slug', 'title', 'subtitle'],
  },
  'industry-reports': {
    title: 'Sektör Raporları',
    fields: [
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'title', label: 'Başlık', type: 'text', required: true },
      { key: 'year', label: 'Yıl', type: 'number' },
      { key: 'pdfUrl', label: 'PDF URL', type: 'url' },
      { key: 'gated', label: 'Gated?', type: 'text', hint: 'evet / hayır' },
    ],
    displayCols: ['title', 'year', 'gated'],
  },
  'annual-reports': {
    title: 'Yıllık Raporlar',
    fields: [
      { key: 'year', label: 'Yıl', type: 'number', required: true },
      { key: 'headline', label: 'Manşet', type: 'text', required: true },
      { key: 'subhead', label: 'Alt başlık', type: 'text' },
      { key: 'summary', label: 'Özet', type: 'textarea' },
    ],
    displayCols: ['year', 'headline'],
  },
  'faq-items': {
    title: 'SSS Maddeleri',
    fields: [
      { key: 'question', label: 'Soru', type: 'text', required: true },
      { key: 'answer', label: 'Cevap', type: 'textarea', required: true },
      {
        key: 'category',
        label: 'Kategori',
        type: 'text',
        hint: 'genel / engagement / ücret / gizlilik',
      },
    ],
    displayCols: ['question', 'category'],
  },
};

export const AdminCollectionPage: React.FC = () => {
  const { type = '' } = useParams<{ type: string }>();
  const config = CONFIGS[type];
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Item | null>(null);

  const list = useQuery<ListResponse>({
    queryKey: ['admin-collection', type],
    queryFn: () => apiClient.get(`/admin/collections/${type}`).then((r) => r.data as ListResponse),
    enabled: !!config,
  });

  const save = useMutation({
    mutationFn: (payload: Record<string, string>) => {
      if (editing) return apiClient.patch(`/admin/collections/${type}/${editing.id}`, payload);
      return apiClient.post(`/admin/collections/${type}`, payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Güncellendi' : 'Eklendi');
      qc.invalidateQueries({ queryKey: ['admin-collection', type] });
      setDrawerOpen(false);
      setEditing(null);
      setFormData({});
    },
    onError: () => toast.error('Kayıt başarısız oldu'),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/collections/${type}/${id}`),
    onSuccess: () => {
      toast.success('Silindi');
      qc.invalidateQueries({ queryKey: ['admin-collection', type] });
      setConfirm(null);
    },
    onError: () => toast.error('Silme başarısız oldu'),
  });

  const columns: Column<Item>[] = useMemo(() => {
    if (!config) return [];
    const cols: Column<Item>[] = config.displayCols.map((k) => ({
      key: k,
      label: config.fields.find((f) => f.key === k)?.label ?? k,
      sortable: true,
      render: (r) => (
        <span className="text-slate-200 truncate inline-block max-w-xs align-middle">
          {String(r[k] ?? '')}
        </span>
      ),
    }));
    cols.push({
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(r);
              setFormData(
                Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? '')])),
              );
              setDrawerOpen(true);
            }}
            className="text-xs text-secondary hover:underline"
          >
            Düzenle
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirm(r);
            }}
            className="text-xs text-red-400 hover:underline inline-flex items-center gap-0.5"
          >
            <Trash2 size={10} /> Sil
          </button>
        </div>
      ),
    });
    return cols;
  }, [config]);

  if (!config) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Bilinmeyen koleksiyon: {type}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Yönetim', to: '/admin' },
          { label: 'İçerik', to: '/admin' },
          { label: config.title },
        ]}
      />
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">{config.title}</h1>
          <p className="text-sm text-slate-400 mt-1">Toplam: {list.data?.data?.total ?? 0}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormData({});
            setDrawerOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90"
        >
          <Plus size={14} /> Yeni Ekle
        </button>
      </header>

      <DataTable
        columns={columns}
        data={list.data?.data?.items ?? []}
        getId={(r) => r.id}
        loading={list.isLoading}
        emptyMessage="Henüz öğe yok. 'Yeni Ekle' ile başlayın."
      />

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Düzenle' : 'Yeni Ekle'}
        width="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 rounded-lg bg-white/5 text-white text-sm"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={() => save.mutate(formData)}
              disabled={save.isPending}
              className="px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold text-sm disabled:opacity-50"
            >
              {save.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {config.fields.map((f) => (
            <FormField
              key={f.key}
              label={f.label}
              required={f.required}
              tooltip={f.tooltip}
              hint={f.hint}
            >
              {f.type === 'textarea' ? (
                <textarea
                  className={`${fieldClassName} min-h-[100px]`}
                  value={formData[f.key] ?? ''}
                  onChange={(e) => setFormData((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'}
                  className={fieldClassName}
                  value={formData[f.key] ?? ''}
                  onChange={(e) => setFormData((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              )}
            </FormField>
          ))}
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        onConfirm={() => confirm && del.mutate(confirm.id)}
        onCancel={() => setConfirm(null)}
        title="Öğeyi sil"
        message="Bu öğe kalıcı olarak silinecek. Bu işlem geri alınamaz."
        variant="danger"
        confirmLabel="Evet, sil"
        loading={del.isPending}
      />
    </div>
  );
};

export default AdminCollectionPage;
