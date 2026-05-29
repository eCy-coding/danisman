import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
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

interface PostDetail {
  id: string;
  slug: string;
  type: string;
  status: PostStatus;
  language: string;
  titleTr: string;
  titleEn: string | null;
  excerptTr: string;
  excerptEn: string | null;
  bodyTrMdx: string;
  bodyEnMdx: string | null;
  primaryDomain: Domain;
  subDomain: string;
  topic: string | null;
  seriesId: string | null;
  authorId: string;
  categoryId: string | null;
  coverImageUrl: string;
  coverImageAlt: string;
  ogImageUrl: string | null;
  metaTitleTr: string | null;
  metaTitleEn: string | null;
  metaDescTr: string | null;
  metaDescEn: string | null;
  noindex: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  isFeatured: boolean;
  isEditorsPick: boolean;
}

interface AuthorOption {
  id: string;
  nameTr: string;
  slug: string;
}

interface CategoryOption {
  id: string;
  nameTr: string;
  domain: Domain;
}

type Tab = 'icerik' | 'seo' | 'yayinlama';

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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ARTICLE_TYPES = [
  { value: 'ANALYSIS', label: 'Analiz' },
  { value: 'OPINION', label: 'Görüş' },
  { value: 'REPORT', label: 'Rapor' },
  { value: 'CASE_STUDY', label: 'Vaka Çalışması' },
  { value: 'INTERVIEW', label: 'Röportaj' },
  { value: 'NEWS', label: 'Haber' },
  { value: 'GUIDE', label: 'Rehber' },
  { value: 'RESEARCH', label: 'Araştırma' },
];

