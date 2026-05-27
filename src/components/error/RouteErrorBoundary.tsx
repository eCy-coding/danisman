/**
 * P14 — RouteErrorBoundary
 *
 * Per-route React error boundary used to wrap lazy-loaded pages and
 * isolated UI subtrees. Renders a recovery UX with two actions:
 *
 *   (1) "Tekrar dene / Try again" — resets the boundary and re-renders the route
 *   (2) "Anasayfa / Home"          — hard navigates to /
 *
 * a11y:
 *   - role="alert" + aria-live="assertive" so screen readers announce
 *   - focus is moved to the heading on mount of the fallback
 *   - both buttons have descriptive labels and visible focus rings
 *
 * Observability:
 *   - sentry.captureException with route + componentStack tags
 *   - Logger fallback when Sentry is disabled
 *
 * Difference from existing GlobalErrorBoundary:
 *   - GlobalErrorBoundary is mounted once at the app root for catastrophic
 *     failures (whole tree crashed).
 *   - RouteErrorBoundary is mounted around individual routes / sections and
 *     supports recovery without a full page reload.
 */

import React, { Component, ErrorInfo, ReactNode, createRef } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Logger } from '@/lib/logger';
import { sentry } from '@/lib/sentry';

interface Props {
  /** Children to protect with this boundary. */
  children: ReactNode;
  /** Route or named section (e.g. "PricingPage"). Used as Sentry tag. */
  routeName?: string;
  /**
   * Optional override for the fallback UI. Receives an `onRetry` callback.
   * If omitted, the default a11y-aware fallback is used.
   */
  fallback?: (args: { error: Error; onRetry: () => void }) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  public override state: State = { hasError: false, error: null };

  private headingRef = createRef<HTMLHeadingElement>();

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo) {
    const route = this.props.routeName ?? 'unknown-route';
    Logger.error(`[RouteErrorBoundary:${route}]`, error, {
      componentStack: info.componentStack,
    });
    try {
      sentry.captureException(error, {
        route,
        componentStack: info.componentStack ?? null,
        boundary: 'RouteErrorBoundary',
      });
    } catch {
      /* sentry not initialised — Logger already covers it */
    }
  }

  public override componentDidUpdate(_: Props, prevState: State) {
    // When the error UI first appears, move focus to the heading
    // so screen readers announce it immediately.
    if (this.state.hasError && !prevState.hasError) {
      // Microtask so the DOM has rendered the heading.
      queueMicrotask(() => this.headingRef.current?.focus());
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = (): void => {
    // Hard nav keeps the boundary clean — the new route mounts a fresh subtree.
    window.location.href = '/';
  };

  public override render() {
    if (!this.state.hasError) return this.props.children;

    const err = this.state.error ?? new Error('Unknown render error');

    if (this.props.fallback) {
      return this.props.fallback({ error: err, onRetry: this.handleRetry });
    }

    return (
      <section
        role="alert"
        aria-live="assertive"
        aria-labelledby="route-error-title"
        className="min-h-[60vh] flex items-center justify-center px-fib-6 py-fib-7"
      >
        <div className="max-w-xl w-full bg-surface-2 border border-white/10 rounded-2xl p-fib-7 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-fib-5">
            <AlertTriangle className="text-red-400 w-8 h-8" aria-hidden="true" />
          </div>

          <h2
            id="route-error-title"
            ref={this.headingRef}
            tabIndex={-1}
            className="text-golden-lg font-semibold text-white mb-fib-3 focus:outline-none"
          >
            Bu bölümde bir sorun oluştu
          </h2>

          <p className="text-slate-400 text-golden-base mb-fib-5">
            Sayfayı yenilemeden tekrar deneyebilir veya anasayfaya dönebilirsiniz. Hata teknik
            ekibimize iletildi.
            <span className="block text-sm text-slate-500 mt-fib-2">
              An error occurred in this section. You can retry or return to the home page.
            </span>
          </p>

          {import.meta.env.DEV && (
            <pre
              className="text-left text-xs font-mono text-red-300 bg-black/30 rounded-md p-fib-3 mb-fib-5 overflow-auto max-h-40"
              aria-label="Hata ayrıntıları (development)"
            >
              {err.message}
            </pre>
          )}

          <div className="flex flex-col sm:flex-row gap-fib-3 justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-fib-2 px-fib-5 py-fib-3 bg-secondary text-neutral rounded-lg font-medium hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-secondary/60 focus:ring-offset-2 focus:ring-offset-surface-2 active:scale-95 transition-all"
              aria-label="Bu bölümü yeniden yükle"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Tekrar dene
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center justify-center gap-fib-2 px-fib-5 py-fib-3 bg-white/5 text-slate-200 rounded-lg font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-surface-2 active:scale-95 transition-all border border-white/10"
              aria-label="Anasayfaya dön"
            >
              <Home size={16} aria-hidden="true" />
              Anasayfa
            </button>
          </div>
        </div>
      </section>
    );
  }
}
