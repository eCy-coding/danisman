import React, { useEffect, useState } from 'react';
import posthog from 'posthog-js';

const STORAGE_KEY = 'posthog_consent';

type ConsentValue = 'granted' | 'denied' | null;

function readConsent(): ConsentValue {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

function writeConsent(v: 'granted' | 'denied') {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    // localStorage may be unavailable (privacy mode); silently degrade
  }
}

export const ConsentBanner: React.FC = () => {
  const [decision, setDecision] = useState<ConsentValue>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    setDecision(stored);
    setHydrated(true);
    if (stored === 'granted') {
      try {
        posthog.opt_in_capturing();
      } catch {
        // posthog may not be initialized in dev (no env key) — that's fine
      }
    }
  }, []);

  if (!hydrated || decision !== null) return null;

  const accept = () => {
    writeConsent('granted');
    setDecision('granted');
    try {
      posthog.opt_in_capturing();
    } catch {
      // intentional no-op
    }
  };

  const reject = () => {
    writeConsent('denied');
    setDecision('denied');
    try {
      posthog.opt_out_capturing();
    } catch {
      // intentional no-op
    }
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Çerez ve analitik tercihleri"
      data-testid="consent-banner"
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 9998,
        maxWidth: 720,
        margin: '0 auto',
        background: '#1E1F20',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: '16px 20px',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fontSize: 14,
        lineHeight: 1.55,
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      }}
    >
      <p style={{ margin: '0 0 12px' }}>
        Sitemizi geliştirmek için anonim kullanım analitiği topluyoruz (PostHog, AB sunucusu). KVKK
        m. 5/1 uyarınca açık rızanız olmadan analitik çerez yüklenmez. Detay:{' '}
        <a href="/privacy" style={{ color: '#d4af37', textDecoration: 'underline' }}>
          Gizlilik Politikası
        </a>
        .
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={accept}
          data-testid="consent-accept"
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Analitik için izin ver
        </button>
        <button
          type="button"
          onClick={reject}
          data-testid="consent-reject"
          style={{
            background: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Reddet
        </button>
      </div>
    </div>
  );
};

export default ConsentBanner;
