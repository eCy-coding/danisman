import React, { useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { createForm } from '../../../lib/forms/createForm';
import {
  dsarRequestSchema,
  DSAR_REQUEST_TYPES,
  DSAR_REQUEST_TYPE_LABELS,
  type DSARRequestFormData,
  type DSARRequestType,
} from '../../../schemas/admin-dsar';

/**
 * P44-T06 — Migrated to centralized `createForm` + `src/schemas/admin-dsar.ts`.
 *
 * Public API preserved:
 *   - onSubmit(data)   — parent owns persistence (react-query mutation)
 *   - loading?: boolean — external loading state (mutation isPending)
 *
 * createForm benefits gained:
 *   - submit-lock + AbortController (kills in-flight on unmount)
 *   - honeypot (`hp_field`) bot trap
 *   - analytics (`trackForm` start/success/error)
 *   - idempotency-key generation (caller can forward to API if needed)
 *   - standardized status state ('idle' | 'submitting' | 'success' | 'error' | 'rate_limited')
 */

interface DSARRequestFormProps {
  /** Parent persistence handler. Called with the validated payload (sans honeypot). */
  onSubmit: (data: Omit<DSARRequestFormData, 'hp_field'>) => void | Promise<void>;
  /** External loading flag (e.g. mutation.isPending). */
  loading?: boolean;
}

// Factory: defined module-scope so React isn't required to re-create per render.
const { useTypedForm } = createForm<DSARRequestFormData>({
  name: 'admin-dsar-request',
  schema: dsarRequestSchema,
  // onSubmit wired at component level (closure over props.onSubmit) — see below.
});

export function DSARRequestForm({ onSubmit, loading = false }: DSARRequestFormProps) {
  const form = useTypedForm();
  const { rhf, submit, reset, status } = form;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = rhf;

  // Reset to idle when parent loading flips back off after a successful submit.
  // This lets the parent control "form done" semantics while the createForm
  // factory still owns the submit-lock + analytics.
  useEffect(() => {
    if (!loading && status === 'success') {
      reset();
    }
  }, [loading, status, reset]);

  const isSubmitting = status === 'submitting' || loading;

  const onValidSubmit = handleSubmit(async (data) => {
    // createForm.submit handles honeypot + analytics + lock; we forward to
    // parent inside its onSubmit hook by passing a thin wrapper through .submit.
    await submit(data as DSARRequestFormData);
    // Honeypot has already returned silently if triggered. For non-honeypot:
    // pass canonical payload (sans hp_field) to parent.
    const hp = (data as { hp_field?: string }).hp_field;
    if (typeof hp === 'string' && hp.trim().length > 0) return;
    const { hp_field: _hp, ...payload } = data;
    await onSubmit(payload);
  });

  const inputClass = cn(
    'w-full rounded-lg border border-white/10 bg-white/5 px-fib-4 py-fib-3',
    'text-sm text-white placeholder-gray-500',
    'focus:outline-none focus:ring-1 focus:ring-blue-500/60',
    'disabled:opacity-50',
  );

  const errorClass = 'text-xs text-red-400 mt-1';

  return (
    <form onSubmit={onValidSubmit} className="flex flex-col gap-fib-5" noValidate>
      <div>
        <label htmlFor="requesterName" className="block text-sm font-medium text-gray-300 mb-1">
          İlgili Kişi Adı <span className="text-red-400">*</span>
        </label>
        <input
          id="requesterName"
          {...register('requesterName')}
          type="text"
          placeholder="Ad Soyad"
          disabled={isSubmitting}
          aria-invalid={errors.requesterName ? 'true' : 'false'}
          aria-describedby={errors.requesterName ? 'requesterName-error' : undefined}
          className={inputClass}
        />
        {errors.requesterName && (
          <p id="requesterName-error" role="alert" className={errorClass}>
            {errors.requesterName.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="requesterEmail" className="block text-sm font-medium text-gray-300 mb-1">
          E-posta <span className="text-red-400">*</span>
        </label>
        <input
          id="requesterEmail"
          {...register('requesterEmail')}
          type="email"
          placeholder="ilgili@ornek.com"
          disabled={isSubmitting}
          aria-invalid={errors.requesterEmail ? 'true' : 'false'}
          aria-describedby={errors.requesterEmail ? 'requesterEmail-error' : undefined}
          className={inputClass}
        />
        {errors.requesterEmail && (
          <p id="requesterEmail-error" role="alert" className={errorClass}>
            {errors.requesterEmail.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="requestType" className="block text-sm font-medium text-gray-300 mb-1">
          Başvuru Türü <span className="text-red-400">*</span>
        </label>
        <select
          id="requestType"
          {...register('requestType')}
          disabled={isSubmitting}
          aria-invalid={errors.requestType ? 'true' : 'false'}
          aria-describedby={errors.requestType ? 'requestType-error' : undefined}
          className={cn(inputClass, 'cursor-pointer')}
        >
          <option value="" className="bg-gray-900">
            Seçiniz...
          </option>
          {DSAR_REQUEST_TYPES.map((type: DSARRequestType) => (
            <option key={type} value={type} className="bg-gray-900">
              {DSAR_REQUEST_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {errors.requestType && (
          <p id="requestType-error" role="alert" className={errorClass}>
            {errors.requestType.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
          Açıklama
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          placeholder="Başvuru detayları..."
          disabled={isSubmitting}
          aria-invalid={errors.description ? 'true' : 'false'}
          className={cn(inputClass, 'resize-y')}
        />
        {errors.description && (
          <p id="description-error" role="alert" className={errorClass}>
            {errors.description.message}
          </p>
        )}
      </div>

      {/*
        P15 — Honeypot: bot trap. Off-screen + aria-hidden. Real users tab past.
        Bots fill it → createForm `submit` returns silent success without
        invoking parent.onSubmit (see honeypot guard above).
      */}
      <input
        {...register('hp_field')}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          opacity: 0,
        }}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'rounded-lg px-fib-5 py-fib-3 text-sm font-medium',
          'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white',
          'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {isSubmitting ? 'Kaydediliyor…' : 'Başvuruyu Kaydet'}
      </button>
    </form>
  );
}
