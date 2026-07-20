/**
 * P57.8 — Media library.
 *
 * Drag-drop upload + grid browse. Backend POST /api/admin/media/upload
 * (Multer + Sharp resize + AVIF/WebP). Bu sayfa stub — gerçek dosya
 * yükleme middleware'i ENV `UPLOADS_DIR` ile aktif.
 */

import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Breadcrumb, EmptyState, ConfirmDialog, AdminQueryState } from '../../components/admin/ui';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  createdAt: number;
}

interface ListResponse {
  status: string;
  data: { items: MediaItem[]; total: number };
}

export const AdminMediaLibraryPage: React.FC = () => {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [confirmDel, setConfirmDel] = useState<MediaItem | null>(null);

  const list = useQuery<ListResponse>({
    queryKey: ['admin-media'],
    queryFn: () => apiClient.get('/admin/media').then((r) => r.data as ListResponse),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/media/${id}`),
    onSuccess: () => {
      toast.success('Görsel silindi');
      qc.invalidateQueries({ queryKey: ['admin-media'] });
      setConfirmDel(null);
    },
    onError: () => toast.error('Silme başarısız oldu'),
  });

  const upload = async (file: File) => {
    setPending(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await apiClient.post('/admin/media/upload', form, {
        headers: { 'content-type': 'multipart/form-data' },
      });
      toast.success(`Yüklendi: ${file.name}`);
      qc.invalidateQueries({ queryKey: ['admin-media'] });
    } catch {
      toast.error('Yükleme başarısız oldu');
    } finally {
      setPending(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  const items = list.data?.data?.items ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">Medya Kütüphanesi</h1>
          <p className="text-sm text-slate-400 mt-1">Toplam: {list.data?.data?.total ?? 0}</p>
        </div>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold disabled:opacity-50"
        >
          <UploadCloud size={14} /> {pending ? 'Yükleniyor…' : 'Yükle'}
        </button>
        <input
          type="file"
          ref={fileInput}
          className="sr-only"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </header>

      <div
        role="region"
        aria-label="Dosya sürükle-bırak alanı"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center hover:border-secondary/40 transition-colors"
      >
        <UploadCloud size={28} className="text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm text-slate-300">
          Dosyayı buraya sürükleyin veya "Yükle" düğmesini kullanın
        </p>
        <p className="text-xs text-slate-500 mt-1">JPG/PNG/WebP/AVIF · max 10MB</p>
      </div>

      <AdminQueryState
        isLoading={list.isLoading}
        isError={list.isError}
        error={list.error}
        isEmpty={items.length === 0}
        onRetry={() => void list.refetch()}
        empty={
          <EmptyState
            title="Henüz görsel yok"
            description="İlk görseli yüklemek için yukarıdaki düğmeyi kullanın."
            icon={<ImageIcon size={24} />}
          />
        }
        errorTitle="Medya listesi yüklenemedi"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((m) => (
            <article
              key={m.id}
              className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden group"
            >
              <div className="aspect-video bg-white/5 overflow-hidden">
                {}
                <img src={m.url} alt={m.alt ?? m.filename} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-xs text-white truncate">{m.filename}</p>
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                  <span>{m.width && m.height ? `${m.width}×${m.height}` : '—'}</span>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(m)}
                    className="text-red-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    <Trash2 size={10} /> Sil
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AdminQueryState>

      <ConfirmDialog
        open={!!confirmDel}
        onConfirm={() => confirmDel && del.mutate(confirmDel.id)}
        onCancel={() => setConfirmDel(null)}
        title="Görseli sil"
        message={`"${confirmDel?.filename}" silinecek. Bu işlem geri alınamaz.`}
        variant="danger"
        confirmLabel="Evet, sil"
        loading={del.isPending}
      />
    </div>
  );
};

export default AdminMediaLibraryPage;
