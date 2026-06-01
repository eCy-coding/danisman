/**
 * Sprint 8 P43-T02b — canonical notification hook.
 *
 * Sonner toast() çağrıları codebase'te 9+ admin page'e yayılmıştı.
 * Bu hook, form lifecycle + ApiResponse.meta.partialFailures (PR #165)
 * + i18n strings için tek tip-güvenli abstraction katmanı sağlar.
 *
 * NotebookLM Architect spec (Sprint 8, CONVERGENT):
 *   • Path: `src/hooks/useNotify.ts` (mevcut `useNewLeadNotifications`
 *     pattern ile uyumlu, React 19 frontend stack canonical hook
 *     directory).
 *   • Shape: `{ success, error, info, partialFailure, loading }`.
 *     `loading` `toast.promise()` ile async lifecycle (loading → success /
 *     error toast otomatik geçiş).
 *   • `partialFailure(services)` PR #165 `meta.partialFailures` ile
 *     direkt eşleşir — `ApiResponse` consumer kodu zincirleme yazılır.
 *   • i18n strings `common` namespace'te (first-paint registered).
 *   • Toaster `<AppProviders />` zaten mount ediyor (vault drift 18:
 *     Architect "AppProviders.tsx:3" dedi — gerçek path
 *     `src/components/providers/AppProviders.tsx`).
 *
 * Usage:
 *   const notify = useNotify();
 *
 *   try {
 *     const body: ApiResponse<{id:string}> = await api.post(...);
 *     if (body.status === 'ok') {
 *       notify.success(t('contact:submit.success'));
 *       if (body.meta?.partialFailures?.length) {
 *         notify.partialFailure(body.meta.partialFailures);
 *       }
 *     } else {
 *       notify.error(body.message);
 *     }
 *   } catch {
 *     notify.error(t('common:errors.network'));
 *   }
 */
import { useMemo } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface UseNotifyLoadingMessages {
  loading: string;
  success: string;
  error: string;
}

export interface UseNotifyApi {
  /** Success toast (sonner success variant). */
  success(message: string): void;
  /** Error toast (sonner error variant). Pre-translated message. */
  error(message: string): void;
  /** Neutral information toast. */
  info(message: string): void;
  /**
   * Cross-service partial failure signal. Maps to PR #165
   * `ApiResponse.meta.partialFailures`. Services array (e.g.
   * `['NOTION']`) is joined into a single warning toast using the
   * `common:notify.partial_failure` i18n key. Empty arrays are no-ops
   * so consumers can call this unconditionally on every response.
   */
  partialFailure(services: readonly string[]): void;
  /**
   * Wrap an async operation in a toast lifecycle (loading → success /
   * error). Messages are pre-translated; the hook just bridges into
   * `toast.promise()`. Returns the same promise so callers can chain.
   */
  loading<T>(promise: Promise<T>, messages: UseNotifyLoadingMessages): Promise<T>;
}

export function useNotify(): UseNotifyApi {
  const { t } = useTranslation('common');

  return useMemo<UseNotifyApi>(
    () => ({
      success: (message) => {
        toast.success(message);
      },
      error: (message) => {
        toast.error(message);
      },
      info: (message) => {
        toast.info(message);
      },
      partialFailure: (services) => {
        if (!services || services.length === 0) return;
        const serviceList = services.join(', ');
        toast.warning(
          t('notify.partial_failure', {
            services: serviceList,
            defaultValue:
              'Talebiniz alındı, ancak {{services}} ile senkronizasyon gecikmeli. Birazdan tamamlanacak.',
          }),
        );
      },
      loading: (promise, messages) => {
        toast.promise(promise, messages);
        return promise;
      },
    }),
    [t],
  );
}
