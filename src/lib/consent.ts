/**
 * P13/3 — Consent Management v2 (cookie + GDPR/KVKK).
 *
 * Versioning'in iki amacı var:
 *   1. Politika değişikliklerinden sonra yeniden onay alabilmek (KVKK/GDPR
 *      "specific + informed" şartı — eski rıza yeni amaç için geçerli değil).
 *   2. Schema değiştiğinde (yeni kategori eklediğimizde) eski payload'ı silip
 *      yeniden sorma — banner mantığını basitleştirir.
 *
 * Storage:
 *   - localStorage anahtarı: `ecypro_cookie_consent_v2` (v1 fallback otomatik
 *     migrasyon ile okunur ama yazma her zaman v2'ye).
 *   - `cookie-consent` custom DOM event'i tüm tab'lere yayınlanır.
 *
 * Sentry / GA4 / Clarity init bu modülün `hasConsent('analytics')`'ına bağlı.
 */

export const CONSENT_VERSION = 2;
export const STORAGE_KEY_V2 = 'ecypro_cookie_consent_v2';
export const STORAGE_KEY_V1 = 'ecypro_cookie_consent';

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface ConsentPreferences {
  necessary: true; // always true by definition
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentRecord {
  version: number;
  timestamp: string; // ISO
  preferences: ConsentPreferences;
  source: 'banner_accept_all' | 'banner_custom' | 'banner_reject_all' | 'migrated_v1' | 'updated';
}

export const DEFAULT_PREFERENCES: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

// ── v1 → v2 migration ────────────────────────────────────────────────────────

interface V1Payload {
  timestamp?: string;
  type?: string;
  preferences?: {
    essential?: boolean;
    analytics?: boolean;
    marketing?: boolean;
  };
}

function migrateV1(): ConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as V1Payload;
    const prefs: ConsentPreferences = {
      necessary: true,
      analytics: Boolean(parsed.preferences?.analytics),
      marketing: Boolean(parsed.preferences?.marketing),
    };
    const record: ConsentRecord = {
      version: CONSENT_VERSION,
      timestamp: parsed.timestamp ?? new Date().toISOString(),
      preferences: prefs,
      source: 'migrated_v1',
    };
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(record));
    // Leave v1 key in place — other code may still read it during transition.
    return record;
  } catch {
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawV2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as ConsentRecord;
      if (parsed.version === CONSENT_VERSION) return parsed;
      // Version drift → drop & re-prompt
      window.localStorage.removeItem(STORAGE_KEY_V2);
      return null;
    }
    return migrateV1();
  } catch {
    return null;
  }
}

export function setConsent(
  preferences: Partial<ConsentPreferences>,
  source: ConsentRecord['source'] = 'updated',
): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    preferences: {
      necessary: true,
      analytics: Boolean(preferences.analytics),
      marketing: Boolean(preferences.marketing),
    },
    source,
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent('ecypro:consent-changed', { detail: record }));
  }
  return record;
}

export function hasConsent(category: ConsentCategory): boolean {
  if (category === 'necessary') return true;
  const record = getConsent();
  if (!record) return false;
  return Boolean(record.preferences[category]);
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY_V2);
  window.dispatchEvent(new CustomEvent('ecypro:consent-changed', { detail: null }));
}

/** Convenience: subscribe to consent changes (returns unsubscribe). */
export function onConsentChange(handler: (record: ConsentRecord | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const wrap = (e: Event) =>
    handler((e as CustomEvent<ConsentRecord | null>).detail ?? getConsent());
  const storageHandler = () => handler(getConsent());
  window.addEventListener('ecypro:consent-changed', wrap);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener('ecypro:consent-changed', wrap);
    window.removeEventListener('storage', storageHandler);
  };
}
