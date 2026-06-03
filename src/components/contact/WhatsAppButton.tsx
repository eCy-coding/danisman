/**
 * P52 — WhatsApp deep link floating button.
 *
 * TR business audience'da WhatsApp birincil iletişim. Floating bottom-left
 * (bottom-right SimpleChatWidget tarafından kullanılıyor). Admin route'larında
 * gizlenir. Brand WhatsApp green + subtle outline.
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { CONTACT_CONFIG } from '../../constants';
import { trackCtaClick } from '../../lib/integrations/analytics';

/** WhatsApp brand color */
const WA_GREEN = '#25D366';

export const WhatsAppButton: React.FC = () => {
  const { pathname } = useLocation();

  // Hide on admin + booking management + admin login + verify-email + 404 paths
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/booking/manage') ||
    pathname === '/verify-email' ||
    pathname.startsWith('/feedback/') ||
    pathname === '/404'
  ) {
    return null;
  }

  if (!CONTACT_CONFIG.whatsapp) return null;

  const onClick = () => {
    trackCtaClick('whatsapp-floating', pathname);
  };

  return (
    // region landmark: floating utility widget, outside main content flow
    <div role="complementary" aria-label="WhatsApp iletişim" className="fixed bottom-6 left-6 z-30">
      <a
        href={CONTACT_CONFIG.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        aria-label="WhatsApp ile iletişime geç"
        title="WhatsApp ile iletişime geç"
        className="w-14 h-14 min-w-[44px] min-h-[44px] rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        style={{
          backgroundColor: WA_GREEN,
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)',
        }}
        data-testid="whatsapp-floating-button"
      >
        <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true" fill="white">
          <path d="M16.003 3.2C9.13 3.2 3.557 8.773 3.557 15.647c0 2.198.575 4.347 1.665 6.243L3.2 28.8l7.057-1.957a12.388 12.388 0 0 0 5.743 1.452h.005c6.873 0 12.448-5.573 12.448-12.448 0-3.328-1.296-6.456-3.65-8.81-2.353-2.357-5.481-3.643-8.81-3.643Zm0 22.654a10.35 10.35 0 0 1-5.276-1.446l-.378-.224-3.918 1.087 1.106-3.823-.246-.392a10.31 10.31 0 0 1-1.586-5.51c0-5.703 4.643-10.347 10.347-10.347a10.27 10.27 0 0 1 7.318 3.034 10.27 10.27 0 0 1 3.032 7.32c.001 5.703-4.646 10.301-10.4 10.301Zm5.679-7.755c-.314-.157-1.86-.917-2.148-1.023-.287-.106-.497-.157-.706.157-.21.314-.81 1.023-.992 1.233-.183.21-.366.236-.68.078-.314-.157-1.328-.49-2.53-1.56-.935-.835-1.566-1.864-1.748-2.18-.183-.314-.02-.484.137-.64.14-.14.314-.366.471-.549.157-.183.21-.314.314-.523.105-.21.052-.392-.026-.549-.078-.157-.706-1.703-.967-2.33-.255-.612-.514-.53-.706-.54-.183-.01-.392-.012-.601-.012a1.155 1.155 0 0 0-.836.392c-.288.314-1.097 1.073-1.097 2.617s1.124 3.036 1.281 3.247c.157.21 2.21 3.376 5.358 4.736.749.324 1.333.516 1.788.66.751.239 1.434.205 1.974.124.602-.09 1.86-.76 2.122-1.494.262-.733.262-1.36.183-1.494-.078-.131-.288-.21-.601-.366Z" />
        </svg>
        <span className="sr-only">WhatsApp ile iletişime geç</span>
      </a>
    </div>
  );
};
