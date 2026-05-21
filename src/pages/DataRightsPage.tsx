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

const apiBase = (): string => (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

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
      invalidEmail:
        lang === 'tr' ? 'Geçerli bir e-posta adresi girin.' : 'Please enter a valid email.',
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

      {/* P45 C2: KVKK haklarının açıklaması + sürecin şeffaf gösterimi. */}
      <section className="mt-fib-7 space-y-fib-5 text-slate-300">
        <h2 className="text-2xl font-semibold text-white">
          {lang === 'tr' ? 'Veri Sahibi Olarak Haklarınız' : 'Your Rights as a Data Subject'}
        </h2>
        <p className="leading-relaxed">
          {lang === 'tr'
            ? 'KVKK Madde 11 kapsamında eCyPro Premium Consulting nezdindeki kişisel verilerinize ilişkin aşağıdaki haklara sahipsiniz. Talebinizi bu sayfadaki form üzerinden veya kvkk@ecypro.com adresine e-posta ile iletebilirsiniz.'
            : 'Under KVKK Article 11, you have the following rights regarding personal data held by eCyPro Premium Consulting. You may submit your request via the form on this page or by email to kvkk@ecypro.com.'}
        </p>
        <ul className="list-disc list-inside space-y-fib-3 marker:text-secondary">
          <li>
            {lang === 'tr'
              ? 'Kişisel verilerinizin işlenip işlenmediğini öğrenme.'
              : 'Learn whether your personal data is being processed.'}
          </li>
          <li>
            {lang === 'tr'
              ? 'İşlenmişse buna ilişkin bilgi talep etme — hangi veriler, hangi amaçla.'
              : 'Request information about what data is processed and for what purposes.'}
          </li>
          <li>
            {lang === 'tr'
              ? 'Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme.'
              : 'Request correction of incomplete or inaccurate data.'}
          </li>
          <li>
            {lang === 'tr'
              ? 'KVKK Madde 7 koşulları sağlandığında verilerin silinmesini veya yok edilmesini isteme.'
              : 'Request erasure or destruction of data when KVKK Article 7 conditions are met.'}
          </li>
          <li>
            {lang === 'tr'
              ? 'Düzeltme, silme veya yok etme işlemlerinin verinin aktarıldığı üçüncü taraflara bildirilmesini isteme.'
              : 'Request that correction, erasure, or destruction be notified to third parties to whom the data was transferred.'}
          </li>
          <li>
            {lang === 'tr'
              ? 'Otomatik sistemler aracılığıyla analiz edilmesi sonucu aleyhinize çıkan bir sonuca itiraz etme.'
              : 'Object to outcomes derived from automated processing that disadvantage you.'}
          </li>
          <li>
            {lang === 'tr'
              ? 'Kanuna aykırı işleme nedeniyle zarara uğramanız durumunda zararın giderilmesini talep etme.'
              : 'Claim compensation for damages caused by unlawful processing.'}
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-white pt-fib-5">
          {lang === 'tr' ? 'Veriyi Hangi Amaçla Topluyoruz' : 'Why We Collect Data'}
        </h2>
        <p className="leading-relaxed">
          {lang === 'tr'
            ? 'eCyPro Premium Consulting; iletişim formları, danışmanlık engagement süreçleri, randevu yönetimi ve opt-in pazarlama iletişimi için sınırlı kişisel veri toplar. Açık rızanız olmadan üçüncü taraflara satılmaz veya pazarlama amacıyla paylaşılmaz.'
            : 'eCyPro Premium Consulting collects limited personal data for contact forms, consulting engagement workflows, appointment management, and opt-in marketing communications. Your data is never sold to or shared with third parties for marketing without your explicit consent.'}
        </p>

        <h2 className="text-2xl font-semibold text-white pt-fib-5">
          {lang === 'tr' ? 'Saklama Süresi' : 'Retention Period'}
        </h2>
        <p className="leading-relaxed">
          {lang === 'tr'
            ? 'İletişim ve engagement verileri yasal asgari saklama süresi olan 5 yıl boyunca tutulur. Bu sürenin sonunda otomatik olarak silinir veya anonimleştirilir. Silme talebiniz onaylandıktan sonra verileriniz 30 gün içinde sistemlerimizden kaldırılır.'
            : 'Contact and engagement data are retained for 5 years (the statutory minimum). After this period, data are automatically deleted or anonymized. Once an erasure request is verified, data are removed from our systems within 30 days.'}
        </p>

        <h2 className="text-2xl font-semibold text-white pt-fib-5">
          {lang === 'tr' ? 'Veri İşleyiciler' : 'Data Processors'}
        </h2>
        <p className="leading-relaxed">
          {lang === 'tr'
            ? 'Aşağıdaki üçüncü taraf sağlayıcılar, sözleşmesel KVKK/GDPR garantileri altında verilerinizi işleyebilir:'
            : 'The following third-party processors may handle your data under contractual KVKK/GDPR safeguards:'}
        </p>
        <ul className="list-disc list-inside space-y-fib-3 marker:text-secondary">
          <li>
            <strong className="text-slate-100">Vercel</strong>
            {lang === 'tr'
              ? ' — site hosting ve edge CDN (AB sunucuları).'
              : ' — site hosting and edge CDN (EU regions).'}
          </li>
          <li>
            <strong className="text-slate-100">Render</strong>
            {lang === 'tr' ? ' — backend API barındırma.' : ' — backend API hosting.'}
          </li>
          <li>
            <strong className="text-slate-100">Neon</strong>
            {lang === 'tr' ? ' — yönetilen Postgres veritabanı.' : ' — managed Postgres database.'}
          </li>
          <li>
            <strong className="text-slate-100">EmailJS</strong>
            {lang === 'tr' ? ' — iletişim formu mesaj iletimi.' : ' — contact form message relay.'}
          </li>
          <li>
            <strong className="text-slate-100">Sentry</strong>
            {lang === 'tr'
              ? ' — hata izleme (kişisel veri scrub edilir).'
              : ' — error monitoring (PII scrubbing enabled).'}
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-white pt-fib-5">
          {lang === 'tr' ? 'Başvuru Yanıt Süresi' : 'Response SLA'}
        </h2>
        <p className="leading-relaxed">
          {lang === 'tr'
            ? "Talebinizi aldıktan sonra 24 saat içinde e-posta ile dönüş yaparız. Talep doğrulamasından sonra KVKK'nın öngördüğü en geç 30 gün içinde işlem tamamlanır. Karmaşık talepler için ek süre gerekirse e-posta ile bilgilendirilirsiniz."
            : 'We acknowledge your request by email within 24 hours. After identity verification, the request is completed within the KVKK-mandated maximum of 30 days. If additional time is needed for complex requests, you will be notified by email.'}
        </p>

        <p className="text-xs text-slate-500 italic pt-fib-5 border-t border-white/5">
          {lang === 'tr'
            ? 'Bu sayfa bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz. Sayfadaki bilgiler eCyPro Premium Consulting tarafından özenle hazırlanmış olsa da bağımsız bir avukat onayından geçmemiştir. Hukuki yorum gerektiren konularda lütfen bir avukata danışın.'
            : 'This page is informational and does not constitute legal advice. While prepared with care, the content has not been independently reviewed by counsel. Consult an attorney for matters requiring legal interpretation.'}
        </p>
      </section>

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
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-10000px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
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
          <p id={errorId} role="alert" className="mt-fib-5 text-sm text-red-400">
            {state.message}
          </p>
        )}

        {state.status === 'success' && state.message && (
          <p id={successId} role="status" className="mt-fib-5 text-sm text-emerald-400">
            {state.message}
          </p>
        )}

        <p className="mt-fib-6 text-xs text-slate-400">
          {lang === 'tr'
            ? 'KVKK Madde 11 — bilgi, erişim, düzeltme, silme, kısıtlama, taşınabilirlik ve itiraz hakkı. GDPR Madde 15-17 — Right of Access, Right to Rectification, Right to Erasure.'
            : 'KVKK Article 11 + GDPR Articles 15-17 — Right of Access, Rectification, Erasure, Restriction, Portability, and Objection.'}
        </p>
      </form>

      <p className="mt-fib-7 text-sm text-slate-400">{t('placeholder')}</p>
    </LegalLayout>
  );
};

export default DataRightsPage;
