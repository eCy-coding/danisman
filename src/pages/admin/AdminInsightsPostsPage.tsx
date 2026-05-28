import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Edit2, Archive, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

type PostStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'COPY_EDIT'
  | 'SEO_REVIEW'
  | 'LEGAL_REVIEW'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED';

type Domain = 'M_A' | 'ESG' | 'FINTECH' | 'AILE_SIRKETI';

interface PostSummary {
  id: string;
  slug: string;
  titleTr: string;
  titleEn: string | null;
  status: PostStatus;
  primaryDomain: Domain;
  subDomain: string;
  author: { nameTr: string; slug: string } | null;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  isFeatured: boolean;
  isEditorsPick: boolean;
}

interface PostsListData {
  items: PostSummary[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<Domain, string> = {
  M_A: 'M&A',
  ESG: 'ESG',
  FINTECH: 'Fintech',
  AILE_SIRKETI: 'Aile Şirketi',
};

const DOMAIN_COLORS: Record<Domain, string> = {
  M_A: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  ESG: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  FINTECH: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  AILE_SIRKETI: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

const STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: 'Taslak',
  IN_REVIEW: 'İncelemede',
  COPY_EDIT: 'Kopya Düzenleme',
  SEO_REVIEW: 'SEO İnceleme',
  LEGAL_REVIEW: 'Hukuki İnceleme',
  SCHEDULED: 'Planlandı',
  PUBLISHED: 'Yayında',
  ARCHIVED: 'Arşiv',
};

const STATUS_COLORS: Record<PostStatus, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  IN_REVIEW: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  COPY_EDIT: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  SEO_REVIEW: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  LEGAL_REVIEW: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  SCHEDULED: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  PUBLISHED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ARCHIVED: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
};

const DOMAIN_FILTERS = ['all', 'M_A', 'ESG', 'FINTECH', 'AILE_SIRKETI'] as const;
const STATUS_FILTERS = ['all', 'DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;

// ── Archive Confirm Modal ─────────────────────────────────────────────────────

interface ArchiveModalProps {
  post: PostSummary;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}

const ArchiveConfirmModal: React.FC<ArchiveModalProps> = ({
  post,
  onConfirm,
  onClose,
  isPending,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    role="presentation"
    onKeyDown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      data-testid="post-archive-confirm-modal"
      className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-modal-title"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-full bg-amber-500/10 shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 id="archive-modal-title" className="text-white font-semibold text-lg mb-1">
            Yazıyı Arşivle
          </h3>
          <p className="text-slate-400 text-sm">
            <span className="text-white font-medium">"{post.titleTr}"</span> arşivlenecek. Bu işlemi
            geri alabilirsiniz.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          İptal
        </button>
        <button
          type="button"
          data-testid="post-archive-confirm-btn"
          onClick={onConfirm}
          disabled={isPending}
          className="px-5 py-2 text-sm font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
        >
          {isPending ? 'Arşivleniyor...' : 'Arşivle'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Page ────────────────────────────────────────────────────────────────

export const AdminInsightsPostsPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<PostSummary | null>(null);

  const params = new URLSearchParams();
  if (domainFilter !== 'all') params.set('domain', domainFilter);
  if (statusFilter !== 'all') params.set('status', statusFilter);
  if (search.trim()) params.set('q', search.trim());
  params.set('limit', '200');

  const { data, isLoading } = useQuery<PostsListData>({
    queryKey: ['admin-insights-posts', domainFilter, statusFilter, search],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/insights/posts?${params.toString()}`);
      return (res as { data: { data: PostsListData } }).data.data;
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (postId: string) => apiClient.delete(`/admin/insights/posts/${postId}`),
    onSuccess: () => {
      toast.success('Yazı arşivlendi');
      setArchiveTarget(null);
      void qc.invalidateQueries({ queryKey: ['admin-insights-posts'] });
    },
    onError: () => toast.error('Arşivleme başarısız'),
  });

  const filtered = useMemo(() => {
    const posts = data?.items ?? [];
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter((p) => p.titleTr.toLowerCase().includes(q));
  }, [data?.items, search]);

  const useVirtual = filtered.length >= 100;
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: useVirtual ? filtered.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <>
      <Helmet>
        <title>Perspektif Yazıları | Admin — eCyPro</title>
      </Helmet>

      <div data-testid="posts-page" className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-medium text-white">Perspektif Yazıları</h1>
            <p className="text-slate-400 text-sm mt-1">{data?.total ?? 0} yazı toplam</p>
          </div>
          <button
            type="button"
            data-testid="add-post-btn"
            onClick={() => navigate('/admin/insights/posts/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-900 font-bold rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />+ Yazı Ekle
          </button>
        </div>

        {/* Filter Bar */}
        <div data-testid="posts-filter-bar" className="space-y-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              data-testid="posts-search"
              placeholder="Yazı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {DOMAIN_FILTERS.map((d) => (
              <button
                key={d}
                type="button"
                data-testid={`domain-filter-${d}`}
                onClick={() => setDomainFilter(d)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  domainFilter === d
                    ? 'bg-amber-500 text-neutral-900 border-amber-500 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                {d === 'all' ? 'Tüm Alanlar' : DOMAIN_LABELS[d as Domain]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                data-testid={`status-filter-${s}`}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-amber-500 text-neutral-900 border-amber-500 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                {s === 'all' ? 'Tüm Durumlar' : STATUS_LABELS[s as PostStatus]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div
            data-testid="posts-empty-state"
            className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/5"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-400 text-lg font-serif">Henüz yazı yok</p>
            <p className="text-slate-500 text-sm mt-1">
              "+ Yazı Ekle" ile ilk Perspektif yazınızı oluşturun.
            </p>
          </div>
        ) : (
          <div
            data-testid="posts-table"
            className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px_120px_160px_80px_100px] gap-4 px-6 py-3 bg-white/5 border-b border-white/10 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <span>Başlık</span>
              <span>Alan</span>
              <span>Durum</span>
              <span>Yazar</span>
              <span>Görüntülenme</span>
              <span>İşlem</span>
            </div>

            {useVirtual ? (
              <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
                <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map((vItem) => {
                    const post = filtered[vItem.index];
                    if (!post) return null;
                    return (
                      <div
                        key={post.id}
                        style={{ position: 'absolute', top: vItem.start, width: '100%' }}
                      >
                        <PostRow
                          post={post}
                          onEdit={() => navigate(`/admin/insights/posts/${post.id}/edit`)}
                          onArchive={() => setArchiveTarget(post)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              filtered.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  onEdit={() => navigate(`/admin/insights/posts/${post.id}/edit`)}
                  onArchive={() => setArchiveTarget(post)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Archive Confirm Modal */}
      {archiveTarget && (
        <ArchiveConfirmModal
          post={archiveTarget}
          onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
          onClose={() => setArchiveTarget(null)}
          isPending={archiveMutation.isPending}
        />
      )}
    </>
  );
};

// ── Post Row ─────────────────────────────────────────────────────────────────

interface PostRowProps {
  post: PostSummary;
  onEdit: () => void;
  onArchive: () => void;
}

const PostRow: React.FC<PostRowProps> = ({ post, onEdit, onArchive }) => (
  <div className="grid grid-cols-[1fr_120px_120px_160px_80px_100px] gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center">
    <div className="min-w-0">
      <p className="text-white font-medium text-sm truncate">{post.titleTr}</p>
      <p className="text-slate-500 text-xs truncate">{post.slug}</p>
    </div>

    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border w-fit ${
        DOMAIN_COLORS[post.primaryDomain]
      }`}
    >
      {DOMAIN_LABELS[post.primaryDomain]}
    </span>

    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border w-fit ${
        STATUS_COLORS[post.status]
      }`}
    >
      {STATUS_LABELS[post.status]}
    </span>

    <span className="text-slate-400 text-xs truncate">{post.author?.nameTr ?? '—'}</span>

    <span className="text-slate-400 text-xs">{post.viewCount.toLocaleString('tr-TR')}</span>

    <div className="flex items-center gap-1">
      <button
        type="button"
        data-testid={`edit-post-${post.id}`}
        onClick={onEdit}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={`${post.titleTr} düzenle`}
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        data-testid={`archive-post-${post.id}`}
        onClick={onArchive}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        aria-label={`${post.titleTr} arşivle`}
      >
        <Archive className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);
