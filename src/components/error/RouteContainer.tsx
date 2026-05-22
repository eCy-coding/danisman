/**
 * P14 — RouteContainer
 *
 * Composition helper that bundles the two boundaries every lazy-loaded
 * route should have:
 *
 *   <Suspense fallback={...}>          ← code-split loader gap
 *   <RouteErrorBoundary>               ← per-route crash recovery
 *
 * Usage in App.tsx:
 *
 *   <Route
 *     path="/pricing"
 *     element={
 *       <RouteContainer name="PricingPage" fallback={<LoadingFallback />}>
 *         <PricingPage />
 *       </RouteContainer>
 *     }
 *   />
 *
 * Why a wrapper instead of inline composition:
 *   - Single import for the standard pattern
 *   - Future tweaks (Sentry tracing span, retry analytics, etc.) live here
 *   - Reduces App.tsx churn during P15 route-by-route migration
 */

import React, { Suspense } from 'react';
import { RouteErrorBoundary } from './RouteErrorBoundary';

interface Props {
  /** Sentry tag for this route — defaults to "unknown-route". */
  name?: string;
  /** Suspense fallback. Defaults to an invisible placeholder so layout doesn't shift. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const DEFAULT_FALLBACK = (
  <div aria-hidden="true" style={{ minHeight: '40vh' }} data-testid="route-suspense-fallback" />
);

export const RouteContainer: React.FC<Props> = ({
  name,
  fallback = DEFAULT_FALLBACK,
  children,
}) => {
  return (
    <RouteErrorBoundary routeName={name}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </RouteErrorBoundary>
  );
};
