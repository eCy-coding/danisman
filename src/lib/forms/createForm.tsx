/**
 * P15 — Form Unification Factory
 *
 * Tüm form'ların tek standart altında birleştirilmesi:
 *
 *   • zod schema validation (RHF resolver)
 *   • submit-lock (AbortController + double-submit guard + mountedRef)
 *   • i18n error key forwarding (zod messages = i18n key path)
 *   • honeypot field (`hp_field` — bot trap)
 *   • Idempotency-Key header (crypto.randomUUID, retry-safe)
 *   • Analytics (`trackForm` start/success/error)
 *   • Standardized error UI (role=alert + ARIA describedby)
 *
 * Kullanım:
 *
 *   const { useTypedForm } = createForm({
 *     name: 'contact',
 *     schema: contactSchema,
 *     endpoint: '/api/contact',
 *   });
 *
 *   function ContactPage() {
 *     const { register, handleSubmit, status, errors } = useTypedForm();
 *     ...
 *   }
 *
 * Geri dönüş şekli `useForm` ile uyumlu — drop-in replacement.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useForm,
  type FieldValues,
  type UseFormReturn,
  type DefaultValues,
  type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { Logger } from '../logger';
import { trackForm } from '../analytics';
// P16 — install global zod i18n error map as side-effect; idempotent.
import { installZodI18n } from './zod-error-map';

installZodI18n();

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error' | 'rate_limited';

export interface FormHookState<TData extends FieldValues> {
  status: FormStatus;
  errorMessage: string | null;
  successMessage: string | null;
  submit: (data: TData) => Promise<void>;
  reset: () => void;
  rhf: UseFormReturn<TData>;
  idempotencyKey: string;
}

export interface CreateFormOptions<TData extends FieldValues> {
  /** Analytics name + i18n namespace prefix. Örn: "contact", "data-rights:export". */
  name: string;
  /** Zod schema. Mesajlar i18n key path olmalı (örn: "contact.form.required"). */
  schema: ZodType<TData>;
  /** POST endpoint. Boşsa `submit` çağrıldığında onSubmit callback'ı bekler. */
  endpoint?: string;
  /** Custom default values. */
  defaultValues?: DefaultValues<TData>;
  /** Manuel submit handler (endpoint yerine). */
  onSubmit?: (data: TData, ctx: { idempotencyKey: string; signal: AbortSignal }) => Promise<void>;
  /** Extra headers (CSRF token wire-up vs.). */
  headers?: () => Record<string, string>;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * createForm — typed factory.
 *
 * Returns `useTypedForm` hook + the underlying schema/name (faydalı: test seam, devtools).
 */
export function createForm<TData extends FieldValues>(opts: CreateFormOptions<TData>) {
  type FormData = TData;

  function useTypedForm(): FormHookState<FormData> {
    // zodResolver tip jenerikleri react-hook-form FieldValues ile dar uyum
    // gerektiriyor; runtime tamamen güvenli — sadece compile-time variance.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolver = zodResolver(opts.schema as any) as Resolver<FormData>;
    const rhf = useForm<FormData>({
      resolver,
      defaultValues: opts.defaultValues,
    });

    const [status, setStatus] = useState<FormStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // submit-lock: AbortController önceki in-flight'ı iptal eder
    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);
    const idempotencyKey = useMemo(newIdempotencyKey, []);

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        abortRef.current?.abort();
      };
    }, []);

    const reset = useCallback(() => {
      setStatus('idle');
      setErrorMessage(null);
      setSuccessMessage(null);
      rhf.reset();
    }, [rhf]);

    const submit = useCallback(
      async (data: FormData) => {
        // Honeypot — `hp_field` sessizce reddet, başarı taklit et.
        const hp = (data as Record<string, unknown>)['hp_field'];
        if (typeof hp === 'string' && hp.trim().length > 0) {
          Logger.warn(`[form:${opts.name}] honeypot triggered`);
          setStatus('success');
          setSuccessMessage(null);
          return;
        }

        if (status === 'submitting') return; // submit-lock

        // Önceki submit'i abort et
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setStatus('submitting');
        setErrorMessage(null);
        setSuccessMessage(null);
        trackForm(opts.name, 'start');

        try {
          if (opts.onSubmit) {
            await opts.onSubmit(data, { idempotencyKey, signal: ac.signal });
            if (!mountedRef.current || ac.signal.aborted) return;
            setStatus('success');
            trackForm(opts.name, 'submit_success');
            return;
          }

          if (!opts.endpoint) {
            throw new Error('createForm: endpoint veya onSubmit zorunlu');
          }

          const baseHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          };
          const extraHeaders = opts.headers?.() ?? {};
          const res = await fetch(opts.endpoint, {
            method: 'POST',
            headers: { ...baseHeaders, ...extraHeaders },
            body: JSON.stringify(data),
            signal: ac.signal,
          });

          const body = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            code?: string;
            message?: string;
          };

          if (!mountedRef.current || ac.signal.aborted) return;

          if (res.ok && body.ok !== false) {
            setStatus('success');
            setSuccessMessage(body.message ?? null);
            trackForm(opts.name, 'submit_success');
            return;
          }

          if (res.status === 429 || body.code === 'RATE_LIMITED') {
            setStatus('rate_limited');
            setErrorMessage(body.message ?? null);
            trackForm(opts.name, 'submit_error', { reason: 'rate_limited' });
            return;
          }

          setStatus('error');
          setErrorMessage(body.message ?? null);
          trackForm(opts.name, 'submit_error', { reason: body.code ?? 'unknown' });
        } catch (err) {
          if ((err as { name?: string } | null)?.name === 'AbortError') return;
          if (!mountedRef.current) return;
          Logger.warn(`[form:${opts.name}] submit failed`, err as Error);
          setStatus('error');
          setErrorMessage(null);
          trackForm(opts.name, 'submit_error', { reason: 'network' });
        }
      },
      [idempotencyKey, status],
    );

    return {
      status,
      errorMessage,
      successMessage,
      submit,
      reset,
      rhf,
      idempotencyKey,
    };
  }

  return {
    useTypedForm,
    schema: opts.schema,
    name: opts.name,
  };
}
