/**
 * P15 — Offline banner.
 *
 * Pasif, üstte sticky bar. `navigator.onLine === false` olduğunda görünür.
 * Online'a geçtiğinde otomatik kaybolur (3sn fade-out delay UX için).
 *
 * Mount yeri: App.tsx root, layout dışı (her route'ta görünür).
 */

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOnline } from '../../hooks/useOnline';

export const OfflineBanner: React.FC = () => {
  const { i18n } = useTranslation();
  const online = useOnline();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!online) {
      setVisible(true);
      return undefined;
    }
    // Online döndüğünde 600ms gecikme sonrası kapat (kullanıcı reconnect UX).
    const t = setTimeout(() => setVisible(false), 600);
    return () => clearTimeout(t);
  }, [online]);

  if (!visible) return null;

  const lang = (i18n.language ?? 'tr').split('-')[0];
  const label =
    lang === 'tr'
      ? 'Çevrimdışısınız — bağlantı geri geldiğinde işlemler otomatik tamamlanacak.'
      : "You're offline — actions will resume automatically when the connection returns.";

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-banner"
      className="fixed top-0 inset-x-0 z-[100] bg-amber-600 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-lg"
    >
      <WifiOff size={16} aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

export default OfflineBanner;
