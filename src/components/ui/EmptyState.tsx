/**
 * P23/T3 — EmptyState bileşeni.
 *
 * Boş veri için anlamlı UI. CTA opsiyonel, ikon opsiyonel, i18n hazır.
 *
 *   <EmptyState
 *     icon={<Inbox />}
 *     title="Henüz blog yazısı yok"
 *     description="İlk yazıyı oluşturmak için aşağıdaki butonu kullan."
 *     action={{ label: 'Yeni Yazı', onClick: handleCreate }}
 *   />
 *
 * SEO: "noResults" varyantı arama sayfası için kullanılır → caller route'ta
 * `<meta name="robots" content="noindex,follow">` yerleştirir (soft-404 yerine
 * filtre değişikliğinde indexlenir).
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
}

export interface EmptyStateProps {
  /** İkon node — Lucide veya custom SVG. Boyut 48×48 önerilir. */
  icon?: React.ReactNode;
  /** Başlık — kısa, fiil-tabanlı ("Henüz yazı yok") */
  title: string;
  /** Açıklayıcı paragraf — bir cümle */
  description?: string;
  /** Birincil CTA */
  action?: EmptyStateAction;
  /** İkincil aksiyon (örn. "Filtreleri temizle") */
  secondaryAction?: EmptyStateAction;
  /** Compact varyant — yan panel/dialog içinde */
  variant?: 'default' | 'compact';
  className?: string;
}

const ActionButton: React.FC<{ action: EmptyStateAction; primary: boolean }> = ({
  action,
  primary,
}) => {
  const base = cn(
    'inline-flex items-center justify-center rounded-xl px-fib-6 py-fib-3',
    'text-sm font-semibold transition-transform duration-150',
    'active:scale-[0.98] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E1F20] focus:ring-blue-500',
    primary
      ? 'bg-blue-500 text-white hover:bg-blue-400'
      : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/8',
  );
  if (action.href) {
    return (
      <a className={base} href={action.href} aria-label={action.ariaLabel ?? action.label}>
        {action.label}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={base}
      onClick={action.onClick}
      aria-label={action.ariaLabel ?? action.label}
    >
      {action.label}
    </button>
  );
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className,
}) => {
  const padding = variant === 'compact' ? 'p-fib-6' : 'p-fib-9';
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'rounded-2xl border border-white/8 bg-[#1E1F20]',
        padding,
        className,
      )}
      data-testid="empty-state"
    >
      {icon ? (
        <div
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center rounded-2xl bg-white/5',
            variant === 'compact' ? 'w-12 h-12 mb-fib-4' : 'w-16 h-16 mb-fib-5',
          )}
        >
          {icon}
        </div>
      ) : null}
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
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-fib-4 mt-fib-6">
          {action ? <ActionButton action={action} primary /> : null}
          {secondaryAction ? <ActionButton action={secondaryAction} primary={false} /> : null}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
