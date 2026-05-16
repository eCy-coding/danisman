/**
 * P21/T1 — Save-Data Network Information API hook.
 *
 * `navigator.connection.saveData = true` kullanıcının cihaz / tarayıcı
 * seviyesinde "Data Saver" modunu açtığı anlamına gelir (Android Chrome
 * "Lite mode", iOS "Low Data Mode"). Bu bayrağı saygıyla karşılamak:
 *
 *   - Görsel kalitesini düşür (JPEG q60 vs q80)
 *   - Video auto-play kapat
 *   - Yüksek çözünürlüklü font subset'ini atla
 *   - Dekoratif animation kapat
 *
 * Network Information API hâlâ deneysel; Safari'de yok. Fallback:
 * `effectiveType` 2g/3g ise yine "data-saving" davran.
 *
 * Hook tek bir boolean döner — ek `effectiveType` / `downlink` lazımsa
 * `useNetworkInfo()` yardımcısına bak.
 *
 * **Bağlamsal not:** P15 Resource Hints + P17 art direction zaten DPR-
 * aware. Save-Data bunun üstüne bir tasarruf "kapağı": kullanıcı isteyince
 * kaliteyi düşür.
 */

import { useEffect, useState } from 'react';

interface NetworkConnection {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (event: 'change', listener: () => void) => void;
  removeEventListener?: (event: 'change', listener: () => void) => void;
}

function getConnection(): NetworkConnection | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & { connection?: NetworkConnection };
  return nav.connection ?? null;
}

/**
 * Saf hesap — runtime'da bayrağı oku. SSR-safe (false döner).
 *
 * Karar matrisi:
 *   - `saveData === true`         → true
 *   - `effectiveType` ∈ {slow-2g, 2g}  → true (Save-Data implied)
 *   - aksi halde                  → false
 */
export function isDataSaverActive(): boolean {
  const c = getConnection();
  if (!c) return false;
  if (c.saveData === true) return true;
  const t = c.effectiveType;
  if (t === 'slow-2g' || t === '2g') return true;
  return false;
}

export interface NetworkInfo {
  saveData: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
}

export function readNetworkInfo(): NetworkInfo {
  const c = getConnection();
  return {
    saveData: isDataSaverActive(),
    effectiveType: c?.effectiveType ?? null,
    downlink: c?.downlink ?? null,
    rtt: c?.rtt ?? null,
  };
}

/**
 * React hook — `connection.change` event'ine subscribe olur, kullanıcı
 * tethering/wifi geçişi yaptığında bileşeni re-render eder.
 */
export function useSaveData(): boolean {
  const [active, setActive] = useState<boolean>(() => isDataSaverActive());

  useEffect(() => {
    const c = getConnection();
    if (!c || !c.addEventListener) return;

    const onChange = (): void => {
      setActive(isDataSaverActive());
    };
    c.addEventListener('change', onChange);
    // Initial sync — bazı tarayıcılarda ilk render sonrası saveData değişebilir
    setActive(isDataSaverActive());

    return () => {
      c.removeEventListener?.('change', onChange);
    };
  }, []);

  return active;
}

/**
 * Çok-alanlı varyant — bandwidth-bilinçli bileşen yazımı için.
 */
export function useNetworkInfo(): NetworkInfo {
  const [info, setInfo] = useState<NetworkInfo>(() => readNetworkInfo());

  useEffect(() => {
    const c = getConnection();
    if (!c || !c.addEventListener) return;

    const onChange = (): void => setInfo(readNetworkInfo());
    c.addEventListener('change', onChange);
    setInfo(readNetworkInfo());
    return () => {
      c.removeEventListener?.('change', onChange);
    };
  }, []);

  return info;
}
