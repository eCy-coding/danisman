import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { FlaskConical, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useT } from '@/hooks/useT';

// ─── Types ────────────────────────────────────────────────────────────────────

type Domain = 'M_A' | 'ESG' | 'FINTECH' | 'AILE_SIRKETI';

type ResearchJobStatus =
  | 'QUEUED'
  | 'CLAIMED'
  | 'RESEARCHING'
  | 'IMPORTING'
  | 'DRAFTING'
  | 'DONE'
  | 'FAILED'
  | 'CANCELLED';

interface ResearchJob {
  id: string;
  status: ResearchJobStatus;
  topic: string;
  lang: 'tr' | 'en';
  mode: 'fast' | 'deep';
  primaryDomain: Domain;
  stageDetail?: string | null;
  sourceCount?: number | null;
  reportTitle?: string | null;
  postId?: string | null;
  error?: string | null;
  createdAt: string;
  finishedAt?: string | null;
}

interface JobsListResponse {
  status: string;
  data: {
    items: ResearchJob[];
    total: number;
    bridgeAlive: boolean;
    lastBridgeSeenAt: string | null;
  };
}

// ─── Zod Schema (client-side; messages are i18n keys, resolved via t at render) ─

const ResearchFormSchema = z.object({
  topic: z.string().min(5, 'research.topicMin'),
  mode: z.enum(['fast', 'deep']),
  lang: z.enum(['tr', 'en']),
  primaryDomain: z.enum(['M_A', 'ESG', 'FINTECH', 'AILE_SIRKETI']),
});

type ResearchFormData = z.infer<typeof ResearchFormSchema>;

// ─── Constants ───────────────────────────────────────────────────────────────

// Brand names — not translated by design.
const DOMAIN_OPTIONS: { value: Domain; label: string }[] = [
  { value: 'M_A', label: 'M&A' },
  { value: 'ESG', label: 'ESG' },
  { value: 'FINTECH', label: 'FinTech' },
  { value: 'AILE_SIRKETI', label: 'Aile Şirketi' },
];

const STATUS_META: Record<ResearchJobStatus, { labelKey: string; chip: string; pulse: boolean }> = {
  QUEUED: {
    labelKey: 'research.statusQueued',
    chip: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    pulse: false,
  },
  CLAIMED: {
    labelKey: 'research.statusClaimed',
    chip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    pulse: true,
  },
  RESEARCHING: {
    labelKey: 'research.statusResearching',
    chip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    pulse: true,
  },
  IMPORTING: {
    labelKey: 'research.statusImporting',
    chip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    pulse: true,
  },
  DRAFTING: {
    labelKey: 'research.statusDrafting',
    chip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    pulse: true,
  },
  DONE: {
    labelKey: 'research.statusDone',
    chip: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    pulse: false,
  },
  FAILED: {
    labelKey: 'research.failed',
    chip: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    pulse: false,
  },
  CANCELLED: {
    labelKey: 'research.statusCancelled',
    chip: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    pulse: false,
  },
};

// ─── AdminResearchPage ───────────────────────────────────────────────────────

