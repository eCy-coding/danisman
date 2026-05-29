import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Users, Tag, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

type TagAxis = 'FORMAT' | 'AUDIENCE' | 'GEO' | 'SECTOR' | 'REG' | 'TREND';
type SeriesStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HIATUS';
type MetadataTab = 'yazarlar' | 'etiketler' | 'seriler';

interface Author {
  id: string;
  slug: string;
  displayName: string;
  bioTr: string;
  bioEn: string | null;
  avatarUrl: string;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  isFounder: boolean;
}

interface TagItem {
  id: string;
  slug: string;
  labelTr: string;
  labelEn: string | null;
  axis: TagAxis;
}

interface SeriesItem {
  id: string;
  slug: string;
  titleTr: string;
  titleEn: string | null;
  descriptionTr: string;
  descriptionEn: string | null;
  coverImageUrl: string;
  totalParts: number;
  status: SeriesStatus;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TAG_AXIS_LABELS: Record<TagAxis, string> = {
  FORMAT: 'Format',
  AUDIENCE: 'Hedef Kitle',
  GEO: 'Coğrafya',
  SECTOR: 'Sektör',
  REG: 'Düzenleyici',
  TREND: 'Trend',
};

const TAG_AXIS_COLORS: Record<TagAxis, string> = {
  FORMAT: 'bg-blue-500/20 text-blue-300',
  AUDIENCE: 'bg-violet-500/20 text-violet-300',
  GEO: 'bg-emerald-500/20 text-emerald-300',
  SECTOR: 'bg-amber-500/20 text-amber-300',
  REG: 'bg-red-500/20 text-red-300',
  TREND: 'bg-cyan-500/20 text-cyan-300',
};

const SERIES_STATUS_LABELS: Record<SeriesStatus, string> = {
  ACTIVE: 'Aktif',
  COMPLETED: 'Tamamlandı',
  ON_HIATUS: 'Durduruldu',
};

const SERIES_STATUS_COLORS: Record<SeriesStatus, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-300',
  COMPLETED: 'bg-slate-500/20 text-slate-300',
  ON_HIATUS: 'bg-yellow-500/20 text-yellow-300',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Author Modal ──────────────────────────────────────────────────────────────

interface AuthorModalProps {
  author: Author | null;
  onClose: () => void;
  onSaved: () => void;
}

const AuthorModal: React.FC<AuthorModalProps> = ({ author, onClose, onSaved }) => {
  const isEdit = !!author;
  const [displayName, setDisplayName] = useState(author?.displayName ?? '');
  const [slug, setSlug] = useState(author?.slug ?? '');
  const [bioTr, setBioTr] = useState(author?.bioTr ?? '');
  const [bioEn, setBioEn] = useState(author?.bioEn ?? '');
  const [avatarUrl, setAvatarUrl] = useState(author?.avatarUrl ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(author?.linkedinUrl ?? '');
  const [twitterUrl, setTwitterUrl] = useState(author?.twitterUrl ?? '');
  const [isFounder, setIsFounder] = useState(author?.isFounder ?? false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDisplayNameChange = (val: string) => {
    setDisplayName(val);
    if (!isEdit) setSlug(toSlug(val));
  };

  const mutation = useMutation({
    mutationFn: (payload: Partial<Author>) => {
      if (isEdit) return apiClient.patch(`/admin/insights/authors/${author.id}`, payload);
      return apiClient.post('/admin/insights/authors', payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Yazar güncellendi' : 'Yazar eklendi');
      onSaved();
    },
    onError: () => toast.error('İşlem başarısız'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      displayName,
      slug,
      bioTr,
      ...(bioEn ? { bioEn } : {}),
      avatarUrl,
      ...(linkedinUrl ? { linkedinUrl } : {}),
      ...(twitterUrl ? { twitterUrl } : {}),
      isFounder,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="author-modal-title"
    >
      <div className="absolute inset-0 bg-black/60" role="presentation" onClick={onClose} />
      <div
        data-testid="author-modal"
        className="relative bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="author-modal-title" className="text-sm font-semibold text-slate-200">
            {isEdit ? 'Yazar Düzenle' : 'Yeni Yazar'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="author-displayName"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Ad Soyad <span className="text-red-400">*</span>
            </label>
            <input
              id="author-displayName"
              data-testid="author-displayName"
              type="text"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              placeholder="Emre Can Yalçın"
            />
          </div>

          <div>
            <label htmlFor="author-slug" className="block text-xs font-medium text-slate-400 mb-1">
              Slug
            </label>
            <input
              id="author-slug"
              data-testid="author-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label htmlFor="author-bioTr" className="block text-xs font-medium text-slate-400 mb-1">
              Bio (TR) <span className="text-red-400">*</span>
            </label>
            <textarea
              id="author-bioTr"
              data-testid="author-bioTr"
              value={bioTr}
              onChange={(e) => setBioTr(e.target.value)}
              required
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-y"
              placeholder="Kurucu ortak ve yönetici danışman..."
            />
          </div>

          <div>
            <label htmlFor="author-bioEn" className="block text-xs font-medium text-slate-400 mb-1">
              Bio (EN)
            </label>
            <textarea
              id="author-bioEn"
              data-testid="author-bioEn"
              value={bioEn}
              onChange={(e) => setBioEn(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-y"
            />
          </div>

          <div>
            <label
              htmlFor="author-avatarUrl"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Avatar URL <span className="text-red-400">*</span>
            </label>
            <input
              id="author-avatarUrl"
              data-testid="author-avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="author-linkedinUrl"
                className="block text-xs font-medium text-slate-400 mb-1"
              >
                LinkedIn URL
              </label>
              <input
                id="author-linkedinUrl"
                data-testid="author-linkedinUrl"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label
                htmlFor="author-twitterUrl"
                className="block text-xs font-medium text-slate-400 mb-1"
              >
                Twitter/X URL
              </label>
              <input
                id="author-twitterUrl"
                data-testid="author-twitterUrl"
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="author-isFounder"
              data-testid="author-isFounder"
              type="checkbox"
              checked={isFounder}
              onChange={(e) => setIsFounder(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            <label htmlFor="author-isFounder" className="text-sm text-slate-300">
              Kurucu ortak
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              data-testid="author-submit-btn"
              disabled={mutation.isPending}
              className="px-5 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Tag Modal ─────────────────────────────────────────────────────────────────

interface TagModalProps {
  tag: TagItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const TagModal: React.FC<TagModalProps> = ({ tag, onClose, onSaved }) => {
  const isEdit = !!tag;
  const [slug, setSlug] = useState(tag?.slug ?? '');
  const [labelTr, setLabelTr] = useState(tag?.labelTr ?? '');
  const [labelEn, setLabelEn] = useState(tag?.labelEn ?? '');
  const [axis, setAxis] = useState<TagAxis>(tag?.axis ?? 'SECTOR');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<TagItem>) => {
      if (isEdit) return apiClient.patch(`/admin/insights/tags/${tag.id}`, payload);
      return apiClient.post('/admin/insights/tags', payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Etiket güncellendi' : 'Etiket eklendi');
      onSaved();
    },
    onError: () => toast.error('İşlem başarısız'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ slug, labelTr, ...(labelEn ? { labelEn } : {}), axis });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-modal-title"
    >
      <div className="absolute inset-0 bg-black/60" role="presentation" onClick={onClose} />
      <div
        data-testid="tag-modal"
        className="relative bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="tag-modal-title" className="text-sm font-semibold text-slate-200">
            {isEdit ? 'Etiket Düzenle' : 'Yeni Etiket'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="tag-axis" className="block text-xs font-medium text-slate-400 mb-1">
              Eksen <span className="text-red-400">*</span>
            </label>
            <select
              id="tag-axis"
              data-testid="tag-axis"
              value={axis}
              onChange={(e) => setAxis(e.target.value as TagAxis)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {(Object.keys(TAG_AXIS_LABELS) as TagAxis[]).map((a) => (
                <option key={a} value={a}>
                  {TAG_AXIS_LABELS[a]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tag-slug" className="block text-xs font-medium text-slate-400 mb-1">
              Slug <span className="text-red-400">*</span>
            </label>
            <input
              id="tag-slug"
              data-testid="tag-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              placeholder="sector:sell-side"
            />
          </div>

          <div>
            <label htmlFor="tag-labelTr" className="block text-xs font-medium text-slate-400 mb-1">
              Etiket (TR) <span className="text-red-400">*</span>
            </label>
            <input
              id="tag-labelTr"
              data-testid="tag-labelTr"
              type="text"
              value={labelTr}
              onChange={(e) => setLabelTr(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label htmlFor="tag-labelEn" className="block text-xs font-medium text-slate-400 mb-1">
              Etiket (EN)
            </label>
            <input
              id="tag-labelEn"
              data-testid="tag-labelEn"
              type="text"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              data-testid="tag-submit-btn"
              disabled={mutation.isPending}
              className="px-5 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Series Modal ──────────────────────────────────────────────────────────────

interface SeriesModalProps {
  series: SeriesItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const SeriesModal: React.FC<SeriesModalProps> = ({ series, onClose, onSaved }) => {
  const isEdit = !!series;
  const [slug, setSlug] = useState(series?.slug ?? '');
  const [titleTr, setTitleTr] = useState(series?.titleTr ?? '');
  const [titleEn, setTitleEn] = useState(series?.titleEn ?? '');
  const [descriptionTr, setDescriptionTr] = useState(series?.descriptionTr ?? '');
  const [descriptionEn, setDescriptionEn] = useState(series?.descriptionEn ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(series?.coverImageUrl ?? '');
  const [totalParts, setTotalParts] = useState(String(series?.totalParts ?? ''));
  const [status, setStatus] = useState<SeriesStatus>(series?.status ?? 'ACTIVE');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleTitleTrChange = (val: string) => {
    setTitleTr(val);
    if (!isEdit) setSlug(toSlug(val));
  };

  const mutation = useMutation({
    mutationFn: (payload: Partial<SeriesItem>) => {
      if (isEdit) return apiClient.patch(`/admin/insights/series/${series.id}`, payload);
      return apiClient.post('/admin/insights/series', payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Seri güncellendi' : 'Seri eklendi');
      onSaved();
    },
    onError: () => toast.error('İşlem başarısız'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      slug,
      titleTr,
      ...(titleEn ? { titleEn } : {}),
      descriptionTr,
      ...(descriptionEn ? { descriptionEn } : {}),
      coverImageUrl,
      totalParts: parseInt(totalParts, 10),
      status,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="series-modal-title"
    >
      <div className="absolute inset-0 bg-black/60" role="presentation" onClick={onClose} />
      <div
        data-testid="series-modal"
        className="relative bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="series-modal-title" className="text-sm font-semibold text-slate-200">
            {isEdit ? 'Seri Düzenle' : 'Yeni Seri'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="series-titleTr"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Başlık (TR) <span className="text-red-400">*</span>
            </label>
            <input
              id="series-titleTr"
              data-testid="series-titleTr"
              type="text"
              value={titleTr}
              onChange={(e) => handleTitleTrChange(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              placeholder="M&A Rehberi"
            />
          </div>

          <div>
            <label htmlFor="series-slug" className="block text-xs font-medium text-slate-400 mb-1">
              Slug
            </label>
            <input
              id="series-slug"
              data-testid="series-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="series-titleEn"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Başlık (EN)
            </label>
            <input
              id="series-titleEn"
              data-testid="series-titleEn"
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="series-descriptionTr"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Açıklama (TR) <span className="text-red-400">*</span>
            </label>
            <textarea
              id="series-descriptionTr"
              data-testid="series-descriptionTr"
              value={descriptionTr}
              onChange={(e) => setDescriptionTr(e.target.value)}
              required
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-y"
            />
          </div>

          <div>
            <label
              htmlFor="series-descriptionEn"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Açıklama (EN)
            </label>
            <textarea
              id="series-descriptionEn"
              data-testid="series-descriptionEn"
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-y"
            />
          </div>

          <div>
            <label
              htmlFor="series-coverImageUrl"
              className="block text-xs font-medium text-slate-400 mb-1"
            >
              Kapak Görseli URL <span className="text-red-400">*</span>
            </label>
            <input
              id="series-coverImageUrl"
              data-testid="series-coverImageUrl"
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="series-totalParts"
                className="block text-xs font-medium text-slate-400 mb-1"
              >
                Toplam Bölüm <span className="text-red-400">*</span>
              </label>
              <input
                id="series-totalParts"
                data-testid="series-totalParts"
                type="number"
                min={2}
                value={totalParts}
                onChange={(e) => setTotalParts(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label
                htmlFor="series-status"
                className="block text-xs font-medium text-slate-400 mb-1"
              >
                Durum
              </label>
              <select
                id="series-status"
                data-testid="series-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as SeriesStatus)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                {(Object.keys(SERIES_STATUS_LABELS) as SeriesStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {SERIES_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              data-testid="series-submit-btn"
              disabled={mutation.isPending}
              className="px-5 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────

export const AdminInsightsMetadataPage: React.FC = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<MetadataTab>('yazarlar');

  // Modals
  const [authorModal, setAuthorModal] = useState<{ open: boolean; author: Author | null }>({
    open: false,
    author: null,
  });
  const [tagModal, setTagModal] = useState<{ open: boolean; tag: TagItem | null }>({
    open: false,
    tag: null,
  });
  const [seriesModal, setSeriesModal] = useState<{ open: boolean; series: SeriesItem | null }>({
    open: false,
    series: null,
  });

  // Queries
  const { data: authors } = useQuery<Author[]>({
    queryKey: ['admin-insights-authors-list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/insights/authors');
      const raw = (res as { data: { data: unknown } }).data.data;
      return (Array.isArray(raw) ? raw : []) as Author[];
    },
    enabled: activeTab === 'yazarlar',
  });

  const { data: tags } = useQuery<TagItem[]>({
    queryKey: ['admin-insights-tags-list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/insights/tags');
      const raw = (res as { data: { data: unknown } }).data.data;
      return (Array.isArray(raw) ? raw : []) as TagItem[];
    },
    enabled: activeTab === 'etiketler',
  });

  const { data: series } = useQuery<SeriesItem[]>({
    queryKey: ['admin-insights-series-list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/insights/series');
      const raw = (res as { data: { data: unknown } }).data.data;
      return (Array.isArray(raw) ? raw : []) as SeriesItem[];
    },
    enabled: activeTab === 'seriler',
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/insights/tags/${id}`),
    onSuccess: () => {
      toast.success('Etiket silindi');
      void qc.invalidateQueries({ queryKey: ['admin-insights-tags-list'] });
    },
    onError: () => toast.error('Silme başarısız'),
  });

  const authorList = authors ?? [];
  const tagList = tags ?? [];
  const seriesList = series ?? [];

  const TABS: { id: MetadataTab; label: string; icon: React.ReactNode }[] = [
    { id: 'yazarlar', label: 'Yazarlar', icon: <Users size={14} /> },
    { id: 'etiketler', label: 'Etiketler', icon: <Tag size={14} /> },
    { id: 'seriler', label: 'Seriler', icon: <BookOpen size={14} /> },
  ];

  return (
    <>
      <Helmet>
        <title>Perspektif Metadata | Admin — eCyPro</title>
      </Helmet>

      <div data-testid="metadata-page" className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-medium text-white">Perspektif Metadata</h1>
            <p className="text-slate-400 text-sm mt-1">Yazarlar, etiketler ve seriler</p>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Yazarlar ─────────────────────────────────────────────────────── */}
        {activeTab === 'yazarlar' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                type="button"
                data-testid="add-author-btn"
                onClick={() => setAuthorModal({ open: true, author: null })}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors"
              >
                <Plus size={14} />
                Yazar Ekle
              </button>
            </div>

            {authorList.length === 0 ? (
              <div
                data-testid="authors-empty-state"
                className="text-center py-16 text-slate-500 border border-dashed border-white/10 rounded-xl"
              >
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p>Henüz yazar eklenmemiş</p>
              </div>
            ) : (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-0 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 border-b border-white/10 bg-white/2">
                  <span className="w-10" />
                  <span>Ad Soyad</span>
                  <span>Slug</span>
                  <span>Kurucu</span>
                  <span />
                </div>
                {authorList.map((author) => (
                  <div
                    key={author.id}
                    data-testid={`author-row-${author.id}`}
                    className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-0 items-center px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/2 transition-colors"
                  >
                    <img
                      src={author.avatarUrl}
                      alt={author.displayName}
                      className="w-8 h-8 rounded-full object-cover mr-3"
                    />
                    <span className="text-sm text-white font-medium">{author.displayName}</span>
                    <span className="text-xs text-slate-500 font-mono">{author.slug}</span>
                    <span>
                      {author.isFounder && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-300">
                          Kurucu
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      data-testid={`edit-author-${author.id}`}
                      onClick={() => setAuthorModal({ open: true, author })}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                      aria-label="Düzenle"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Etiketler ─────────────────────────────────────────────────────── */}
        {activeTab === 'etiketler' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                type="button"
                data-testid="add-tag-btn"
                onClick={() => setTagModal({ open: true, tag: null })}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors"
              >
                <Plus size={14} />
                Etiket Ekle
              </button>
            </div>

            {tagList.length === 0 ? (
              <div
                data-testid="tags-empty-state"
                className="text-center py-16 text-slate-500 border border-dashed border-white/10 rounded-xl"
              >
                <Tag size={32} className="mx-auto mb-3 opacity-30" />
                <p>Henüz etiket eklenmemiş</p>
              </div>
            ) : (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-0 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 border-b border-white/10 bg-white/2">
                  <span>Slug</span>
                  <span>Etiket TR</span>
                  <span>Etiket EN</span>
                  <span>Eksen</span>
                  <span />
                  <span />
                </div>
                {tagList.map((tag) => (
                  <div
                    key={tag.id}
                    data-testid={`tag-row-${tag.id}`}
                    className="grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-0 items-center px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/2 transition-colors"
                  >
                    <span className="text-xs text-slate-400 font-mono">{tag.slug}</span>
                    <span className="text-sm text-white">{tag.labelTr}</span>
                    <span className="text-sm text-slate-400">{tag.labelEn ?? '—'}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${TAG_AXIS_COLORS[tag.axis]}`}
                    >
                      {TAG_AXIS_LABELS[tag.axis]}
                    </span>
                    <button
                      type="button"
                      data-testid={`edit-tag-${tag.id}`}
                      onClick={() => setTagModal({ open: true, tag })}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors ml-2"
                      aria-label="Düzenle"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      data-testid={`delete-tag-${tag.id}`}
                      onClick={() => deleteTagMutation.mutate(tag.id)}
                      disabled={deleteTagMutation.isPending}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      aria-label="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Seriler ───────────────────────────────────────────────────────── */}
        {activeTab === 'seriler' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                type="button"
                data-testid="add-series-btn"
                onClick={() => setSeriesModal({ open: true, series: null })}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors"
              >
                <Plus size={14} />
                Seri Ekle
              </button>
            </div>

            {seriesList.length === 0 ? (
              <div
                data-testid="series-empty-state"
                className="text-center py-16 text-slate-500 border border-dashed border-white/10 rounded-xl"
              >
                <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                <p>Henüz seri eklenmemiş</p>
              </div>
            ) : (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_auto_auto_auto] gap-0 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 border-b border-white/10 bg-white/2">
                  <span>Başlık</span>
                  <span>Slug</span>
                  <span>Bölüm</span>
                  <span>Durum</span>
                  <span />
                </div>
                {seriesList.map((s) => (
                  <div
                    key={s.id}
                    data-testid={`series-row-${s.id}`}
                    className="grid grid-cols-[2fr_1fr_auto_auto_auto] gap-0 items-center px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/2 transition-colors"
                  >
                    <span className="text-sm text-white font-medium">{s.titleTr}</span>
                    <span className="text-xs text-slate-400 font-mono">{s.slug}</span>
                    <span className="text-sm text-slate-300 text-center px-4">{s.totalParts}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${SERIES_STATUS_COLORS[s.status]}`}
                    >
                      {SERIES_STATUS_LABELS[s.status]}
                    </span>
                    <button
                      type="button"
                      data-testid={`edit-series-${s.id}`}
                      onClick={() => setSeriesModal({ open: true, series: s })}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors ml-2"
                      aria-label="Düzenle"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {authorModal.open && (
        <AuthorModal
          author={authorModal.author}
          onClose={() => setAuthorModal({ open: false, author: null })}
          onSaved={() => {
            setAuthorModal({ open: false, author: null });
            void qc.invalidateQueries({ queryKey: ['admin-insights-authors-list'] });
          }}
        />
      )}

      {tagModal.open && (
        <TagModal
          tag={tagModal.tag}
          onClose={() => setTagModal({ open: false, tag: null })}
          onSaved={() => {
            setTagModal({ open: false, tag: null });
            void qc.invalidateQueries({ queryKey: ['admin-insights-tags-list'] });
          }}
        />
      )}

      {seriesModal.open && (
        <SeriesModal
          series={seriesModal.series}
          onClose={() => setSeriesModal({ open: false, series: null })}
          onSaved={() => {
            setSeriesModal({ open: false, series: null });
            void qc.invalidateQueries({ queryKey: ['admin-insights-series-list'] });
          }}
        />
      )}
    </>
  );
};
