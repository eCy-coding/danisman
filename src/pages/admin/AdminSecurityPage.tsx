/**
 * P57.9 — Admin security: API keys, IP whitelist, login history.
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, ShieldCheck, KeyRound, History } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Breadcrumb, Tabs, DataTable, FormField, fieldClassName, type Column, ConfirmDialog } from '../../components/admin/ui';

interface ApiKeyItem {
  id: string;
  name: string;
  scopes: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  createdAt: string;
}

interface LoginEvent {
  id: string;
  action: string;
  adminId: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

interface ListResponse<T> { status: string; data: { items: T[]; total?: number } }
interface IpResponse { status: string; data: { items: string[] } }

const apiKeyColumns: Column<ApiKeyItem>[] = [
  { key: 'name', label: 'Ad', sortable: true, render: (r) => <span className="text-white font-semibold">{r.name}</span> },
  { key: 'scopes', label: 'Yetki', render: (r) => <code className="text-xs text-secondary">{r.scopes.join(', ')}</code>, hideOnMobile: true },
  { key: 'lastUsedAt', label: 'Son Kullanım', hideOnMobile: true, render: (r) => r.lastUsedAt ? new Date(r.lastUsedAt).toLocaleString('tr-TR') : '—' },
  { key: 'revokedAt', label: 'Durum', render: (r) => r.revokedAt ? <span className="text-red-400">İptal</span> : <span className="text-secondary">Aktif</span> },
];

const loginColumns: Column<LoginEvent>[] = [
  { key: 'action', label: 'Eylem', sortable: true },
  { key: 'adminId', label: 'Admin' },
  { key: 'ip', label: 'IP', hideOnMobile: true },
  { key: 'createdAt', label: 'Zaman', render: (r) => new Date(r.createdAt).toLocaleString('tr-TR') },
];

export const AdminSecurityPage: React.FC = () => {
  const qc = useQueryClient();
  const [newIp, setNewIp] = useState('');
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const keys = useQuery<ListResponse<ApiKeyItem>>({
    queryKey: ['admin-security-keys'],
    queryFn: () => apiClient.get('/admin/security/api-keys').then((r) => r.data as ListResponse<ApiKeyItem>),
  });
  const ips = useQuery<IpResponse>({
    queryKey: ['admin-security-ips'],
    queryFn: () => apiClient.get('/admin/security/ip-whitelist').then((r) => r.data as IpResponse),
  });
  const logins = useQuery<ListResponse<LoginEvent>>({
    queryKey: ['admin-security-logins'],
    queryFn: () => apiClient.get('/admin/security/login-history').then((r) => r.data as ListResponse<LoginEvent>),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/security/api-keys/${id}`),
    onSuccess: () => {
      toast.success('API anahtarı iptal edildi');
      qc.invalidateQueries({ queryKey: ['admin-security-keys'] });
      setRevokeId(null);
    },
    onError: () => toast.error('İptal başarısız oldu'),
  });

  const addIp = useMutation({
    mutationFn: (ip: string) => apiClient.post('/admin/security/ip-whitelist', { ip }),
    onSuccess: () => {
      toast.success('IP eklendi');
      setNewIp('');
      qc.invalidateQueries({ queryKey: ['admin-security-ips'] });
    },
    onError: () => toast.error('Geçersiz IP veya hata oluştu'),
  });

  const removeIp = useMutation({
    mutationFn: (ip: string) => apiClient.delete(`/admin/security/ip-whitelist/${encodeURIComponent(ip)}`),
    onSuccess: () => {
      toast.success('IP kaldırıldı');
      qc.invalidateQueries({ queryKey: ['admin-security-ips'] });
    },
  });

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <header>
        <h1 className="text-2xl font-serif font-bold text-white">Güvenlik</h1>
        <p className="text-sm text-slate-400 mt-1">API anahtarları, IP beyaz listesi, giriş geçmişi.</p>
      </header>

      <Tabs items={[
        {
          id: 'api-keys',
          label: 'API Anahtarları',
          content: (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
                <KeyRound size={12} /> Yeni anahtar üretimi auth.ts üzerinden (POST /api/auth/api-keys). Buradan revoke edilir.
              </p>
              <DataTable
                columns={[
                  ...apiKeyColumns,
                  {
                    key: 'actions',
                    label: '',
                    align: 'right',
                    render: (r) => r.revokedAt ? null : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRevokeId(r.id); }}
                        className="text-xs text-red-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        <Trash2 size={10} /> İptal Et
                      </button>
                    ),
                  },
                ]}
                data={keys.data?.data?.items ?? []}
                getId={(r) => r.id}
                loading={keys.isLoading}
                emptyMessage="Henüz API anahtarı yok."
              />
            </div>
          ),
        },
        {
          id: 'ip-whitelist',
          label: 'IP Beyaz Listesi',
          content: (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
                <ShieldCheck size={12} /> Admin paneline yalnızca bu IP'lerden erişim. Boşsa kısıtlama yok.
              </p>
              <div className="flex gap-2 max-w-md">
                <FormField label="" htmlFor="newip">
                  <input id="newip" type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="örn. 185.45.12.0/24" className={fieldClassName} />
                </FormField>
                <button
                  type="button"
                  onClick={() => addIp.mutate(newIp)}
                  disabled={!newIp || addIp.isPending}
                  className="self-end inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-neutral font-semibold text-sm disabled:opacity-50"
                >
                  <Plus size={12} /> Ekle
                </button>
              </div>
              <ul className="divide-y divide-white/5 bg-white/[0.02] border border-white/10 rounded-xl">
                {(ips.data?.data?.items ?? []).length === 0 ? (
                  <li className="p-4 text-sm text-slate-400">Beyaz liste boş (tüm IP'ler erişebilir).</li>
                ) : (
                  ips.data?.data?.items.map((ip) => (
                    <li key={ip} className="px-4 py-2 flex items-center justify-between">
                      <code className="text-sm text-white">{ip}</code>
                      <button
                        type="button"
                        onClick={() => removeIp.mutate(ip)}
                        className="text-xs text-red-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        <Trash2 size={10} /> Kaldır
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ),
        },
        {
          id: 'login-history',
          label: 'Giriş Geçmişi',
          content: (
            <>
              <p className="text-xs text-slate-500 inline-flex items-center gap-1.5 mb-3">
                <History size={12} /> Son 50 AUTH_* audit eventi.
              </p>
              <DataTable
                columns={loginColumns}
                data={logins.data?.data?.items ?? []}
                getId={(r) => r.id}
                loading={logins.isLoading}
                emptyMessage="Henüz giriş kaydı yok."
              />
            </>
          ),
        },
      ]} />

      <ConfirmDialog
        open={!!revokeId}
        onConfirm={() => revokeId && revoke.mutate(revokeId)}
        onCancel={() => setRevokeId(null)}
        title="API anahtarını iptal et"
        message="Bu anahtarı kullanan tüm istemciler 401 alacak. Bu işlem geri alınamaz."
        variant="danger"
        confirmLabel="Evet, iptal et"
        loading={revoke.isPending}
      />
    </div>
  );
};

export default AdminSecurityPage;
