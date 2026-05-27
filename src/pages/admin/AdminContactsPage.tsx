import React, { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Mail,
  MailOpen,
  Download,
  Building2,
  Phone,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAdminEvents, type AdminEvent } from '../../hooks/useAdminEvents';
import { FilterBuilder } from '../../components/admin/filters/FilterBuilder';
import { TextFilter } from '../../components/admin/filters/TextFilter';
import { SelectFilter } from '../../components/admin/filters/SelectFilter';

interface ContactSubmission {
  id: string;
  fullName: string;
  email: string;
  company?: string;
  phone?: string;
  service?: string;
  messageTr?: string;
  messageEn?: string;
  isRead: boolean;
  createdAt: string;
}

interface ApiResponse {
  status: string;
  data: { items: ContactSubmission[]; total: number; page: number; limit: number };
}

export const AdminContactsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isReadFilter, setIsReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const queryClient = useQueryClient();

  const queryParams = isReadFilter === 'all' ? '' : `&isRead=${isReadFilter === 'read'}`;

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['admin-contacts', isReadFilter],
    queryFn: () =>
      apiClient.get<ApiResponse>(`/admin/contacts?limit=100${queryParams}`).then((r) => r.data),
    staleTime: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/contacts/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-contacts'] }),
  });

  // P62.B — real-time SSE subscription
  const onAdminEvent = useCallback(
    (evt: AdminEvent) => {
      if (evt.type === 'contact.submitted') {
        const name = (evt.payload['fullName'] as string | undefined) ?? 'Yeni lead';
        toast.success(`Yeni iletişim: ${name}`);
        queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      }
    },
    [queryClient],
  );
  useAdminEvents({ onEvent: onAdminEvent });

  const filtered = (data?.data.items ?? []).filter(
    (c) =>
      search === '' ||
      [c.fullName, c.email, c.company ?? ''].some((f) =>
        f.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  const handleSelect = (c: ContactSubmission) => {
    setSelected(c);
    if (!c.isRead) markReadMutation.mutate(c.id);
  };

  const exportCsv = () => {
    const rows = filtered.map((c) =>
      [c.fullName, c.email, c.company ?? '', c.phone ?? '', c.service ?? '', c.createdAt].join(','),
    );
    const csv = ['Name,Email,Company,Phone,Service,Date', ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const unreadCount = (data?.data.items ?? []).filter((c) => !c.isRead).length;

  // P34-T10: Lead tier badge — client-side email domain heuristic
  // (Full server-side score: GET /api/leads/:id/score)
  const getLeadTier = (email: string): { tier: string; color: string; label: string } => {
    const FREE_DOMAINS = new Set([
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'yandex.com',
      'icloud.com',
    ]);
    const domain = email.split('@')[1] ?? '';
    if (FREE_DOMAINS.has(domain)) return { tier: 'C', color: '#64748b', label: 'Cold' };
    return { tier: 'B', color: '#f59e0b', label: 'Warm' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Mail className="text-secondary" size={24} />
            Contact Submissions
            {unreadCount > 0 && (
              <span className="bg-secondary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{data?.data.total ?? 0} total submissions</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors text-sm"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div data-testid="contacts-filter-builder">
        <FilterBuilder
          activeCount={(search ? 1 : 0) + (isReadFilter !== 'all' ? 1 : 0)}
          onClearAll={() => {
            setSearch('');
            setIsReadFilter('all');
          }}
        >
          <TextFilter
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, company…"
            label="Search contacts"
          />
          <SelectFilter
            value={isReadFilter}
            onChange={(v) => setIsReadFilter(v as 'all' | 'unread' | 'read')}
            label="Read status"
            options={[
              { value: 'unread', label: 'Unread' },
              { value: 'read', label: 'Read' },
            ]}
            placeholder="All"
          />
        </FilterBuilder>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* List */}
        <div className="xl:col-span-2 space-y-2">
          {isLoading && <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="text-slate-400 text-sm py-8 text-center">No submissions found.</div>
          )}
          {filtered.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => handleSelect(c)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.id === c.id
                  ? 'bg-secondary/10 border-secondary/30'
                  : 'bg-white/3 border-white/5 hover:bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!c.isRead ? (
                      <Mail size={13} className="text-secondary shrink-0" />
                    ) : (
                      <MailOpen size={13} className="text-slate-500 shrink-0" />
                    )}
                    <span
                      className={`text-sm font-medium truncate ${!c.isRead ? 'text-white' : 'text-slate-300'}`}
                    >
                      {c.fullName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{c.email}</p>
                  {c.company && <p className="text-xs text-slate-500 truncate">{c.company}</p>}
                </div>
                <div className="shrink-0 text-right">
                  {/* P34-T10: Lead tier badge */}
                  {(() => {
                    const lt = getLeadTier(c.email);
                    return (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border mb-1 block text-center"
                        style={{
                          color: lt.color,
                          borderColor: `${lt.color}40`,
                          backgroundColor: `${lt.color}15`,
                        }}
                      >
                        {lt.tier}
                      </span>
                    );
                  })()}
                  <p className="text-xs text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                  <ChevronRight size={12} className="text-slate-600 ml-auto mt-1" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-3">
          {selected ? (
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">{selected.fullName}</h2>
                <div className="flex flex-wrap gap-3 mt-2">
                  <a
                    href={`mailto:${selected.email}`}
                    className="flex items-center gap-1.5 text-sm text-secondary hover:underline"
                  >
                    <Mail size={13} /> {selected.email}
                  </a>
                  {selected.phone && (
                    <a
                      href={`tel:${selected.phone}`}
                      className="flex items-center gap-1.5 text-sm text-slate-400"
                    >
                      <Phone size={13} /> {selected.phone}
                    </a>
                  )}
                  {selected.company && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-400">
                      <Building2 size={13} /> {selected.company}
                    </span>
                  )}
                </div>
              </div>

              {selected.service && (
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                    Service Interest
                  </span>
                  <p className="text-slate-300 text-sm mt-1">{selected.service}</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={13} className="text-slate-400" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                    Message
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed bg-white/3 rounded-xl p-4">
                  {selected.messageTr || selected.messageEn || (
                    <span className="text-slate-500 italic">No message</span>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-xs text-slate-500">
                  Received: {new Date(selected.createdAt).toLocaleString('tr-TR')}
                </span>
                <a
                  href={`mailto:${selected.email}?subject=Re: eCyPro Consultation Inquiry`}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  <Mail size={14} /> Reply
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Mail size={40} className="opacity-30 mb-3" />
              <p className="text-sm">Select a submission to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
