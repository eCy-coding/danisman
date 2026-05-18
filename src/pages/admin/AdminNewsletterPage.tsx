import React, { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, Download, Trash2, Search, Users } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAdminEvents, type AdminEvent } from '../../hooks/useAdminEvents';

interface Subscriber {
  id: string;
  email: string;
  consent: boolean;
  source?: string;
  subscribedAt: string;
  unsubscribedAt?: string | null;
}

interface ApiResponse {
  status: string;
  data: { items: Subscriber[]; total: number };
}

export const AdminNewsletterPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'unsubscribed'>('active');
  const queryClient = useQueryClient();

  const activeParam = activeFilter === 'all' ? '' : `&active=${activeFilter === 'active'}`;

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['admin-newsletter', activeFilter],
    queryFn: () =>
      apiClient.get<ApiResponse>(`/admin/newsletter?limit=200${activeParam}`).then((r) => r.data),
    staleTime: 30_000,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/newsletter/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-newsletter'] }),
  });

  // P62.B — real-time SSE subscription
  const onAdminEvent = useCallback(
    (evt: AdminEvent) => {
      if (evt.type === 'newsletter.subscribed') {
        const email = (evt.payload['email'] as string | undefined) ?? '';
        toast.success(`Yeni abone: ${email}`);
        queryClient.invalidateQueries({ queryKey: ['admin-newsletter'] });
      }
    },
    [queryClient],
  );
  useAdminEvents({ onEvent: onAdminEvent });

  const filtered = (data?.data.items ?? []).filter(
    (s) => search === '' || s.email.toLowerCase().includes(search.toLowerCase()),
  );

  const exportCsv = () => {
    const rows = filtered.map((s) => [s.email, s.source ?? '', s.subscribedAt].join(','));
    const csv = ['Email,Source,SubscribedAt', ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="text-secondary" size={24} />
            Newsletter Subscribers
          </h1>
          <p className="text-slate-400 text-sm mt-1">{data?.data.total ?? 0} total</p>
        </div>
        <button type="button"
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors text-sm"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm outline-none focus:border-secondary/50"
          />
        </div>
        {(['all', 'active', 'unsubscribed'] as const).map((f) => (
          <button type="button"
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              activeFilter === f
                ? 'bg-secondary text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 text-xs font-medium text-slate-500 uppercase tracking-widest px-6 py-3 border-b border-white/5">
          <div className="col-span-5">Email</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-3">Subscribed</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {isLoading && <div className="text-center py-10 text-slate-400 text-sm">Loading…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No subscribers found.</div>
        )}

        <div className="divide-y divide-white/5">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-12 items-center px-6 py-3 hover:bg-white/2 transition-colors"
            >
              <div className="col-span-5 flex items-center gap-2">
                <Mail size={13} className="text-slate-500 shrink-0" />
                <span className="text-sm text-slate-300 truncate">{s.email}</span>
              </div>
              <div className="col-span-2 text-xs text-slate-400">{s.source ?? '—'}</div>
              <div className="col-span-3 text-xs text-slate-400">
                {new Date(s.subscribedAt).toLocaleDateString('tr-TR')}
              </div>
              <div className="col-span-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.unsubscribedAt
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}
                >
                  {s.unsubscribedAt ? 'Unsub' : 'Active'}
                </span>
              </div>
              <div className="col-span-1 text-right">
                {!s.unsubscribedAt && (
                  <button type="button"
                    onClick={() => removeMutation.mutate(s.id)}
                    disabled={removeMutation.isPending}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Unsubscribe"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
