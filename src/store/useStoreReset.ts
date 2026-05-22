/**
 * P14 — useStoreReset
 *
 * Defense-in-depth helper that resets every Zustand store with
 * potentially sensitive in-memory data when the user logs out or
 * the session is invalidated.
 *
 * Today the only store carrying auth state is `useAppStore`, but
 * future stores (e.g. admin filters, cached customer data) should
 * register their reset path here so the logout flow stays atomic.
 *
 * Usage:
 *   const resetAll = useStoreReset();
 *   const handleLogout = () => {
 *     useAppStore.getState().logout();
 *     resetAll();
 *   };
 *
 * Also exported as a plain function for non-React call sites:
 *   resetAllStores();
 */

import { useAppStore } from './useAppStore';
import { useDashboardStore } from './useDashboardStore';

/**
 * Run every registered store reset synchronously.
 *
 * Important: `useDashboardStore` carries UI preferences (widget
 * visibility) that are *not* sensitive. We do NOT reset it on logout
 * so user prefs survive a re-login. If a future store carries
 * sensitive cached data, register its reset here.
 */
export function resetAllStores(opts: { keepUiPrefs?: boolean } = {}): void {
  const keepUi = opts.keepUiPrefs ?? true;

  useAppStore.getState().logout();

  if (!keepUi) {
    useDashboardStore.getState().resetLayout();
  }

  // Clear any other namespaced localStorage entries that bypassed Zustand.
  try {
    // Auth-namespaced keys must be wiped to prevent token revival on F5.
    const sensitiveKeys = ['ecypro_admin_token', 'ecypro_admin_refresh'];
    for (const k of sensitiveKeys) {
      try {
        localStorage.removeItem(k);
      } catch {
        /* private mode / quota */
      }
    }
  } catch {
    /* SSR */
  }
}

/**
 * React hook variant — stable reference, safe in effects.
 */
export function useStoreReset(): (opts?: { keepUiPrefs?: boolean }) => void {
  return resetAllStores;
}
