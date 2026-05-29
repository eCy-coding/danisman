import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Search,
  GripVertical,
  Pencil,
  Archive,
  ChevronRight,
  Folder,
  FolderOpen,
  Tag,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { VirtualTable } from '@/components/admin/ui/VirtualTable';
import type { Column } from '@/components/admin/ui/VirtualTable';

// ─── Types ────────────────────────────────────────────────────────────────────

type Domain = 'M_A' | 'ESG' | 'FINTECH' | 'AILE_SIRKETI';
type CategoryStatus = 'ACTIVE' | 'ARCHIVED';

interface InsightCategory {
  id: string;
  slug: string;
  slugEn?: string | null;
  nameTr: string;
  nameEn?: string | null;
  descTr?: string | null;
  descEn?: string | null;
  domain: Domain;
  parentId?: string | null;
  parent?: { id: string; nameTr: string; slug: string } | null;
  iconName?: string | null;
  colorAccent?: string | null;
  displayOrder: number;
  status: CategoryStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { posts: number };
}

interface CategoryListResponse {
  status: string;
  data: {
    items: InsightCategory[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Zod Schema (client-side) ─────────────────────────────────────────────────

const CategoryFormSchema = z.object({
  nameTr: z.string().min(2, 'Ad en az 2 karakter').max(120),
  nameEn: z.string().max(120).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Sadece küçük harf, rakam, tire')
    .max(150)
    .optional(),
  descTr: z.string().max(500).optional(),
  descEn: z.string().max(500).optional(),
  domain: z.enum(['M_A', 'ESG', 'FINTECH', 'AILE_SIRKETI']),
  parentId: z.string().optional(),
  iconName: z.string().max(60).optional(),
});

type CategoryFormData = z.infer<typeof CategoryFormSchema>;

// ─── Constants ───────────────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<Domain, { tr: string; accent: string }> = {
  M_A: { tr: 'M&A / Birleşme', accent: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  ESG: {
    tr: 'ESG / Sürdürülebilirlik',
    accent: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  },
  FINTECH: { tr: 'Fintech', accent: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  AILE_SIRKETI: {
    tr: 'Aile Şirketi',
    accent: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  },
};

const DOMAIN_OPTIONS = Object.entries(DOMAIN_LABELS).map(([value, { tr }]) => ({
  value: value as Domain,
  label: tr,
}));

// ─── Auto-slug generator ─────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 150);
}

// ─── SortableRow ─────────────────────────────────────────────────────────────

function SortableRow({
  category,
  onEdit,
  onArchive,
}: {
  category: InsightCategory;
  onEdit: (c: InsightCategory) => void;
  onArchive: (c: InsightCategory) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const domain = DOMAIN_LABELS[category.domain];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-fib-5 py-3 px-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
      data-testid={`category-row-${category.id}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0"
        aria-label="Sırala"
      >
        <GripVertical size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200 truncate">{category.nameTr}</span>
          {category.parent && (
            <span className="text-xs text-slate-500">
              <ChevronRight size={12} className="inline" />
              {category.parent.nameTr}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 font-mono">{category.slug}</span>
      </div>

      <span
        className={cn(
          'text-xs px-2 py-0.5 rounded border',
          domain?.accent ?? 'bg-slate-500/15 text-slate-400',
        )}
      >
        {domain?.tr ?? category.domain}
      </span>

      <span className="text-xs text-slate-400 w-16 text-right tabular-nums">
        {category._count.posts} makale
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(category)}
          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
          aria-label="Düzenle"
          data-testid={`edit-category-${category.id}`}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onArchive(category)}
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          aria-label="Arşivle"
          data-testid={`archive-category-${category.id}`}
        >
          <Archive size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── CategoryModal ────────────────────────────────────────────────────────────

function CategoryModal({
  initial,
  parentOptions,
  onClose,
  onSaved,
}: {
  initial?: InsightCategory;
  parentOptions: InsightCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      nameTr: initial?.nameTr ?? '',
      nameEn: initial?.nameEn ?? '',
      slug: initial?.slug ?? '',
      descTr: initial?.descTr ?? '',
      descEn: initial?.descEn ?? '',
      domain: initial?.domain ?? 'M_A',
      parentId: initial?.parentId ?? '',
      iconName: initial?.iconName ?? '',
    },
  });

  const nameTr = watch('nameTr');

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      apiClient.post('/admin/insights/categories', {
        ...data,
        slug: data.slug || toSlug(data.nameTr),
        parentId: data.parentId || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-insight-categories'] });
      toast.success('Kategori oluşturuldu');
      onSaved();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const msg = err?.response?.data?.error ?? 'Hata oluştu';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      apiClient.patch(`/admin/insights/categories/${initial!.id}`, {
        ...data,
        parentId: data.parentId || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-insight-categories'] });
      toast.success('Kategori güncellendi');
      onSaved();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const msg = err?.response?.data?.error ?? 'Hata oluştu';
      toast.error(msg);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: CategoryFormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Kategori Düzenle' : 'Yeni Kategori'}
      data-testid="category-modal"
    >
      <div
        className="absolute inset-0 bg-black/60"
        role="presentation"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />
      <div className="relative w-full max-w-lg bg-[#1E1F20] border border-white/10 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-fib-6 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-slate-200">
            {isEdit ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors"
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-fib-6 space-y-4"
          data-testid="category-form"
        >
          {/* Ad TR + EN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cat-nameTr" className="block text-xs text-slate-400 mb-1">
                Ad (TR) *
              </label>
              <input
                id="cat-nameTr"
                {...register('nameTr')}
                onBlur={(e) => {
                  if (!watch('slug')) setValue('slug', toSlug(e.target.value));
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                placeholder="Due Diligence"
              />
              {errors.nameTr && (
                <p className="text-xs text-red-400 mt-1">{errors.nameTr.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="cat-nameEn" className="block text-xs text-slate-400 mb-1">
                Ad (EN)
              </label>
              <input
                id="cat-nameEn"
                {...register('nameEn')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                placeholder="Due Diligence"
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="cat-slug" className="block text-xs text-slate-400 mb-1">
              Slug{' '}
              <span className="text-slate-600">
                (boş bırakırsan "{nameTr ? toSlug(nameTr) : 'otomatik'}" üretilir)
              </span>
            </label>
            <input
              id="cat-slug"
              {...register('slug')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              placeholder="due-diligence"
            />
            {errors.slug && <p className="text-xs text-red-400 mt-1">{errors.slug.message}</p>}
          </div>

          {/* Domain */}
          <div>
            <label htmlFor="cat-domain" className="block text-xs text-slate-400 mb-1">
              Domain *
            </label>
            <select
              id="cat-domain"
              {...register('domain')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
            >
              {DOMAIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#1E1F20]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Parent */}
          <div>
            <label htmlFor="cat-parentId" className="block text-xs text-slate-400 mb-1">
              Üst Kategori (L2 için)
            </label>
            <select
              id="cat-parentId"
              {...register('parentId')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
            >
              <option value="" className="bg-[#1E1F20]">
                — Yok (L1 kategori) —
              </option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1E1F20]">
                  {p.nameTr}
                </option>
              ))}
            </select>
          </div>

          {/* Açıklama */}
          <div>
            <label htmlFor="cat-descTr" className="block text-xs text-slate-400 mb-1">
              Açıklama (TR)
            </label>
            <textarea
              id="cat-descTr"
              {...register('descTr')}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
              placeholder="Kısa açıklama..."
            />
          </div>

          {/* Icon */}
          <div>
            <label htmlFor="cat-iconName" className="block text-xs text-slate-400 mb-1">
              İkon (lucide-react ismi)
            </label>
            <input
              id="cat-iconName"
              {...register('iconName')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              placeholder="Search"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              data-testid="category-form-submit"
            >
              <Check size={14} />
              {isEdit ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ArchiveConfirmModal ──────────────────────────────────────────────────────

function ArchiveConfirmModal({
  category,
  onClose,
  onConfirm,
}: {
  category: InsightCategory;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      data-testid="archive-confirm-modal"
    >
      <div
        className="absolute inset-0 bg-black/60"
        role="presentation"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />
      <div className="relative w-full max-w-sm bg-[#1E1F20] border border-white/10 rounded-xl shadow-2xl p-fib-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Kategoriyi Arşivle?</h2>
        <p className="text-sm text-slate-400 mb-2">
          <span className="text-slate-200 font-medium">{category.nameTr}</span> kategorisi
          arşivlenecek.
        </p>
        {category._count.posts > 0 && (
          <p className="text-xs text-amber-400 mb-4">
            Bu kategoride {category._count.posts} makale var. Makaleler etkilenmez ancak kategori
            gizlenir.
          </p>
        )}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
            data-testid="archive-confirm-btn"
          >
            Arşivle
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AdminInsightsCategoriesPage ──────────────────────────────────────────────

export function AdminInsightsCategoriesPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<Domain | ''>('');
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InsightCategory | undefined>();
  const [archiveTarget, setArchiveTarget] = useState<InsightCategory | undefined>();
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data, isLoading } = useQuery<CategoryListResponse>({
    queryKey: ['admin-insight-categories', domainFilter, showArchived, search],
    queryFn: () => {
      const params: Record<string, string> = { limit: '200' };
      if (domainFilter) params.domain = domainFilter;
      if (showArchived) params.status = 'ARCHIVED';
      else params.status = 'ACTIVE';
      if (search) params.search = search;
      return apiClient
        .get('/admin/insights/categories', { params })
        .then((r) => r.data as CategoryListResponse);
    },
  });

  const categories = data?.data?.items ?? [];

  // Sync ordered ids when data arrives (categories.length as proxy for new fetch)
  React.useEffect(() => {
    setOrderedIds(categories.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  const orderedCategories =
    orderedIds.length > 0
      ? (orderedIds
          .map((id) => categories.find((c) => c.id === id))
          .filter(Boolean) as InsightCategory[])
      : categories;

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/insights/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-insight-categories'] });
      toast.success('Kategori arşivlendi');
      setArchiveTarget(undefined);
    },
    onError: () => toast.error('Arşivleme başarısız'),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; displayOrder: number }[]) =>
      apiClient.patch('/admin/insights/categories/reorder', { items }),
    onError: () => toast.error('Sıralama kaydedilemedi'),
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setOrderedIds((prev) => {
        const oldIdx = prev.indexOf(active.id as string);
        const newIdx = prev.indexOf(over.id as string);
        const next = arrayMove(prev, oldIdx, newIdx);
        reorderMutation.mutate(next.map((id, idx) => ({ id, displayOrder: idx })));
        return next;
      });
    },
    [reorderMutation],
  );

  const parentOptions = categories.filter((c) => !c.parentId);

  const columns: Column<InsightCategory>[] = [
    {
      key: 'order',
      header: '',
      width: 'w-8',
      render: () => (
        <span className="text-slate-600">
          <GripVertical size={14} />
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Ad',
      render: (row) => (
        <div>
          <div className="text-sm text-slate-200 font-medium">{row.nameTr}</div>
          <div className="text-xs text-slate-500 font-mono">{row.slug}</div>
        </div>
      ),
    },
    {
      key: 'domain',
      header: 'Domain',
      width: 'w-44',
      render: (row) => {
        const d = DOMAIN_LABELS[row.domain];
        return (
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded border',
              d?.accent ?? 'bg-slate-500/15 text-slate-400',
            )}
          >
            {d?.tr ?? row.domain}
          </span>
        );
      },
    },
    {
      key: 'posts',
      header: 'Makale',
      width: 'w-24',
      render: (row) => (
        <span className="text-xs text-slate-400 tabular-nums">{row._count.posts}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-20',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setEditTarget(row);
              setModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
            aria-label="Düzenle"
            data-testid={`edit-category-${row.id}`}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setArchiveTarget(row)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            aria-label="Arşivle"
            data-testid={`archive-category-${row.id}`}
          >
            <Archive size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Perspektif Kategorileri — eCyPro Admin</title>
      </Helmet>

      <div className="space-y-fib-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Folder size={20} className="text-amber-400" />
            <div>
              <h1 className="text-golden-lg font-semibold text-slate-100">
                Perspektif Kategorileri
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {data?.data?.total ?? 0} kategori · 10K+ makale ölçeği
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditTarget(undefined);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded-lg transition-colors"
            data-testid="add-category-btn"
          >
            <Plus size={16} />
            Kategori Ekle
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap" data-testid="category-filter-bar">
          <div className="relative flex-1 min-w-48 max-w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kategori ara..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              data-testid="category-search"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['', 'M_A', 'ESG', 'FINTECH', 'AILE_SIRKETI'] as const).map((d) => {
              const label =
                d === '' ? 'Tümü' : (DOMAIN_LABELS[d as Domain]?.tr?.split(' ')[0] ?? d);
              return (
                <button
                  key={d}
                  onClick={() => setDomainFilter(d)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                    domainFilter === d
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20',
                  )}
                  data-testid={`domain-filter-${d || 'all'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="accent-amber-500"
            />
            Arşivlenenleri göster
          </label>
        </div>

        {/* Category list */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">Yükleniyor...</div>
          ) : orderedCategories.length === 0 ? (
            <div className="py-16 text-center" data-testid="empty-state">
              <FolderOpen size={32} className="mx-auto text-slate-600 mb-3" />
              <p className="text-sm text-slate-500">Kategori bulunamadı</p>
              <p className="text-xs text-slate-600 mt-1">
                "+ Kategori Ekle" butonuyla ilk kategoriyi oluşturun
              </p>
            </div>
          ) : orderedCategories.length >= 100 ? (
            // Virtual list for 100+ items
            <VirtualTable
              data={orderedCategories}
              columns={columns}
              containerHeight={560}
              virtualThreshold={100}
              getRowKey={(row) => row.id}
              emptyNode={<span>Kategori yok</span>}
              data-testid="category-virtual-table"
            />
          ) : (
            // DnD sortable list for < 100 items
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                <div data-testid="category-list">
                  {orderedCategories.map((cat) => (
                    <SortableRow
                      key={cat.id}
                      category={cat}
                      onEdit={(c) => {
                        setEditTarget(c);
                        setModalOpen(true);
                      }}
                      onArchive={setArchiveTarget}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Stats footer */}
        <div className="flex items-center gap-fib-5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Tag size={12} />
            {data?.data?.total ?? 0} aktif kategori
          </span>
          <span>·</span>
          <span>10K+ makale ölçeği için Postgres index hazır</span>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <CategoryModal
          initial={editTarget}
          parentOptions={parentOptions}
          onClose={() => {
            setModalOpen(false);
            setEditTarget(undefined);
          }}
          onSaved={() => {
            setModalOpen(false);
            setEditTarget(undefined);
          }}
        />
      )}

      {/* Archive Confirm */}
      {archiveTarget && (
        <ArchiveConfirmModal
          category={archiveTarget}
          onClose={() => setArchiveTarget(undefined)}
          onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
        />
      )}
    </>
  );
}
