import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Critical Application Error:', error, errorInfo);
    // In production, this would send to Sentry/LogRocket
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-[#050810] flex items-center justify-center p-6 font-sans relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-40"></div>
          
          <div className="max-w-xl w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-linear-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-white/10 shadow-glow">
              <AlertCircle className="text-red-400 w-10 h-10" />
            </div>
            
            <h1 className="text-3xl font-serif font-bold text-white mb-4 tracking-tight">
              Hizmet Kesintisi / Service Interruption
            </h1>
            
            <p className="text-gray-400 mb-10 leading-relaxed text-lg font-light">
              Beklenmedik bir durum tespit ettik. Sistemlerimiz güvenliğiniz için otomatik olarak durduruldu.
              <br/>
              <span className="text-sm opacity-70 mt-2 block">We detected an unexpected condition. Systems halted for safety.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="px-8 py-4 bg-linear-to-r from-primary to-primary-dark text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-3 active:scale-95 group"
              >
                <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                Sistemi Yenile
              </button>
              
              <button
                onClick={this.handleReset}
                className="px-8 py-4 bg-white/5 text-gray-300 font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-95 hover:text-white"
              >
                <ArrowLeft size={18} />
                Ana Sayfa
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-12 p-6 bg-black/50 rounded-xl text-left border border-white/5 overflow-hidden">
                <div className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-widest">Error Details (Dev Only)</div>
                <p className="text-red-400 text-sm font-mono break-all leading-relaxed">
                  {this.state.error?.message}
                </p>
              </div>
            )}
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
