/**
 * P57.10 — Admin profile page (own settings).
 *
 * - Profile info (read-only — useAppStore.user)
 * - Şifre değiştir (POST /api/auth/change-password)
 * - 2FA toggle (mevcut TwoFactorSettings component reuse)
 * - Bildirim tercihleri (localStorage)
 * - Tema (dark/light) toggle (localStorage `ecypro:theme`)
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Moon, Sun, KeyRound } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';
import { Breadcrumb, Tabs, FormField, fieldClassName } from '../../components/admin/ui';
import { TwoFactorSettings } from '../../components/admin/TwoFactorSettings';

interface PrefShape {
  emailLeadAlert: boolean;
  emailCampaignSummary: boolean;
  pushEnabled: boolean;
  theme: 'dark' | 'light';
}

const PREF_KEY = 'ecypro:admin-prefs';

function readPrefs(): PrefShape {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw) as PrefShape;
  } catch {
    /* ignore */
  }
  return { emailLeadAlert: true, emailCampaignSummary: false, pushEnabled: false, theme: 'dark' };
}

function writePrefs(p: PrefShape): void {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
    document.documentElement.dataset.theme = p.theme;
  } catch {
    /* ignore */
  }
}

export const AdminProfilePage: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const [prefs, setPrefs] = useState<PrefShape>(readPrefs);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  const changePassword = useMutation({
    mutationFn: () =>
      apiClient.post('/auth/password/change', {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      }),
    onSuccess: () => {
      toast.success('Şifre güncellendi');
      setPwd({ current: '', next: '', confirm: '' });
    },
    onError: () => toast.error('Şifre güncellenemedi'),
  });

  const savePrefs = (next: PrefShape) => {
    setPrefs(next);
    writePrefs(next);
    toast.success('Tercih kaydedildi');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <header>
        <h1 className="text-2xl font-serif font-bold text-white">Profilim</h1>
        <p className="text-sm text-slate-400 mt-1">
          {user?.email ?? '—'} · {user?.role ?? '—'}
        </p>
      </header>

      <Tabs
        items={[
          {
            id: 'password',
            label: 'Şifre',
            content: (
              <form
                className="space-y-3 max-w-md"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pwd.next !== pwd.confirm) {
                    toast.error('Yeni şifreler eşleşmiyor');
                    return;
                  }
                  if (pwd.next.length < 12) {
                    toast.error('Şifre en az 12 karakter olmalı');
                    return;
                  }
                  changePassword.mutate();
                }}
              >
                <FormField label="Mevcut Şifre" required>
                  <input
                    type="password"
                    value={pwd.current}
                    onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                    className={fieldClassName}
                    autoComplete="current-password"
                  />
                </FormField>
                <FormField
                  label="Yeni Şifre"
                  required
                  hint="En az 12 karakter, harf + rakam + sembol"
                >
                  <input
                    type="password"
                    value={pwd.next}
                    onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                    className={fieldClassName}
                    autoComplete="new-password"
                  />
                </FormField>
                <FormField label="Yeni Şifre (Tekrar)" required>
                  <input
                    type="password"
                    value={pwd.confirm}
                    onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                    className={fieldClassName}
                    autoComplete="new-password"
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={changePassword.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold disabled:opacity-50"
                >
                  <KeyRound size={14} />{' '}
                  {changePassword.isPending ? 'Güncelleniyor…' : 'Şifreyi Değiştir'}
                </button>
              </form>
            ),
          },
          {
            id: '2fa',
            label: '2FA',
            content: <TwoFactorSettings />,
          },
          {
            id: 'notif',
            label: 'Bildirimler',
            content: (
              <div className="space-y-3 max-w-md">
                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.emailLeadAlert}
                    onChange={(e) => savePrefs({ ...prefs, emailLeadAlert: e.target.checked })}
                  />
                  Yeni lead için e-posta uyarısı
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.emailCampaignSummary}
                    onChange={(e) =>
                      savePrefs({ ...prefs, emailCampaignSummary: e.target.checked })
                    }
                  />
                  Haftalık kampanya özeti
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.pushEnabled}
                    onChange={(e) => savePrefs({ ...prefs, pushEnabled: e.target.checked })}
                  />
                  Web push bildirimleri (tarayıcı izni gerekir)
                </label>
              </div>
            ),
          },
          {
            id: 'theme',
            label: 'Tema',
            content: (
              <div className="space-y-3 max-w-md">
                <p className="text-sm text-slate-400">
                  Admin paneli temasını seçin. Tercih localStorage'da saklanır.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => savePrefs({ ...prefs, theme: 'dark' })}
                    className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border ${
                      prefs.theme === 'dark'
                        ? 'border-secondary bg-secondary/10 text-white'
                        : 'border-white/10 text-slate-300'
                    }`}
                  >
                    <Moon size={16} /> Koyu
                  </button>
                  <button
                    type="button"
                    onClick={() => savePrefs({ ...prefs, theme: 'light' })}
                    className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border ${
                      prefs.theme === 'light'
                        ? 'border-secondary bg-secondary/10 text-white'
                        : 'border-white/10 text-slate-300'
                    }`}
                  >
                    <Sun size={16} /> Açık (beta)
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Açık tema kısmi destek — bazı bileşenler henüz adapt edilmedi.
                </p>
              </div>
            ),
          },
        ]}
      />

      <p className="text-xs text-slate-500 inline-flex items-center gap-1 mt-6">
        <Save size={11} /> Değişiklikler otomatik kaydedilir veya "Kaydet" düğmesi gerektirir.
      </p>
    </div>
  );
};

export default AdminProfilePage;
