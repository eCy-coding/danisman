/**
 * P57.3 — Admin Blog Edit page.
 *
 * Mevcut backend (`GET/POST/PATCH/DELETE /api/admin/blog/:slug`) MDX file
 * read+write yapıyor. Bu sayfa frontmatter alanlarını form'a ayırır,
 * body'yi textarea'da gösterir, kaydederken MDX'i yeniden inşa eder.
 *
 * Tiptap rich editor henüz dep değil; basit Markdown textarea + autosave.
 * 1dk autosave (taslak status'ünde).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Eye, Trash2, ArrowLeft, RotateCw } from 'lucide-react';
import { apiClient } from '../../lib/api';
import {
  Breadcrumb,
  FormField,
  fieldClassName,
  ConfirmDialog,
  Tabs,
} from '../../components/admin/ui';

interface BlogFrontmatter {
  title: string;
  date: string;
  category: string;
  readTime: string;
  excerpt: string;
  author: string;
  lang: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: string;
  coverImage?: string;
  tags?: string;
}

interface BlogPostResponse {
  status: string;
  data: { slug: string; meta: Record<string, string>; content: string };
}

function parseBody(raw: string): string {
  const match = raw.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match?.[1]?.trim() ?? raw;
}

function buildMdx(slug: string, fm: BlogFrontmatter, body: string): string {
  const fields = Object.entries(fm)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}: "${String(v).replace(/"/g, '\\"')}"`)
    .join('\n');
  return `---\n${fields}\nslug: "${slug}"\n---\n\n${body.trim()}\n`;
}

function defaultFrontmatter(slug: string): BlogFrontmatter {
  return {
    title: slug.replace(/-/g, ' '),
    date: new Date().toISOString().slice(0, 10),
    category: 'Strateji',
    readTime: '5 dk',
    excerpt: '',
    author: 'EcyPro Consulting',
    lang: 'tr',
    status: 'draft',
  };
}

export const AdminBlogEditPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [fm, setFm] = useState<BlogFrontmatter>(defaultFrontmatter(slug));
  const [body, setBody] = useState<string>('');
  const [dirty, setDirty] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const autosaveTimer = useRef<number | null>(null);

  const query = useQuery<BlogPostResponse>({
    queryKey: ['admin-blog', slug],
    queryFn: () => apiClient.get(`/admin/blog/${slug}`).then((r) => r.data as BlogPostResponse),
    enabled: !!slug,
  });

  useEffect(() => {
    if (!query.data?.data) return;
    const meta = query.data.data.meta;
    setFm({
      title: meta.title ?? slug,
      date: meta.date ?? new Date().toISOString().slice(0, 10),
      category: meta.category ?? 'Strateji',
      readTime: meta.readTime ?? '5 dk',
      excerpt: meta.excerpt ?? '',
      author: meta.author ?? 'EcyPro Consulting',
      lang: meta.lang ?? 'tr',
      status: ((meta.status ?? 'draft') as BlogFrontmatter['status']),
      scheduledFor: meta.scheduledFor,
      coverImage: meta.coverImage,
      tags: meta.tags,
    });
    setBody(parseBody(query.data.data.content));
    setDirty(false);
  }, [query.data, slug]);

  const saveMutation = useMutation({
    mutationFn: (silent?: boolean) =>
      apiClient
        .patch(`/admin/blog/${slug}`, { content: buildMdx(slug, fm, body) })
        .then(() => silent),
    onSuccess: (silent) => {
      setDirty(false);
      if (!silent) toast.success('Yazı kaydedildi');
    },
    onError: () => toast.error('Kayıt başarısız oldu'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/admin/blog/${slug}`),
    onSuccess: () => {
      toast.success('Yazı silindi');
      navigate('/admin/blog');
    },
    onError: () => toast.error('Silme başarısız oldu'),
  });

  // Autosave taslakta
  useEffect(() => {
    if (!dirty || fm.status !== 'draft') return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      saveMutation.mutate(true);
    }, 60_000);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [dirty, fm.status, saveMutation]);

  const update = <K extends keyof BlogFrontmatter>(k: K, v: BlogFrontmatter[K]) => {
    setFm((cur) => ({ ...cur, [k]: v }));
    setDirty(true);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/admin/blog" aria-label="Blog listesine geri dön" className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-sm">
            <ArrowLeft size={14} /> Geri
          </Link>
          <h1 className="text-2xl font-serif font-bold text-white">Yazı: {fm.title}</h1>
          {dirty && <span className="text-xs text-amber-400">● kaydedilmedi</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => query.refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10"
          >
            <RotateCw size={14} /> Yenile
          </button>
          <a
            href={`/blog/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10"
          >
            <Eye size={14} /> Önizle
          </a>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 text-sm hover:bg-red-500/25"
          >
            <Trash2 size={14} /> Sil
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90 disabled:opacity-50"
          >
            <Save size={14} /> {saveMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </header>

      <Tabs
        items={[
          {
            id: 'content',
            label: 'İçerik',
            content: (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <FormField label="Başlık" required tooltip="Yazının ana başlığı">
                    <input type="text" value={fm.title} onChange={(e) => update('title', e.target.value)} className={fieldClassName} />
                  </FormField>
                  <FormField label="Özet" tooltip="Liste sayfalarında ve SEO'da görünür (max 200 karakter)">
                    <textarea
                      value={fm.excerpt}
                      onChange={(e) => update('excerpt', e.target.value)}
                      className={`${fieldClassName} min-h-[80px]`}
                      maxLength={200}
                    />
                  </FormField>
                  <FormField label="İçerik (Markdown)" hint="Markdown sözdizimi: # başlık, **kalın**, [link](url), ![görsel](url)">
                    <textarea
                      value={body}
                      onChange={(e) => {
                        setBody(e.target.value);
                        setDirty(true);
                      }}
                      className={`${fieldClassName} min-h-[400px] font-mono text-xs leading-relaxed`}
                    />
                  </FormField>
                </div>
                <aside className="space-y-3">
                  <FormField label="Durum" tooltip="Taslak = sadece admin görür; Yayında = siteye yansır; Zamanlanmış = ileri tarihte otomatik yayınlanır">
                    <select value={fm.status} onChange={(e) => update('status', e.target.value as BlogFrontmatter['status'])} className={fieldClassName}>
                      <option value="draft">Taslak</option>
                      <option value="scheduled">Zamanlanmış</option>
                      <option value="published">Yayında</option>
                    </select>
                  </FormField>
                  {fm.status === 'scheduled' && (
                    <FormField label="Yayın Tarihi">
                      <input type="datetime-local" value={fm.scheduledFor ?? ''} onChange={(e) => update('scheduledFor', e.target.value)} className={fieldClassName} />
                    </FormField>
                  )}
                  <FormField label="Kategori">
                    <input type="text" value={fm.category} onChange={(e) => update('category', e.target.value)} className={fieldClassName} />
                  </FormField>
                  <FormField label="Etiketler" hint="Virgülle ayır">
                    <input type="text" value={fm.tags ?? ''} onChange={(e) => update('tags', e.target.value)} className={fieldClassName} placeholder="strateji, m-and-a, kvkk" />
                  </FormField>
                  <FormField label="Kapak Görseli URL" tooltip="Medya kütüphanesinden veya tam URL">
                    <input type="text" value={fm.coverImage ?? ''} onChange={(e) => update('coverImage', e.target.value)} className={fieldClassName} placeholder="/uploads/cover.jpg" />
                  </FormField>
                  <FormField label="Okuma Süresi">
                    <input type="text" value={fm.readTime} onChange={(e) => update('readTime', e.target.value)} className={fieldClassName} placeholder="5 dk" />
                  </FormField>
                  <FormField label="Yazar">
                    <input type="text" value={fm.author} onChange={(e) => update('author', e.target.value)} className={fieldClassName} />
                  </FormField>
                  <FormField label="Dil">
                    <select value={fm.lang} onChange={(e) => update('lang', e.target.value)} className={fieldClassName}>
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </FormField>
                </aside>
              </div>
            ),
          },
          {
            id: 'preview',
            label: 'Önizleme',
            content: (
              <article className="prose prose-invert max-w-3xl">
                <h1>{fm.title}</h1>
                <p className="text-slate-400 text-sm">
                  {fm.date} · {fm.author} · {fm.readTime}
                </p>
                <p>{fm.excerpt}</p>
                <pre className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs whitespace-pre-wrap text-slate-300">
                  {body}
                </pre>
              </article>
            ),
          },
        ]}
      />

      <ConfirmDialog
        open={showDelete}
        onConfirm={() => {
          setShowDelete(false);
          deleteMutation.mutate();
        }}
        onCancel={() => setShowDelete(false)}
        title="Yazıyı sil"
        message={`"${fm.title}" yazısı kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        variant="danger"
        confirmLabel="Evet, sil"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminBlogEditPage;
