/**
 * P23/T3 — ErrorState bileşeni.
 *
 * Veri yüklemeyen / hata fırlatan boundary için anlamlı UI. Retry
 * butonu opsiyonel. Sentry opt-in capture.
 *
 *   <ErrorState
 *     title="Bir şeyler ters gitti"
 *     description="Ağ bağlantısını kontrol et"
 *     onRetry={() => refetch()}
 *     captureToSentry={error}
 *   />
 */

import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { sentry } from '../../lib/sentry';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Retry tetikleyici. Verilmezse retry butonu render edilmez. */
  onRetry?: () => void;
  /** Retry button label. Default i18n caller-side. */
  retryLabel?: string;
  /** İkincil aksiyon (örn. "Anasayfa") */
  secondaryAction?: { label: string; onClick?: () => void; href?: string };
  /** Sentry'ye gönderilecek Error nesnesi (opt-in) */
  captureToSentry?: unknown;
  /** İkon — Lucide vb. */
  icon?: React.ReactNode;
  /** Compact varyant */
  variant?: 'default' | 'compact';
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Bir şeyler ters gitti',
  description,
  onRetry,
  retryLabel = 'Tekrar Dene',
  secondaryAction,
  captureToSentry,
  icon,
  variant = 'default',
  className,
}) => {
  useEffect(() => {
    if (captureToSentry === undefined) return;
    try {
      const err =
        captureToSentry instanceof Error
          ? captureToSentry
          : new Error(typeof captureToSentry === 'string' ? captureToSentry : 'ErrorState capture');
      sentry.captureException(err, { source: 'ErrorState' });
    } catch {
      // Sentry kurulmamışsa sessiz geç
    }
  }, [captureToSentry]);

  const padding = variant === 'compact' ? 'p-fib-6' : 'p-fib-9';

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="error-state"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'rounded-2xl border border-red-500/20 bg-red-500/5',
        padding,
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center rounded-2xl bg-red-500/10 text-red-300',
            variant === 'compact' ? 'w-12 h-12 mb-fib-4' : 'w-16 h-16 mb-fib-5',
          )}
        >
          {icon}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center rounded-2xl bg-red-500/10 text-red-300 text-2xl font-bold',
            variant === 'compact' ? 'w-12 h-12 mb-fib-4' : 'w-16 h-16 mb-fib-5',
          )}
        >
          !
        </div>
      )}
      <h3
        className={cn(
          'font-semibold text-white/90',
          variant === 'compact' ? 'text-base' : 'text-golden-lg',
        )}
      >
        {title}
      </h3>
      {description ? (
        <p
          className={cn(
            'mt-fib-3 text-white/60 max-w-md',
            variant === 'compact' ? 'text-sm' : 'text-base',
          )}
        >
          {description}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-fib-4 mt-fib-6">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              'inline-flex items-center justify-center rounded-xl px-fib-6 py-fib-3',
              'text-sm font-semibold transition-transform duration-150',
              'active:scale-[0.98] hover:scale-[1.02] focus:outline-none focus:ring-2',
              'focus:ring-offset-2 focus:ring-offset-[#1E1F20] focus:ring-red-400',
              'bg-red-500 text-white hover:bg-red-400',
            )}
          >
            {retryLabel}
          </button>
        ) : null}
        {secondaryAction ? (
          secondaryAction.href ? (
            <a
              href={secondaryAction.href}
              className={cn(
                'inline-flex items-center justify-center rounded-xl px-fib-6 py-fib-3',
                'text-sm font-semibold border border-white/10 text-white/80',
                'hover:bg-white/5 active:scale-[0.98] hover:scale-[1.02] transition-transform duration-150',
              )}
            >
              {secondaryAction.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={cn(
                'inline-flex items-center justify-center rounded-xl px-fib-6 py-fib-3',
                'text-sm font-semibold border border-white/10 text-white/80',
                'hover:bg-white/5 active:scale-[0.98] hover:scale-[1.02] transition-transform duration-150',
              )}
            >
              {secondaryAction.label}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
};

export default ErrorState;
