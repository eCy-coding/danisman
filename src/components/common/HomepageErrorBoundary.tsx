/**
 * S13-R12-T1 — Homepage error boundary.
 *
 * LandingPage previously wrapped `LandingContent` in `<Suspense>` but had no
 * `componentDidCatch` shield. If any lazy chunk failed (CDN miss, MIME-type
 * poisoning, JS parse error in a section component), the WHOLE page collapsed
 * to a blank screen with no feedback — the failure mode the React docs
 * warn about most loudly.
 *
 * This boundary catches render-phase errors below the fold and renders a
 * minimal, brand-aligned fallback. The hero (above the fold) is OUTSIDE the
 * boundary so it stays painted no matter what.
 *
 * Telemetry: ships the error to Sentry via `lib/sentry` (lazy import so the
 * boundary itself stays light) and adds a `component=HomepageContent` tag for
 * routing in the dashboard.
 */

import React from 'react';

interface State {
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  /** Optional fallback override; defaults to a centered short notice. */
  fallback?: React.ReactNode;
}

export class HomepageErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Lazy Sentry import so the boundary doesn't pull telemetry into the
    // homepage critical path. If Sentry isn't initialised, captureException
    // is a no-op.
    import('../../lib/sentry')
      .then(({ sentry }) => {
        sentry.captureException(error, {
          tags: { component: 'HomepageErrorBoundary' },
          extra: { componentStack: info.componentStack },
        });
      })
      .catch(() => {
        /* swallow — telemetry failure should never break the fallback */
      });
  }

  handleReset = (): void => {
    this.setState({ error: null });
  };

  override render(): React.ReactNode {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <section
          role="alert"
          className="min-h-[40vh] flex flex-col items-center justify-center px-6 py-24 bg-[#050810] text-slate-200"
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-white">
            Bir aksaklık oluştu
          </h2>
          <p className="max-w-md text-center text-slate-400 mb-6">
            İçerik geçici olarak yüklenemedi. Sayfayı yenilemeyi deneyin; sorun
            devam ederse{' '}
            <a href="/contact" className="underline text-secondary">
              iletişim
            </a>{' '}
            sayfası üzerinden bize ulaşın.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-5 py-2 rounded-full border border-white/15 text-sm font-medium text-white hover:bg-white/5 transition-colors"
          >
            Yeniden dene
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

export default HomepageErrorBoundary;