export default function AdminResearchPage() {
  const { t } = useT();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<JobsListResponse>({
    queryKey: ['research-jobs'],
    queryFn: () =>
      apiClient
        .get('/admin/research/jobs', { params: { limit: '50' } })
        .then((r) => r.data as JobsListResponse),
    refetchInterval: 5000,
  });

  const jobs = data?.data?.items ?? [];
  const bridgeAlive = data?.data?.bridgeAlive ?? false;
  const lastBridgeSeenAt = data?.data?.lastBridgeSeenAt ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResearchFormData>({
    resolver: zodResolver(ResearchFormSchema),
    defaultValues: {
      topic: '',
      mode: 'fast',
      lang: 'tr',
      primaryDomain: 'M_A',
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: ResearchFormData) => apiClient.post('/admin/research/jobs', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['research-jobs'] });
      toast.success(t('research.submitted'));
      reset();
    },
    onError: (err: { response?: { data?: { error?: string; detail?: string } } }) => {
      const d = err?.response?.data;
      toast.error(d?.detail ?? d?.error ?? t('research.submitError'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/research/jobs/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['research-jobs'] });
    },
    onError: (err: { response?: { data?: { error?: string; detail?: string } } }) => {
      const d = err?.response?.data;
      toast.error(d?.detail ?? d?.error ?? t('research.cancelError'));
    },
  });

  const onSubmit = (formData: ResearchFormData) => createMutation.mutate(formData);

  const handleCancel = (job: ResearchJob) => {
    // Spec-mandated native confirm for queue cancel (no modal infra needed here).
    // eslint-disable-next-line no-alert
    if (window.confirm(t('research.cancelConfirm'))) {
      cancelMutation.mutate(job.id);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t('research.title')} — eCyPro Admin`}</title>
      </Helmet>

      <div className="space-y-fib-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical size={20} className="text-amber-400" />
            <div>
              <h1 className="text-golden-lg font-semibold text-slate-100">{t('research.title')}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{t('research.subtitle')}</p>
            </div>
          </div>

          {/* Bridge status badge */}
          <span
            className={cn(
              'flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border',
              bridgeAlive
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/20',
            )}
            title={
              lastBridgeSeenAt
                ? new Date(lastBridgeSeenAt).toLocaleString('tr-TR', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : undefined
            }
            data-testid="bridge-status"
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                bridgeAlive ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse',
              )}
              aria-hidden="true"
            />
            {bridgeAlive ? t('research.bridgeOnline') : t('research.bridgeOffline')}
          </span>
        </div>

        {/* Bridge offline hint */}
        {data && !bridgeAlive && (
          <div
            className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400"
            data-testid="bridge-hint"
          >
            {t('research.bridgeHint')}
          </div>
        )}

        {/* New job form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white/[0.02] border border-white/5 rounded-xl p-fib-6 space-y-4"
          data-testid="research-form"
        >
          {/* Topic */}
          <div>
            <label htmlFor="research-topic" className="block text-xs text-slate-400 mb-1">
              {t('research.topic')} *
            </label>
            <textarea
              id="research-topic"
              {...register('topic')}
              rows={3}
              placeholder={t('research.topicPlaceholder')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
            {errors.topic && (
              <p className="text-xs text-red-400 mt-1">
                {t(errors.topic.message ?? 'research.topicMin')}
              </p>
            )}
          </div>

          {/* Mode + Lang + Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="research-mode" className="block text-xs text-slate-400 mb-1">
                {t('research.mode')}
              </label>
              <select
                id="research-mode"
                {...register('mode')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                <option value="fast" className="bg-[#1E1F20]">
                  {t('research.modeFast')}
                </option>
                <option value="deep" className="bg-[#1E1F20]">
                  {t('research.modeDeep')}
                </option>
              </select>
            </div>

            <div>
              <label htmlFor="research-lang" className="block text-xs text-slate-400 mb-1">
                {t('research.lang')}
              </label>
              <select
                id="research-lang"
                {...register('lang')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                <option value="tr" className="bg-[#1E1F20]">
                  {t('research.langTr')}
                </option>
                <option value="en" className="bg-[#1E1F20]">
                  {t('research.langEn')}
                </option>
              </select>
            </div>

            <div>
              <label htmlFor="research-domain" className="block text-xs text-slate-400 mb-1">
                {t('research.domain')}
              </label>
              <select
                id="research-domain"
                {...register('primaryDomain')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                {DOMAIN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#1E1F20]">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              data-testid="research-submit"
            >
              {createMutation.isPending && (
                <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
              )}
              {t('research.submit')}
            </button>
          </div>
        </form>

        {/* Jobs table */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">{t('research.loading')}</div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center" data-testid="research-empty">
              <p className="text-sm text-slate-500">{t('research.empty')}</p>
            </div>
          ) : (
            <table className="w-full" data-testid="research-jobs-table">
              <thead className="bg-white/5 border-b border-white/5">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 font-medium">{t('research.colTopic')}</th>
                  <th className="px-4 py-3 font-medium">{t('research.colStatus')}</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">
                    {t('research.colModeLang')}
                  </th>
                  <th className="px-4 py-3 font-medium text-right hidden md:table-cell">
                    {t('research.colSources')}
                  </th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">
                    {t('research.colCreated')}
                  </th>
                  <th className="px-4 py-3 font-medium text-right">{t('research.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jobs.map((job) => {
                  const meta = STATUS_META[job.status];
                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-white/[0.02] transition-colors"
                      data-testid={`research-job-row-${job.id}`}
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm text-slate-200 truncate" title={job.topic}>
                          {job.topic}
                        </p>
                        {job.reportTitle && (
                          <p className="text-xs text-slate-500 truncate" title={job.reportTitle}>
                            {job.reportTitle}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex text-xs px-2 py-0.5 rounded border',
                            meta.chip,
                            meta.pulse && 'animate-pulse',
                          )}
                          title={job.status === 'FAILED' ? (job.error ?? undefined) : undefined}
                        >
                          {t(meta.labelKey)}
                        </span>
                        {job.stageDetail && (
                          <p
                            className="text-xs text-slate-500 mt-1 truncate"
                            title={job.stageDetail}
                          >
                            {job.stageDetail}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-slate-400 font-mono">
                          {job.mode} · {job.lang}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="text-xs text-slate-400 tabular-nums">
                          {job.sourceCount ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                          {new Date(job.createdAt).toLocaleString('tr-TR', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {job.status === 'DONE' && job.postId && (
                            <Link
                              to={`/admin/insights/posts/${job.postId}/edit`}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg transition-colors"
                              data-testid={`open-in-editor-${job.id}`}
                            >
                              <ExternalLink size={12} aria-hidden="true" />
                              {t('research.openInEditor')}
                            </Link>
                          )}
                          {job.status === 'QUEUED' && (
                            <button
                              type="button"
                              onClick={() => handleCancel(job)}
                              disabled={cancelMutation.isPending}
                              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                              data-testid={`cancel-job-${job.id}`}
                            >
                              {t('research.cancel')}
                            </button>
                          )}
                          {job.status === 'FAILED' && (
                            <span className="text-xs text-rose-400" title={job.error ?? undefined}>
                              {t('research.failed')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
