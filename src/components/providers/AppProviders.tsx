import React, { ReactNode } from 'react';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';
import { Toaster } from '../ui/Toast';
import { OfflineStatus } from '../ui/OfflineStatus';
import { I18nProvider } from '../../lib/i18n';
import { AnalyticsProvider } from './AnalyticsProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AnalyticsProvider>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <div className="relative z-10">
              {children}
              <Toaster />
              <OfflineStatus />
            </div>
          </ThemeProvider>
        </AnalyticsProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};