const DOMAIN_LABELS: Record<Domain, string> = {
  M_A: 'M&A',
  ESG: 'ESG',
  FINTECH: 'Fintech',
  AILE_SIRKETI: 'Aile Şirketi',
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

// ── Empty form state ──────────────────────────────────────────────────────────

const emptyForm = (): Omit<PostDetail, 'id'> => ({
  slug: '',
  type: 'ANALYSIS',
  status: 'DRAFT',
  language: 'TR_ONLY',
  titleTr: '',
  titleEn: null,
  excerptTr: '',
  excerptEn: null,
  bodyTrMdx: '',
  bodyEnMdx: null,
  primaryDomain: 'M_A',
  subDomain: '',
  topic: null,
  seriesId: null,
  authorId: '',
  categoryId: null,
  coverImageUrl: '',
  coverImageAlt: '',
  ogImageUrl: null,
  metaTitleTr: null,
  metaTitleEn: null,
  metaDescTr: null,
  metaDescEn: null,
  noindex: false,
  publishedAt: null,
  scheduledAt: null,
  isFeatured: false,
  isEditorsPick: false,
});

// ── Main Page ────────────────────────────────────────────────────────────────

export const AdminInsightsPostEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('icerik');
  const [form, setForm] = useState<Omit<PostDetail, 'id'>>(emptyForm());
  const [metaTrCount, setMetaTrCount] = useState({ title: 0, desc: 0 });

  // ── Fetch existing post ───────────────────────────────────────────────────

  const { data: existingPost } = useQuery<PostDetail>({
    queryKey: ['admin-insights-post', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/insights/posts/${id}`);
      return (res as { data: { data: PostDetail } }).data.data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existingPost) {
      const { id: _id, ...rest } = existingPost;
      setForm(rest);
      setMetaTrCount({
        title: (rest.metaTitleTr ?? '').length,
        desc: (rest.metaDescTr ?? '').length,
      });
    }
  }, [existingPost]);

  // ── Fetch authors + categories (for selects) ──────────────────────────────

  const { data: authors } = useQuery<AuthorOption[]>({
    queryKey: ['admin-insights-authors'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/insights/authors');
      const raw = (res as { data: { data: unknown } }).data.data;
      return (Array.isArray(raw) ? raw : []) as AuthorOption[];
    },
  });

  const { data: categories } = useQuery<CategoryOption[]>({
    queryKey: ['admin-insights-categories-list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/insights/categories?limit=200');
      return (res as { data: { data: { items: CategoryOption[] } } }).data.data.items ?? [];
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<typeof form>) => {
      if (isNew) {
        return apiClient.post('/admin/insights/posts', payload);
      }
      return apiClient.patch(`/admin/insights/posts/${id}`, payload);
    },
    onSuccess: (res) => {
      toast.success('Kaydedildi');
      if (isNew) {
        const saved = (res as { data: { data: PostDetail } }).data.data;
        navigate(`/admin/insights/posts/${saved.id}/edit`, { replace: true });
      }
      void qc.invalidateQueries({ queryKey: ['admin-insights-posts'] });
    },
    onError: () => toast.error('Kaydetme başarısız'),
  });

  const transitionMutation = useMutation({
    mutationFn: (toStatus: PostStatus) =>
      apiClient.post(`/admin/insights/posts/${id}/transition`, { toStatus }),
    onSuccess: () => {
      toast.success('Durum güncellendi');
      void qc.invalidateQueries({ queryKey: ['admin-insights-post', id] });
      void qc.invalidateQueries({ queryKey: ['admin-insights-posts'] });
    },
    onError: () => toast.error('Durum güncellenemedi'),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleTrChange = (val: string) => {
    set('titleTr', val);
    if (isNew) set('slug', toSlug(val));
  };

  const handleSaveDraft = () => {
    saveMutation.mutate({
      ...form,
      titleTr: form.titleTr || undefined,
    } as Partial<typeof form>);
  };

  const handleSubmitReview = () => {
    if (!id || isNew) return;
    transitionMutation.mutate('IN_REVIEW');
  };

  const currentStatus = existingPost?.status ?? form.status;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <title>{isNew ? 'Yeni Yazı' : form.titleTr || 'Yazı Düzenle'} | Admin — eCyPro</title>
      </Helmet>

      <div data-testid="post-edit-page" className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate('/admin/insights/posts')}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Yazı listesine dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-serif font-medium text-white">
              {isNew ? 'Yeni Yazı' : 'Yazı Düzenle'}
            </h1>
            {!isNew && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">Durum:</span>
                <span className="text-xs font-medium text-slate-300">
                  {STATUS_LABELS[currentStatus]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl w-fit">
          {(['icerik', 'seo', 'yayinlama'] as Tab[]).map((tab) => {
            const label = tab === 'icerik' ? 'İçerik' : tab === 'seo' ? 'SEO' : 'Yayınlama';
            return (
              <button
                key={tab}
                type="button"
                data-testid={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-amber-500 text-neutral-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* İçerik Tab */}
        {activeTab === 'icerik' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="titleTr" className="block text-sm font-medium text-slate-300 mb-2">
                  TR Başlık <span className="text-red-400">*</span>
                </label>
                <input
                  id="titleTr"
                  type="text"
                  data-testid="post-title-tr"
                  placeholder="Başlık..."
                  value={form.titleTr}
                  onChange={(e) => handleTitleTrChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label htmlFor="titleEn" className="block text-sm font-medium text-slate-300 mb-2">
                  EN Başlık
                </label>
                <input
                  id="titleEn"
                  type="text"
                  data-testid="post-title-en"
                  placeholder="Title..."
                  value={form.titleEn ?? ''}
                  onChange={(e) => set('titleEn', e.target.value || null)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="postSlug" className="block text-sm font-medium text-slate-300 mb-2">
                Slug
              </label>
              <input
                id="postSlug"
                type="text"
                data-testid="post-slug"
                placeholder="auto-generated-from-title"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="postType" className="block text-sm font-medium text-slate-300 mb-2">
                  Tip <span className="text-red-400">*</span>
                </label>
                <select
                  id="postType"
                  data-testid="post-type"
                  value={form.type}
                  onChange={(e) => set('type', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50"
                >
                  {ARTICLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="postDomain"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Alan <span className="text-red-400">*</span>
                </label>
                <select
                  id="postDomain"
                  data-testid="post-domain"
                  value={form.primaryDomain}
                  onChange={(e) => set('primaryDomain', e.target.value as Domain)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50"
                >
                  {(Object.keys(DOMAIN_LABELS) as Domain[]).map((d) => (
                    <option key={d} value={d}>
                      {DOMAIN_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="postSubDomain"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Alt Alan <span className="text-red-400">*</span>
                </label>
                <input
                  id="postSubDomain"
                  type="text"
                  data-testid="post-subdomain"
                  placeholder="due-diligence"
                  value={form.subDomain}
                  onChange={(e) => set('subDomain', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label
                  htmlFor="postCategory"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Kategori
                </label>
                <select
                  id="postCategory"
                  data-testid="post-category"
                  value={form.categoryId ?? ''}
                  onChange={(e) => set('categoryId', e.target.value || null)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">— Kategori Seç —</option>
                  {(categories ?? [])
                    .filter((c) => c.domain === form.primaryDomain)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameTr}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="postAuthor" className="block text-sm font-medium text-slate-300 mb-2">
                Yazar <span className="text-red-400">*</span>
              </label>
              <select
                id="postAuthor"
                data-testid="post-author"
                value={form.authorId}
                onChange={(e) => set('authorId', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50"
              >
                <option value="">— Yazar Seç —</option>
                {(authors ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nameTr}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="excerptTr"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  TR Özet <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="excerptTr"
                  data-testid="post-excerpt-tr"
                  placeholder="Kısa özet..."
                  rows={3}
                  value={form.excerptTr}
                  onChange={(e) => set('excerptTr', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
              <div>
                <label
                  htmlFor="excerptEn"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  EN Özet
                </label>
                <textarea
                  id="excerptEn"
                  data-testid="post-excerpt-en"
                  placeholder="Short excerpt..."
                  rows={3}
                  value={form.excerptEn ?? ''}
                  onChange={(e) => set('excerptEn', e.target.value || null)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bodyTrMdx" className="block text-sm font-medium text-slate-300 mb-2">
                TR İçerik (MDX) <span className="text-red-400">*</span>
              </label>
              <textarea
                id="bodyTrMdx"
                data-testid="post-body-tr"
                placeholder="# Başlık&#10;&#10;İçerik buraya..."
                rows={20}
                value={form.bodyTrMdx}
                onChange={(e) => set('bodyTrMdx', e.target.value)}
                className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:border-amber-500/50 resize-y"
              />
            </div>

            <div>
              <label htmlFor="bodyEnMdx" className="block text-sm font-medium text-slate-300 mb-2">
                EN İçerik (MDX)
              </label>
              <textarea
                id="bodyEnMdx"
                data-testid="post-body-en"
                placeholder="# Title&#10;&#10;Content here..."
                rows={12}
                value={form.bodyEnMdx ?? ''}
                onChange={(e) => set('bodyEnMdx', e.target.value || null)}
                className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:border-amber-500/50 resize-y"
              />
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="coverImageUrl"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Kapak Görseli URL <span className="text-red-400">*</span>
                </label>
                <input
                  id="coverImageUrl"
                  type="text"
                  data-testid="post-cover-url"
                  placeholder="https://..."
                  value={form.coverImageUrl}
                  onChange={(e) => set('coverImageUrl', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label
                  htmlFor="coverImageAlt"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Kapak Alt Metni <span className="text-red-400">*</span>
                </label>
                <input
                  id="coverImageAlt"
                  type="text"
                  data-testid="post-cover-alt"
                  placeholder="Görsel açıklaması..."
                  value={form.coverImageAlt}
                  onChange={(e) => set('coverImageAlt', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ogImageUrl" className="block text-sm font-medium text-slate-300 mb-2">
                OG Görseli URL
              </label>
              <input
                id="ogImageUrl"
                type="text"
                data-testid="post-og-url"
                placeholder="https://... (boş bırakılırsa kapak görseli kullanılır)"
                value={form.ogImageUrl ?? ''}
                onChange={(e) => set('ogImageUrl', e.target.value || null)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="metaTitleTr"
                  className="flex justify-between text-sm font-medium text-slate-300 mb-2"
                >
                  <span>TR Meta Başlık</span>
                  <span className={metaTrCount.title > 60 ? 'text-red-400' : 'text-slate-500'}>
                    {metaTrCount.title}/60
                  </span>
                </label>
                <input
                  id="metaTitleTr"
                  type="text"
                  data-testid="post-meta-title-tr"
                  placeholder="SEO başlığı..."
                  maxLength={60}
                  value={form.metaTitleTr ?? ''}
                  onChange={(e) => {
                    set('metaTitleTr', e.target.value || null);
                    setMetaTrCount((p) => ({ ...p, title: e.target.value.length }));
                  }}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label
                  htmlFor="metaTitleEn"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  EN Meta Başlık
                </label>
                <input
                  id="metaTitleEn"
                  type="text"
                  data-testid="post-meta-title-en"
                  placeholder="SEO title..."
                  maxLength={60}
                  value={form.metaTitleEn ?? ''}
                  onChange={(e) => set('metaTitleEn', e.target.value || null)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="metaDescTr"
                  className="flex justify-between text-sm font-medium text-slate-300 mb-2"
                >
                  <span>TR Meta Açıklama</span>
                  <span className={metaTrCount.desc > 160 ? 'text-red-400' : 'text-slate-500'}>
                    {metaTrCount.desc}/160
                  </span>
                </label>
                <textarea
                  id="metaDescTr"
                  data-testid="post-meta-desc-tr"
                  placeholder="Arama motoru açıklaması..."
                  maxLength={160}
                  rows={3}
                  value={form.metaDescTr ?? ''}
                  onChange={(e) => {
                    set('metaDescTr', e.target.value || null);
                    setMetaTrCount((p) => ({ ...p, desc: e.target.value.length }));
                  }}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
              <div>
                <label
                  htmlFor="metaDescEn"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  EN Meta Açıklama
                </label>
                <textarea
                  id="metaDescEn"
                  data-testid="post-meta-desc-en"
                  placeholder="Search engine description..."
                  maxLength={160}
                  rows={3}
                  value={form.metaDescEn ?? ''}
                  onChange={(e) => set('metaDescEn', e.target.value || null)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="noindex"
                data-testid="post-noindex"
                checked={form.noindex}
                onChange={(e) => set('noindex', e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-amber-500"
              />
              <label htmlFor="noindex" className="text-sm text-slate-300">
                Bu sayfayı arama motorlarından gizle (noindex)
              </label>
            </div>
          </div>
        )}

        {/* Yayınlama Tab */}
        {activeTab === 'yayinlama' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="publishedAt"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Yayın Tarihi
                </label>
                <input
                  id="publishedAt"
                  type="datetime-local"
                  data-testid="post-published-at"
                  value={form.publishedAt ? form.publishedAt.slice(0, 16) : ''}
                  onChange={(e) =>
                    set(
                      'publishedAt',
                      e.target.value ? new Date(e.target.value).toISOString() : null,
                    )
                  }
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label
                  htmlFor="scheduledAt"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Planlanan Tarih
                </label>
                <input
                  id="scheduledAt"
                  type="datetime-local"
                  data-testid="post-scheduled-at"
                  value={form.scheduledAt ? form.scheduledAt.slice(0, 16) : ''}
                  onChange={(e) =>
                    set(
                      'scheduledAt',
                      e.target.value ? new Date(e.target.value).toISOString() : null,
                    )
                  }
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isFeatured"
                  data-testid="post-is-featured"
                  checked={form.isFeatured}
                  onChange={(e) => set('isFeatured', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-amber-500"
                />
                <label htmlFor="isFeatured" className="text-sm text-slate-300">
                  Öne Çıkar (Featured)
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isEditorsPick"
                  data-testid="post-editors-pick"
                  checked={form.isEditorsPick}
                  onChange={(e) => set('isEditorsPick', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-amber-500"
                />
                <label htmlFor="isEditorsPick" className="text-sm text-slate-300">
                  Editörün Seçimi
                </label>
              </div>
            </div>

            {!isNew && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-sm font-medium text-slate-300 mb-3">Mevcut Durum</p>
                <p className="text-white font-semibold mb-4">{STATUS_LABELS[currentStatus]}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-white/10">
          <button
            type="button"
            onClick={() => navigate('/admin/insights/posts')}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Geri Dön
          </button>

          <div className="flex items-center gap-3">
            {!isNew && currentStatus === 'DRAFT' && (
              <button
                type="button"
                data-testid="submit-review-btn"
                onClick={handleSubmitReview}
                disabled={transitionMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Değerlendirmeye Gönder
              </button>
            )}
            <button
              type="button"
              data-testid="save-draft-btn"
              onClick={handleSaveDraft}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-900 font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Kaydediliyor...' : 'Taslak Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
