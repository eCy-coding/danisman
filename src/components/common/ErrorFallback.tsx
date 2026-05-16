import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import type { FallbackProps } from 'react-error-boundary';

export const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-slate-200 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-500/10 rounded-full">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold font-display tracking-tight">System Interrupted</h1>

        <p className="text-slate-400 leading-relaxed">
          The application encountered an unexpected state. Our invisible shield has caught this, but
          we need your help to realign the system.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-white/5 rounded-lg text-left overflow-auto max-h-48 text-xs font-mono text-red-400">
            {message}
          </div>
        )}

        <button type="button"
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:opacity-90 transition-opacity focus:ring-4 focus:ring-white/10"
        >
          <RefreshCw className="w-4 h-4" />
          Realign System
        </button>
      </motion.div>
    </div>
  );
};
