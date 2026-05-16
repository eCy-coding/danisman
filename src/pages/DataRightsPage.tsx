/**
 * P13/3 — DataRightsPage
 *
 * /privacy/data-rights — KVKK Madde 11 + GDPR Art. 15-17 başvuru formu.
 * İki sekme: (1) Veri Dışa Aktarım, (2) Veri Silme.
 *
 * Tasarım:
 *   - LegalLayout içine gömülü
 *   - WCAG AA: <label htmlFor>, aria-required, aria-invalid, aria-describedby
 *   - axe-core 0 violation hedefi
 *   - i18n: legal.dataRights namespace
 *   - Honeypot field (hp_field) — bot koruması
 *   - Idempotency-Key — crypto.randomUUID() ile retry-safe
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { trackForm } from '@/lib/analytics';
import { Logger } from '@/lib/logger';

const LAST_UPDATED_ISO = '2026-05-16';
const LAST_UPDATED_DISPLAY = '16.05.2026';

type ReqKind = 'export' | 'delete';

interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message?: string;
}

const apiBase = (): string =>
  (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback — Math.random is fine for idempotency keys (collision risk = 0 in practice)
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export const DataRightsPage: React.FC = () => {
  const { t, i18n } = useTranslation('legal');
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'tr') as 'tr' | 'en';

  const [kind, setKind] = useState<ReqKind>('export');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [hp, setHp] = useState('');
  const [state, setState] = useState<SubmissionState>({ status: 'idle' });
  const [idempotencyKey] = useState<string>(() => newIdempotencyKey());

  // P14 — abort + isMounted guard:
  //   - AbortController cancels in-flight fetch on unmount or duplicate submit
  //   - mountedRef prevents setState on unmounted component
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const emailId = useId();
  const reasonId = useId();
  const errorId = useId();
  const successId = useId();

  const labels = useMemo(
    () => ({
      title:
        lang === 'tr' ? 'KVKK / GDPR Veri Hakları Başvurusu' : 'KVKK / GDPR Data Rights Request',
      subtitle:
        lang === 'tr'
          ? 'KVKK Madde 11 ve GDPR Madde 15-17 kapsamında kişisel verilerinize ilişkin talep gönderebilirsiniz. Yanıt SLA: 24 saat.'
          : 'Submit a request regarding your personal data under KVKK Article 11 and GDPR Articles 15-17. Response SLA: 24 hours.',
      kindExport: lang === 'tr' ? 'Veri Dışa Aktarım' : 'Data Export',
      kindDelete: lang === 'tr' ? 'Veri Silme' : 'Data Deletion',
      emailLabel: lang === 'tr' ? 'E-posta adresiniz' : 'Your email address',
      emailPlaceholder: 'ornek@example.com',
      reasonLabel: lang === 'tr' ? 'Açıklama (opsiyonel)' : 'Additional notes (optional)',
      reasonPlaceholder:
        lang === 'tr'
          ? 'Talebinizle ilgili ek bilgi varsa belirtin.'
          : 'Any additional context for your request.',
      submit: lang === 'tr' ? 'Talebi Gönder' : 'Submit Request',
      submitting: lang === 'tr' ? 'Gönderiliyor…' : 'Submitting…',
      successHint:
        lang === 'tr'
          ? 'Talebinizi aldık. 24 saat içinde e-posta ile dönüş yapacağız.'
          : 'We received your request. We will respond by email within 24 hours.',
      errorHint:
        lang === 'tr'
          ? 'Talep gönderilemedi. Daha sonra tekrar deneyin veya kvkk@ecypro.com adresine yazın.'
          : 'Request failed. Please try again later or write to kvkk@ecypro.com.',
      rateHint:
        lang === 'tr'
          ? 'Bu e-posta için 24 saat içinde başka bir talep gönderdiniz. Lütfen yarın tekrar deneyin.'
          : 'You have already submitted a request for this email within 24 hours. Please try again tomorrow.',
      invalidEmail: lang === 'tr' ? 'Geçerli bir e-posta adresi girin.' : 'Please enter a valid email.',
    }),
    [lang],
  );

  const validate = (): string | null => {
    const e = email.trim();
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return labels.invalidEmail;
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if (validation) {
      setState({ status: 'error', message: validation });
      return;
    }

    // P14 — submit lock: abort any earlier in-flight submit (double-click safety).
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({ status: 'submitting' });
    trackForm(`data-rights:${kind}`, 'start');

    try {
      const res = await fetch(`${apiBase()}/gdpr/${kind}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          email: email.trim(),
          reason: reason.trim(),
          hp_field: hp,
          lang,
        }),
        signal: ac.signal,
      });

      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        message?: string;
      };

      // Drop result if unmounted or superseded.
      if (!mountedRef.current || ac.signal.aborted) return;

      if (res.ok && body.ok) {
        trackForm(`data-rights:${kind}`, 'submit_success');
        setState({ status: 'success', message: body.message ?? labels.successHint });
        setReason('');
        return;
      }

      if (res.status === 429 || body.code === 'RATE_LIMITED') {
        trackForm(`data-rights:${kind}`, 'submit_error', { reason: 'rate_limited' });
        setState({ status: 'error', message: labels.rateHint });
        return;
      }

      trackForm(`data-rights:${kind}`, 'submit_error', { reason: body.code ?? 'unknown' });
      setState({ status: 'error', message: body.message ?? labels.errorHint });
    } catch (err) {
      // Swallow abort errors — they are intentional unmount/double-submit cancels.
      if ((err as { name?: string } | null)?.name === 'AbortError') return;
      if (!mountedRef.current) return;
      Logger.warn('[DataRights] submit failed', err as Error);
      trackForm(`data-rights:${kind}`, 'submit_error', { reason: 'network' });
      setState({ status: 'error', message: labels.errorHint });
    }
  };

  return (
    <LegalLayout
      title={labels.title}
      lastUpdated={LAST_UPDATED_ISO}
      lastUpdatedDisplay={LAST_UPDATED_DISPLAY}
      schemaName={labels.title}
      description={labels.subtitle}
    >
      <p className="text-slate-300">{labels.subtitle}</p>

      <form
        onSubmit={onSubmit}
        className="mt-fib-7 p-fib-6 bg-surface-2 border border-white/10 rounded-lg max-w-2xl"
        aria-labelledby="data-rights-form-heading"
        noValidate
      >
        <h2 id="data-rights-form-heading" className="text-xl font-semibold text-white mb-fib-5">
          {labels.title}
        </h2>

        {/* Kind selector — radiogroup */}
        <fieldset className="mb-fib-6">
          <legend className="text-sm font-medium text-slate-200 mb-fib-3">
            {lang === 'tr' ? 'Talep türü' : 'Request type'}
          </legend>
          <div className="flex gap-fib-5" role="radiogroup">
            <label className="inline-flex items-center gap-fib-3 cursor-pointer">
              <input
                type="radio"
                name="kind"
                value="export"
                checked={kind === 'export'}
                onChange={() => setKind('export')}
                className="w-4 h-4"
              />
              <span className="text-slate-200">{labels.kindExport}</span>
            </label>
            <label className="inline-flex items-center gap-fib-3 cursor-pointer">
              <input
                type="radio"
                name="kind"
                value="delete"
                checked={kind === 'delete'}
                onChange={() => setKind('delete')}
                className="w-4 h-4"
              />
              <span className="text-slate-200">{labels.kindDelete}</span>
            </label>
          </div>
        </fieldset>

        {/* Email */}
        <div className="mb-fib-6">
          <label htmlFor={emailId} className="block text-sm font-medium text-slate-200 mb-fib-2">
            {labels.emailLabel} <span aria-hidden="true">*</span>
          </label>
          <input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={labels.emailPlaceholder}
            required
            aria-required="true"
            aria-invalid={state.status === 'error' ? 'true' : 'false'}
            aria-describedby={state.status === 'error' ? errorId : undefined}
            className="w-full px-fib-4 py-fib-3 bg-surface-1 border border-white/10 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        {/* Reason */}
        <div className="mb-fib-6">
          <label htmlFor={reasonId} className="block text-sm font-medium text-slate-200 mb-fib-2">
            {labels.reasonLabel}
          </label>
          <textarea
            id={reasonId}
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={labels.reasonPlaceholder}
            maxLength={2000}
            className="w-full px-fib-4 py-fib-3 bg-surface-1 border border-white/10 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        {/* Honeypot — visually hidden, off-tab */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
          <label htmlFor="hp_field">Leave this empty</label>
          <input
            id="hp_field"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={state.status === 'submitting'}
          className="inline-flex items-center justify-center gap-fib-3 px-fib-6 py-fib-3 bg-secondary text-neutral font-semibold rounded-md transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
        >
          {state.status === 'submitting' ? labels.submitting : labels.submit}
        </button>

        {state.status === 'error' && state.message && (
          <p
            id={errorId}
            role="alert"
            className="mt-fib-5 text-sm text-red-400"
          >
            {state.message}
          </p>
        )}

        {state.status === 'success' && state.message && (
          <p
            id={successId}
            role="status"
            className="mt-fib-5 text-sm text-emerald-400"
          >
            {state.message}
          </p>
        )}

        <p className="mt-fib-6 text-xs text-slate-400">
          {lang === 'tr'
            ? 'KVKK Madde 11 — bilgi, erişim, düzeltme, silme, kısıtlama, taşınabilirlik ve itiraz hakkı. GDPR Madde 15-17 — Right of Access, Right to Rectification, Right to Erasure.'
            : 'KVKK Article 11 + GDPR Articles 15-17 — Right of Access, Rectification, Erasure, Restriction, Portability, and Objection.'}
        </p>
      </form>

      <p className="mt-fib-7 text-sm text-slate-400">
        {t('placeholder')}
      </p>
    </LegalLayout>
  );
};

export default DataRightsPage;
