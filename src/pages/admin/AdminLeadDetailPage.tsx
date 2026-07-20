/**
 * P57.6 — Lead detail page.
 *
 * Backend: GET /api/admin/contacts/:id (existing) + notes Redis-backed.
 * Activity timeline, scoring breakdown stub, notes editor, status change.
 */

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, User, Mail, Phone, Globe } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { DataResidencyBadge } from '../../components/admin/ui/DataResidencyBadge';
import { getDefaultLocation } from '../../lib/data-residency';
import {
  Breadcrumb,
  FormField,
  fieldClassName,
  StatCard,
  EmptyState,
  ErrorState,
  getErrorMessage,
} from '../../components/admin/ui';

interface Contact {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  source?: string;
  isRead: boolean;
  createdAt: string;
  messageTr?: string;
  messageEn?: string;
}

interface ContactResponse {
  status: string;
  data: Contact;
}

interface Note {
  id: string;
  text: string;
  createdAt: number;
  author: string;
}

interface NotesResponse {
  status: string;
  data: Note[];
}

export const AdminLeadDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');

  const contact = useQuery<ContactResponse>({
    queryKey: ['admin-lead', id],
    queryFn: () => apiClient.get(`/admin/contacts/${id}`).then((r) => r.data as ContactResponse),
    enabled: !!id,
  });

  const notes = useQuery<NotesResponse>({
    queryKey: ['admin-lead-notes', id],
    queryFn: () => apiClient.get(`/admin/leads/${id}/notes`).then((r) => r.data as NotesResponse),
    enabled: !!id,
  });

  const addNote = useMutation({
    mutationFn: (text: string) => apiClient.post(`/admin/leads/${id}/notes`, { text }),
    onSuccess: () => {
      toast.success('Not eklendi');
      setNoteText('');
      qc.invalidateQueries({ queryKey: ['admin-lead-notes', id] });
    },
    onError: () => toast.error('Kaydedilemedi'),
  });

  const updateStatus = useMutation({
    mutationFn: (isRead: boolean) => apiClient.patch(`/admin/contacts/${id}`, { isRead }),
    onSuccess: () => {
      toast.success('Durum güncellendi');
      qc.invalidateQueries({ queryKey: ['admin-lead', id] });
    },
  });

  const c = contact.data?.data;
  const n = notes.data?.data ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Yönetim', to: '/admin' },
          { label: 'Lead Yönetimi', to: '/admin/contacts' },
          { label: c?.fullName ?? id },
        ]}
      />
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/contacts"
            aria-label="Lead listesine geri dön"
            className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={14} /> Geri
          </Link>
          <h1 className="text-2xl font-serif font-bold text-white">
            {c?.fullName ?? 'Yükleniyor…'}
          </h1>
        </div>
        {c && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateStatus.mutate(!c.isRead)}
              className="px-3 py-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10"
            >
              {c.isRead ? 'Okunmadı işaretle' : 'Okundu işaretle'}
            </button>
          </div>
        )}
      </header>

      {contact.isLoading ? (
        <p className="text-slate-400">Yükleniyor…</p>
      ) : contact.isError ? (
        <ErrorState
          title="Lead yüklenemedi"
          description={getErrorMessage(contact.error)}
          onRetry={() => void contact.refetch()}
        />
      ) : !c ? (
        <EmptyState
          title="Lead bulunamadı"
          description="Bu lead silinmiş veya geçersiz olabilir."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Overview */}
          <article className="lg:col-span-2 space-y-4">
            <section className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-white">İletişim Bilgileri</h2>
                <DataResidencyBadge location={getDefaultLocation('Lead')} compact={false} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <Field
                  icon={<Mail size={14} />}
                  label="E-posta"
                  value={c.email}
                  link={`mailto:${c.email}`}
                />
                {c.phone && (
                  <Field
                    icon={<Phone size={14} />}
                    label="Telefon"
                    value={c.phone}
                    link={`tel:${c.phone}`}
                  />
                )}
                {c.company && <Field icon={<User size={14} />} label="Şirket" value={c.company} />}
                {c.service && (
                  <Field icon={<Globe size={14} />} label="Hizmet İlgisi" value={c.service} />
                )}
                {c.source && <Field icon={<Globe size={14} />} label="Kaynak" value={c.source} />}
                <Field
                  icon={<User size={14} />}
                  label="Oluşturma"
                  value={new Date(c.createdAt).toLocaleString('tr-TR')}
                />
              </div>
            </section>

            {(c.messageTr || c.messageEn) && (
              <section className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-2">Mesaj</h2>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {c.messageTr ?? c.messageEn}
                </p>
              </section>
            )}

            <section className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3 inline-flex items-center gap-2">
                <MessageSquare size={14} /> Notlar
              </h2>
              <div className="space-y-3 mb-4">
                {notes.isLoading ? (
                  <p className="text-slate-500 text-sm">Yükleniyor…</p>
                ) : notes.isError ? (
                  <ErrorState
                    title="Notlar yüklenemedi"
                    description={getErrorMessage(notes.error)}
                    onRetry={() => void notes.refetch()}
                  />
                ) : n.length === 0 ? (
                  <p className="text-slate-500 text-sm">Henüz not yok.</p>
                ) : (
                  n.map((note) => (
                    <div key={note.id} className="border-l-2 border-secondary/30 pl-3 py-1">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.text}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {note.author} · {new Date(note.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <FormField label="Yeni Not">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className={`${fieldClassName} min-h-[80px]`}
                  placeholder="Mesajınızı yazın…"
                />
              </FormField>
              <button
                type="button"
                onClick={() => noteText.trim() && addNote.mutate(noteText.trim())}
                disabled={!noteText.trim() || addNote.isPending}
                className="mt-2 px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold text-sm disabled:opacity-50"
              >
                {addNote.isPending ? 'Ekleniyor…' : 'Not Ekle'}
              </button>
            </section>
          </article>

          <aside className="space-y-3">
            <StatCard
              label="Skor"
              value="—"
              hint="Otomatik lead skorlama henüz bu sayfada aktif değil (P57.6)"
            />
            <StatCard label="Etkileşim" value={n.length} hint="not sayısı" />
            <StatCard
              label="Durum"
              value={c.isRead ? 'Okundu' : 'Yeni'}
              tone={c.isRead ? 'default' : 'positive'}
            />
          </aside>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ icon: React.ReactNode; label: string; value: string; link?: string }> = ({
  icon,
  label,
  value,
  link,
}) => (
  <div>
    <p className="text-xs text-slate-400 inline-flex items-center gap-1.5 mb-0.5">
      {icon}
      {label}
    </p>
    {link ? (
      <a
        href={link}
        className="text-sm text-white hover:text-secondary transition-colors break-all"
      >
        {value}
      </a>
    ) : (
      <p className="text-sm text-white break-all">{value}</p>
    )}
  </div>
);

export default AdminLeadDetailPage;
