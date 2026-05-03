import React, { ErrorInfo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './ErrorFallback';
import { Logger } from '../../lib/logger';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

export const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({ children }) => {
  const logError = (error: Error, info: ErrorInfo) => {
    // In production, this would send to Sentry/LogRocket
    Logger.error('Caught by AppErrorBoundary:', { error, stack: info.componentStack });
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logError}
      onReset={() => {
        // Reset the state of your app so the error doesn't happen again
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
