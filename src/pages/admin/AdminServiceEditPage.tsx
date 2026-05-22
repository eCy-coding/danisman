/**
 * P57.4 — Service edit (21 servis content overrides).
 *
 * Backend: GET/PATCH /api/admin/content/service/:slug (Redis-backed override).
 * Servis data file (src/data/service-content.ts) build-time — admin'den canlı
 * override yapmak için Redis hash'i kullanılır: `content:service:<slug>`.
 * Frontend ServiceDetailLayout opsiyonel override fetcher P57.10+ rollout.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Breadcrumb, FormField, fieldClassName, Tabs } from '../../components/admin/ui';

interface ServiceOverride {
  heroTitle?: string;
  heroSubtitle?: string;
  valueProp?: string;
  painPoints?: string;
  outcomes?: string;
  investmentRange?: string;
  timeline?: string;
  caseStudyAnonymized?: string;
}

interface OverrideResponse {
  status: string;
  data: ServiceOverride;
}

const SERVICE_SLUGS = [
  'strategic-transformation',
  'mergers-acquisitions',
  'family-business',
  'operational-excellence',
  'neuromarketing',
  'hr-transformation',
  'crisis-management',
  'ai-analytics',
  'digital-strategy',
  'data-governance',
  'esg-strategy',
  'investment-incentives',
  'macro-risk',
  'competition-economics',
  'industrial-relations',
  'payroll-audit',
  'employer-branding',
  'market-entry',
  'global-intelligence',
  'smart-cities',
  'government-relations',
];

export const AdminServiceEditPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ServiceOverride>({});

  const query = useQuery<OverrideResponse>({
    queryKey: ['admin-service-override', slug],
    queryFn: () =>
      apiClient.get(`/admin/content/service/${slug}`).then((r) => r.data as OverrideResponse),
    enabled: !!slug && SERVICE_SLUGS.includes(slug),
  });

  useEffect(() => {
    if (query.data?.data) setData(query.data.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: (payload: ServiceOverride) =>
      apiClient.patch(`/admin/content/service/${slug}`, payload),
    onSuccess: () => toast.success('Servis içeriği güncellendi'),
    onError: () => toast.error('Kayıt başarısız oldu'),
  });

  if (!SERVICE_SLUGS.includes(slug)) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Geçersiz servis: {slug}</p>
        <Link to="/admin/services" className="text-secondary text-sm">
          ← Servis listesi
        </Link>
      </div>
    );
  }

  const update = <K extends keyof ServiceOverride>(k: K, v: ServiceOverride[K]) => {
    setData((d) => ({ ...d, [k]: v }));
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Yönetim', to: '/admin' },
          { label: 'Hizmetler', to: '/admin/services' },
          { label: slug },
        ]}
      />
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/services')}
            aria-label="Servis listesine geri dön"
            className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={14} /> Geri
          </button>
          <h1 className="text-2xl font-serif font-bold text-white">Servis: {slug}</h1>
        </div>
        <button
          type="button"
          onClick={() => save.mutate(data)}
          disabled={save.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90 disabled:opacity-50"
        >
          <Save size={14} /> {save.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </header>

      <Tabs
        items={[
          {
            id: 'hero',
            label: 'Hero',
            content: (
              <div className="space-y-4 max-w-3xl">
                <FormField
                  label="Hero Başlık"
                  tooltip="Servis detay sayfasının ana başlığı (override)."
                >
                  <input
                    type="text"
                    value={data.heroTitle ?? ''}
                    onChange={(e) => update('heroTitle', e.target.value)}
                    className={fieldClassName}
                  />
                </FormField>
                <FormField label="Hero Alt Başlık">
                  <textarea
                    value={data.heroSubtitle ?? ''}
                    onChange={(e) => update('heroSubtitle', e.target.value)}
                    className={`${fieldClassName} min-h-[80px]`}
                  />
                </FormField>
                <FormField label="Value Proposition" tooltip="3-5 cümlelik değer önerisi.">
                  <textarea
                    value={data.valueProp ?? ''}
                    onChange={(e) => update('valueProp', e.target.value)}
                    className={`${fieldClassName} min-h-[100px]`}
                  />
                </FormField>
              </div>
            ),
          },
          {
            id: 'content',
            label: 'İçerik',
            content: (
              <div className="space-y-4 max-w-3xl">
                <FormField label="Pain Points" hint="Her satıra bir madde">
                  <textarea
                    value={data.painPoints ?? ''}
                    onChange={(e) => update('painPoints', e.target.value)}
                    className={`${fieldClassName} min-h-[140px]`}
                  />
                </FormField>
                <FormField label="Outcomes" hint="Her satıra bir sonuç">
                  <textarea
                    value={data.outcomes ?? ''}
                    onChange={(e) => update('outcomes', e.target.value)}
                    className={`${fieldClassName} min-h-[140px]`}
                  />
                </FormField>
                <FormField label="Anonim Case Study" tooltip="NDA uyumlu özet (3-5 cümle).">
                  <textarea
                    value={data.caseStudyAnonymized ?? ''}
                    onChange={(e) => update('caseStudyAnonymized', e.target.value)}
                    className={`${fieldClassName} min-h-[100px]`}
                  />
                </FormField>
              </div>
            ),
          },
          {
            id: 'commercial',
            label: 'Ticari',
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <FormField label="Yatırım Aralığı" tooltip="Örn: 250-650K TL / 8-14 hafta">
                  <input
                    type="text"
                    value={data.investmentRange ?? ''}
                    onChange={(e) => update('investmentRange', e.target.value)}
                    className={fieldClassName}
                  />
                </FormField>
                <FormField label="Timeline">
                  <input
                    type="text"
                    value={data.timeline ?? ''}
                    onChange={(e) => update('timeline', e.target.value)}
                    className={fieldClassName}
                  />
                </FormField>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AdminServiceEditPage;
