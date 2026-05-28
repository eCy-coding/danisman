import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  ShieldAlert,
  Tag,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface PipelineData {
  DRAFT: number;
  IN_REVIEW: number;
  COPY_EDIT: number;
  SEO_REVIEW: number;
  LEGAL_REVIEW: number;
  SCHEDULED: number;
  PUBLISHED: number;
  ARCHIVED: number;
}

interface PostSummary {
  id: string;
  slug: string;
  titleTr: string;
  viewCount: number;
  avgScrollDepth: number | null;
  commentCount: number;
}

interface CommentQueueItem {
  id: string;
  authorName: string;
  bodyMd: string;
  createdAt: string;
  post: { slug: string; titleTr: string };
}

interface SeoIssue {
  id: string;
  slug: string;
  titleTr: string;
  issue: string;
}

interface TagGap {
  slug: string;
  labelTr: string;
  axis: string;
  postCount: number;
}

interface ScheduledPost {
  id: string;
  slug: string;
  titleTr: string;
  scheduledAt: string;
}

interface DashboardStats {
  pipeline: PipelineData;
  topPosts: PostSummary[];
  recentPosts: Array<{
    id: string;
    slug: string;
    titleTr: string;
    status: string;
    publishedAt: string | null;
    updatedAt: string;
  }>;
  tagGaps: TagGap[];
  seoIssues: SeoIssue[];
  commentQueue: CommentQueueItem[];
  publishCalendar: ScheduledPost[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const TAB_COUNT = 6;
const PIPELINE_STATUSES = [
  { key: 'DRAFT', label: 'Taslak', color: 'bg-neutral-600' },
  { key: 'IN_REVIEW', label: 'İncelemede', color: 'bg-blue-600' },
  { key: 'COPY_EDIT', label: 'Kopya Düzenleme', color: 'bg-indigo-600' },
  { key: 'SEO_REVIEW', label: 'SEO İnceleme', color: 'bg-purple-600' },
  { key: 'LEGAL_REVIEW', label: 'Hukuki İnceleme', color: 'bg-orange-600' },
  { key: 'SCHEDULED', label: 'Planlandı', color: 'bg-yellow-600' },
  { key: 'PUBLISHED', label: 'Yayında', color: 'bg-green-600' },
  { key: 'ARCHIVED', label: 'Arşivlendi', color: 'bg-neutral-700' },
] as const;

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['admin', 'insights', 'dashboard'],
    queryFn: () => apiClient.get('/api/v1/admin/insights/dashboard/stats').then((r) => r.data.data),
    staleTime: 60_000,
  });
}

function useModerateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/api/v1/admin/insights/comments/${id}`, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'insights', 'dashboard'] });
    },
  });
}

// ── Sub-panels ────────────────────────────────────────────────────────────────

function PipelinePanel({ data }: { data: PipelineData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {PIPELINE_STATUSES.map(({ key, label, color }) => (
        <div key={key} className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} aria-hidden="true" />
          <span className="text-2xl font-bold text-neutral-100">
            {data[key as keyof PipelineData] ?? 0}
          </span>
          <span className="text-xs text-neutral-400 text-center">{label}</span>
        </div>
      ))}
    </div>
  );
}

function PerformancePanel({ posts }: { posts: PostSummary[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayPosts = showAll ? posts : posts.slice(0, 15);

  const chartData = displayPosts.map((p) => ({
    name: p.titleTr.slice(0, 30) + (p.titleTr.length > 30 ? '…' : ''),
    görüntülenme: p.viewCount,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={Math.max(300, displayPosts.length * 30)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 30, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={200}
            tick={{ fill: '#d1d5db', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ background: '#1e1f20', border: '1px solid #374151', fontSize: 12 }}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Bar dataKey="görüntülenme" fill="#f59e0b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {posts.length > 15 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          {showAll ? 'Daha az göster' : `Tüm ${posts.length} makaleyi göster`}
        </button>
      )}
    </div>
  );
}

function CalendarPanel({ posts }: { posts: ScheduledPost[] }) {
  const byDate = posts.reduce<Record<string, ScheduledPost[]>>((acc, p) => {
    const day = new Date(p.scheduledAt).toLocaleDateString('tr-TR');
    (acc[day] ??= []).push(p);
    return acc;
  }, {});

  if (posts.length === 0) {
    return (
      <p className="text-sm text-neutral-500 italic">Önümüzdeki 30 günde planlanmış makale yok.</p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(byDate).map(([day, dayPosts]) => (
        <div key={day}>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            {day}
          </h3>
          <div className="space-y-2">
            {dayPosts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
                <span className="text-xs text-amber-400 font-mono w-14 shrink-0">
                  {new Date(p.scheduledAt).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-sm text-neutral-200 truncate">{p.titleTr}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeoPanel({ issues }: { issues: SeoIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm">Tüm yayında makalelerin SEO meta verileri tamam.</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-red-400">
        <ShieldAlert className="w-4 h-4" />
        <span className="text-sm font-medium">{issues.length} SEO sorunu bulundu</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-500 border-b border-neutral-700">
              <th className="pb-2 pr-4">Slug</th>
              <th className="pb-2 pr-4">Başlık</th>
              <th className="pb-2">Sorun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {issues.map((i) => (
              <tr key={i.id} className="text-neutral-300">
                <td className="py-2 pr-4 font-mono text-xs text-neutral-500 truncate max-w-[160px]">
                  {i.slug}
                </td>
                <td className="py-2 pr-4 truncate max-w-[240px]">{i.titleTr}</td>
                <td className="py-2 text-amber-400">{i.issue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TagGapPanel({ tags }: { tags: TagGap[] }) {
  const byAxis = tags.reduce<Record<string, TagGap[]>>((acc, t) => {
    (acc[t.axis] ??= []).push(t);
    return acc;
  }, {});

  if (tags.length === 0) {
    return <p className="text-sm text-neutral-500 italic">Tüm etiketlerin ≥5 makalesi var.</p>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(byAxis).map(([axis, axisTags]) => (
        <div key={axis}>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            {axis}
          </h3>
          <div className="flex flex-wrap gap-2">
            {axisTags.map((t) => (
              <span
                key={t.slug}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-300"
              >
                <Tag className="w-3 h-3" />
                {t.labelTr}
                <span className="text-amber-500/70">({t.postCount})</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentModerationPanel({ comments }: { comments: CommentQueueItem[] }) {
  const moderate = useModerateComment();

  if (comments.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm">Onay bekleyen yorum yok.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <div key={c.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <span className="text-sm font-medium text-neutral-200">{c.authorName}</span>
              <span className="text-xs text-neutral-500 ml-2">
                {new Date(c.createdAt).toLocaleDateString('tr-TR')}
              </span>
              <div className="text-xs text-amber-400/70 mt-0.5">{c.post.titleTr}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                title="Onayla"
                disabled={moderate.isPending}
                onClick={() => moderate.mutate({ id: c.id, status: 'APPROVED' })}
                className="p-1.5 text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
                aria-label="Yorumu onayla"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Reddet"
                disabled={moderate.isPending}
                onClick={() => moderate.mutate({ id: c.id, status: 'REJECTED' })}
                className="p-1.5 text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                aria-label="Yorumu reddet"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Spam"
                disabled={moderate.isPending}
                onClick={() => moderate.mutate({ id: c.id, status: 'SPAM' })}
                className="p-1.5 text-orange-400 hover:text-orange-300 disabled:opacity-50 transition-colors"
                aria-label="Spam olarak işaretle"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-neutral-400 line-clamp-3">{c.bodyMd}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'pipeline', label: 'Pipeline', icon: LayoutDashboard },
  { id: 'performance', label: 'Performans', icon: BarChart3 },
  { id: 'calendar', label: 'Takvim', icon: Calendar },
  { id: 'seo', label: 'SEO Sağlığı', icon: ShieldAlert },
  { id: 'tags', label: 'Etiket Analizi', icon: Tag },
  { id: 'comments', label: 'Moderasyon', icon: MessageSquare },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function AdminInsightsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('pipeline');
  const { data, isLoading, isError, refetch } = useDashboardStats();

  return (
    <>
      <Helmet>
        <title>Perspektif Editorial Dashboard — eCyPro Admin</title>
      </Helmet>

      <main className="p-6 space-y-6" aria-label="Perspektif Editorial Dashboard">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-100">Perspektif Dashboard</h1>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            aria-label="İstatistikleri yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>

        {/* Tab navigation */}
        <nav
          aria-label="Dashboard sekmeleri"
          className="flex gap-1 border-b border-neutral-800 overflow-x-auto"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`panel-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {/* Panel content */}
        {isError && (
          <div
            role="alert"
            className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-300"
          >
            Dashboard verileri yüklenemedi. Lütfen tekrar deneyin.
          </div>
        )}

        {isLoading && (
          <div aria-live="polite" aria-label="Yükleniyor" className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-neutral-800 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {data && !isLoading && (
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-label={TABS.find((t) => t.id === activeTab)?.label}
          >
            {activeTab === 'pipeline' && <PipelinePanel data={data.pipeline} />}
            {activeTab === 'performance' && <PerformancePanel posts={data.topPosts} />}
            {activeTab === 'calendar' && <CalendarPanel posts={data.publishCalendar} />}
            {activeTab === 'seo' && <SeoPanel issues={data.seoIssues} />}
            {activeTab === 'tags' && <TagGapPanel tags={data.tagGaps} />}
            {activeTab === 'comments' && <CommentModerationPanel comments={data.commentQueue} />}
          </div>
        )}

        <p className="text-xs text-neutral-600 text-right">
          Toplam sekme: {TAB_COUNT} · Recharts v2 · TanStack Query
        </p>
      </main>
    </>
  );
}
