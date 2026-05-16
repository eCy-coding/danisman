/**
 * P15 — Network resilience: useOnline hook.
 *
 * `navigator.onLine` + `online`/`offline` event listeners. SSR-safe (window guard).
 *
 * Kullanım:
 *   const online = useOnline();
 *   if (!online) return <OfflineBanner />;
 */

import { useEffect, useState } from 'react';

function readInitialOnline(): boolean {
  if (typeof navigator === 'undefined') return true; // SSR fallback: assume online
  return navigator.onLine;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(readInitialOnline);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onOnline = (): void => setOnline(true);
    const onOffline = (): void => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    // Sync once after mount — navigator.onLine might have changed pre-mount
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return online;
}

export default useOnline;
