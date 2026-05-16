import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Logger } from '@/lib/logger';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.error('Uncaught error', error, { componentStack: errorInfo.componentStack });
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <main
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-neutral flex items-center justify-center p-4"
        >
          <section
            aria-labelledby="global-error-title"
            className="max-w-md w-full bg-surface border border-white/10 rounded-2xl p-8 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 w-8 h-8" aria-hidden="true" />
            </div>

            <h1 id="global-error-title" className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-6 text-sm">
              We encountered an unexpected error. Our team has been notified.
            </p>

            <div className="bg-black/20 rounded-lg p-4 mb-6 text-left overflow-hidden">
              <p className="font-mono text-xs text-red-300 break-all">
                {this.state.error?.message || 'Unknown Error'}
              </p>
            </div>

            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw size={18} aria-hidden="true" />
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
              >
                Reload
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
