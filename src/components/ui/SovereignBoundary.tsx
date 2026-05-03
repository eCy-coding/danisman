import React, { Component, ErrorInfo, ReactNode } from 'react';
import { matrixAnalytics } from '../../lib/matrix/analytics';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Logger } from '../../lib/logger';

interface Props {
  children: ReactNode;
  name?: string; // Component identifier for logging
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SovereignBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.error(`[Healer] Error caught in ${this.props.name || 'unnamed'}:`, error);
    
    // Log to Matrix
    matrixAnalytics.track({
        type: 'error',
        path: window.location.pathname,
        timestamp: Date.now(),
        target: this.props.name || 'Component',
        metadata: {
            message: error.message,
            stack: errorInfo.componentStack
        }
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Optional: Could trigger a global cache clear if needed
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm shadow-xl min-h-[300px]">
           <AlertTriangle className="w-12 h-12 text-red-500 mb-4 opacity-80" />
           <h3 className="text-xl font-serif text-red-300 mb-2 text-center">
             Bileşen Geçici Olarak Erişilemiyor
           </h3>
           <p className="text-sm text-red-400/70 text-center max-w-md mb-6">
             The Healer protokolü bir anomali tespit etti ve bu bileşeni izole etti. ({this.props.name})
           </p>
           
           <button 
             onClick={this.handleReset}
             className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-lg hover:shadow-red-600/20 active:scale-95 group"
           >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Sistemi Onar
           </button>
        </div>
      );
    }

    return this.props.children;
  }
}
