import React, { ReactNode, Suspense, lazy } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';
import { Toaster } from '../ui/Toast';
import { OfflineStatus } from '../ui/OfflineStatus';
import { I18nProvider } from '../../lib/i18n';
import { AnalyticsProvider } from './AnalyticsProvider';
import { GrowthBookProvider } from './GrowthBookProvider';
import { queryClient } from '../../lib/query-client';

/**
 * Dev-only ReactQueryDevtools. Lazy-imported so:
 *   - production bundles never include the panel,
 *   - dev installs WITHOUT the optional package still boot (the lazy
 *     import resolves to a no-op fallback component).
 *
 * Install on the host:  npm i -D @tanstack/react-query-devtools
 */
type DevtoolsProps = { initialIsOpen?: boolean; buttonPosition?: string };
const ReactQueryDevtools: React.LazyExoticComponent<React.ComponentType<DevtoolsProps>> | null =
  import.meta.env.DEV
    ? lazy(async () => {
        try {
          // Optional dependency — install on the host with
          //   npm i -D @tanstack/react-query-devtools
          // `@vite-ignore` suppresses the build-time warning when the package
          // is genuinely absent (sandbox / minimal dev installs).
          // Use a string variable so TypeScript / Vite skip static
          // resolution; we want the import to be a pure runtime probe.
          const specifier = '@tanstack/react-query-devtools';
          const mod = (await import(/* @vite-ignore */ specifier)) as {
            ReactQueryDevtools: React.ComponentType<DevtoolsProps>;
          };
          return { default: mod.ReactQueryDevtools };
        } catch {
          return { default: () => null };
        }
      })
    : null;

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
      {ReactQueryDevtools ? (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  );
};
