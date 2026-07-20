/**
 * AP4 — Shared loading / error / empty state primitives for admin pages.
 *
 * A prior audit found ~10 admin pages with no loading state, ~20 with no
 * error handling, ~20 with no empty state — each page had grown its own
 * ad-hoc `isLoading ? … : isError ? … : data.length === 0 ? … : content`
 * ternary (or, more often, just skipped the isError branch entirely). This
 * file does not replace the existing `EmptyState`/`SkeletonList` primitives
 * — it fills the missing "query failed" gap with `ErrorState` and gives
 * pages one wrapper (`AdminQueryState`) to compose all three consistently.
 *
 * Error states always surface the actual failure message (never a silent
 * swallow) and offer a retry callback that re-runs the query.
 */
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { SkeletonList } from './Skeleton';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Extracts a human-readable message from a query error. Handles axios
 * errors (`error.response.data.message` / `.error`), the `adminFetch`
 * thrown-`Error` shape, plain `Error` instances, and raw strings — falls
 * back to a generic Turkish message rather than ever surfacing
 * "[object Object]" or a raw stack trace to an operator.
 */
export function getErrorMessage(error: unknown, fallback = 'Beklenmeyen bir hata oluştu.'): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error.trim() || fallback;

  if (isRecord(error)) {
    const response = error.response;
    if (isRecord(response) && isRecord(response.data)) {
      const msg = response.data.message ?? response.data.error;
      if (typeof msg === 'string' && msg.trim()) return msg;
    }
    const message = error.message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  testId?: string;
}

/**
 * Canonical "the fetch failed" block — icon + message + optional retry
 * button. `role="alert"` so screen readers announce it as soon as it mounts.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Veri yüklenemedi',
  description,
  onRetry,
  retryLabel = 'Yeniden dene',
  testId = 'admin-error-state',
}) => (
  <div
    role="alert"
    data-testid={testId}
    className="flex flex-col items-center justify-center text-center py-16 px-4"
  >
    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
      <AlertTriangle size={24} aria-hidden="true" />
    </div>
    {/* h2 — ErrorState is almost always the direct content section under a
        page's h1 title; h3 here skipped a level on most call sites
        (axe heading-order), mirrors the same fix in EmptyState.tsx. */}
    <h2 className="text-base font-semibold text-white mb-1">{title}</h2>
    {description && <p className="text-sm text-slate-400 max-w-md mb-5">{description}</p>}
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:text-white hover:bg-white/10 text-sm transition-colors"
      >
        <RefreshCw size={14} aria-hidden="true" />
        {retryLabel}
      </button>
    )}
  </div>
);

export interface AdminQueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  loading?: React.ReactNode;
  loadingCount?: number;
  empty?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  children: React.ReactNode;
}

/**
 * Gates a section on query state: loading → skeleton, error → `ErrorState`
 * (+ retry), empty → `EmptyState`, else renders `children`. Pages keep full
 * control of their own layout/data-mapping — this only replaces the
 * repeated branching, not the content.
 */
export const AdminQueryState: React.FC<AdminQueryStateProps> = ({
  isLoading,
  isError,
  error,
  isEmpty = false,
  onRetry,
  loading,
  loadingCount = 6,
  empty,
  emptyTitle = 'Veri yok',
  emptyDescription,
  errorTitle,
  errorDescription,
  children,
}) => {
  if (isLoading) {
    return <>{loading ?? <SkeletonList count={loadingCount} withAvatar={false} />}</>;
  }
  if (isError) {
    return (
      <ErrorState
        title={errorTitle}
        description={errorDescription ?? getErrorMessage(error)}
        onRetry={onRetry}
      />
    );
  }
  if (isEmpty) {
    return <>{empty ?? <EmptyState title={emptyTitle} description={emptyDescription} />}</>;
  }
  return <>{children}</>;
};

export default AdminQueryState;
