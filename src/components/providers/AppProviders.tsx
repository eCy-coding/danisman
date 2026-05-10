import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';
import { Toaster } from '../ui/Toast';
import { OfflineStatus } from '../ui/OfflineStatus';
import { I18nProvider } from '../../lib/i18n';
import { AnalyticsProvider } from './AnalyticsProvider';
import { GrowthBookProvider } from './GrowthBookProvider';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <I18nProvider>
          <GrowthBookProvider>
            <AnalyticsProvider>
              <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                <div className="relative z-10">
                  {children}
                  <Toaster />
                  <OfflineStatus />
                </div>
              </ThemeProvider>
            </AnalyticsProvider>
          </GrowthBookProvider>
        </I18nProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};
