/**
 * P57.8 — Admin settings (7-tab).
 *
 * Tabs: Site / Marka / Entegrasyonlar / SEO / Yasal / Cookie / E-posta
 * Backend: GET/PATCH /api/admin/content/page/settings (Redis-backed P57.4 endpoint).
 */

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Breadcrumb, FormField, fieldClassName, Tabs } from '../../components/admin/ui';

interface SettingsShape {
  // Site
  phone?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  businessHours?: string;
  // Branding
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  // Integrations
  sentryDsn?: string;
  ga4Id?: string;
  gscToken?: string;
  resendApiKey?: string;
  telegramBotToken?: string;
  calendlyUrl?: string;
  // SEO
  defaultTitle?: string;
  defaultDesc?: string;
  defaultOgImage?: string;
  // Legal
  kvkkText?: string;
  privacyText?: string;
  termsText?: string;
  cookiePolicy?: string;
  // Cookie banner
  cookieBannerTitle?: string;
  cookieBannerMessage?: string;
  cookieAcceptLabel?: string;
  cookieRejectLabel?: string;
  // Email
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpFrom?: string;
  emailSignature?: string;
}

interface SettingsResponse {
  status: string;
  data: SettingsShape;
}

export const AdminSettingsTabsPage: React.FC = () => {
  const qc = useQueryClient();
  const [data, setData] = useState<SettingsShape>({});

  const query = useQuery<SettingsResponse>({
    queryKey: ['admin-settings'],
    queryFn: () =>
      apiClient.get('/admin/content/page/settings').then((r) => r.data as SettingsResponse),
  });

  useEffect(() => {
    if (query.data?.data) setData(query.data.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: (payload: SettingsShape) =>
      apiClient.patch('/admin/content/page/settings', payload),
    onSuccess: () => {
      toast.success('Ayarlar kaydedildi');
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => toast.error('Kayıt başarısız oldu'),
  });

  const upd = <K extends keyof SettingsShape>(k: K, v: SettingsShape[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const f = (
    label: string,
    key: keyof SettingsShape,
    type: 'text' | 'textarea' | 'url' | 'color' = 'text',
    tooltip?: string,
  ) => (
    <FormField label={label} tooltip={tooltip}>
      {type === 'textarea' ? (
        <textarea
          value={(data[key] as string) ?? ''}
          onChange={(e) => upd(key, e.target.value as SettingsShape[typeof key])}
          className={`${fieldClassName} min-h-[100px]`}
        />
      ) : type === 'color' ? (
        <input
          type="color"
          value={(data[key] as string) ?? '#000000'}
          onChange={(e) => upd(key, e.target.value as SettingsShape[typeof key])}
          className="h-10 w-20 rounded border border-white/15 bg-neutral cursor-pointer"
        />
      ) : (
        <input
          type={type === 'url' ? 'url' : 'text'}
          value={(data[key] as string) ?? ''}
          onChange={(e) => upd(key, e.target.value as SettingsShape[typeof key])}
          className={fieldClassName}
        />
      )}
    </FormField>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">Ayarlar</h1>
          <p className="text-sm text-slate-400 mt-1">
            Site, marka, entegrasyon, SEO, yasal, cookie, e-posta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => save.mutate(data)}
          disabled={save.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold disabled:opacity-50"
        >
          <Save size={14} /> {save.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </header>

      <Tabs
        items={[
          {
            id: 'site',
            label: 'Site',
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                {f('Telefon', 'phone', 'text')}
                {f('E-posta', 'email', 'text')}
                {f('Adres', 'address', 'textarea')}
                {f('WhatsApp URL', 'whatsapp', 'url')}
                {f('LinkedIn', 'linkedin', 'url')}
                {f('Twitter / X', 'twitter', 'url')}
                {f('Instagram', 'instagram', 'url')}
                {f('Çalışma Saatleri', 'businessHours', 'text', 'Pzt-Cum 09:00-18:00')}
              </div>
            ),
          },
          {
            id: 'brand',
            label: 'Marka',
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                {f('Logo URL', 'logoUrl', 'url')}
                {f('Primary Renk', 'primaryColor', 'color')}
                {f('Secondary Renk', 'secondaryColor', 'color')}
                {f('Accent Renk', 'accentColor', 'color')}
                {f('Font Ailesi', 'fontFamily', 'text', 'Inter / Roboto')}
              </div>
            ),
          },
          {
            id: 'integ',
            label: 'Entegrasyonlar',
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                {f('Sentry DSN', 'sentryDsn', 'url')}
                {f('GA4 Measurement ID', 'ga4Id', 'text', 'G-XXXXXXXXXX')}
                {f('GSC Verification', 'gscToken', 'text')}
                {f('Resend API Key', 'resendApiKey', 'text')}
                {f('Telegram Bot Token', 'telegramBotToken', 'text')}
                {f('Calendly URL', 'calendlyUrl', 'url')}
                <p className="md:col-span-2 text-xs text-slate-500">
                  Bu alanlar canlı sistemde environment variable'larla override edilir. Burada
                  kaydedilen değerler yalnızca dokümantasyon amaçlıdır.
                </p>
              </div>
            ),
          },
          {
            id: 'seo',
            label: 'SEO',
            content: (
              <div className="grid grid-cols-1 gap-4 max-w-3xl">
                {f('Varsayılan Title', 'defaultTitle', 'text')}
                {f('Varsayılan Description', 'defaultDesc', 'textarea')}
                {f('Varsayılan OG Image URL', 'defaultOgImage', 'url')}
              </div>
            ),
          },
          {
            id: 'legal',
            label: 'Yasal',
            content: (
              <div className="space-y-4 max-w-3xl">
                {f('KVKK Aydınlatma Metni', 'kvkkText', 'textarea')}
                {f('Gizlilik Metni', 'privacyText', 'textarea')}
                {f('Kullanım Şartları', 'termsText', 'textarea')}
                {f('Cookie Politikası', 'cookiePolicy', 'textarea')}
              </div>
            ),
          },
          {
            id: 'cookie',
            label: 'Cookie',
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                {f('Banner Başlık', 'cookieBannerTitle', 'text')}
                {f('Banner Mesaj', 'cookieBannerMessage', 'textarea')}
                {f('Kabul Et Etiketi', 'cookieAcceptLabel', 'text')}
                {f('Reddet Etiketi', 'cookieRejectLabel', 'text')}
              </div>
            ),
          },
          {
            id: 'email',
            label: 'E-posta',
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                {f('SMTP Host', 'smtpHost', 'text')}
                {f('SMTP Port', 'smtpPort', 'text')}
                {f('SMTP User', 'smtpUser', 'text')}
                {f('Gönderen', 'smtpFrom', 'text')}
                <div className="md:col-span-2">
                  {f('E-posta İmzası', 'emailSignature', 'textarea')}
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AdminSettingsTabsPage;
