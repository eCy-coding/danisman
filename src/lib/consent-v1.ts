// KVKK m.5 + GDPR Art.7 — açık rıza alınmadan analytics/marketing yüklenmez.
// "functional" kategorisi: kullanıcı tercihleri (örn. UI hatırlama) — default false.
// Schema v1: değişiklik olursa CONSENT_VERSION artır → rıza yeniden alınır.

export const CONSENT_STORAGE_KEY = 'ecypro_consent_v1';
export const CONSENT_VERSION = 1;

export interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export interface ConsentRecord extends ConsentPreferences {
  timestamp: string;
  version: number;
}

export const DEFAULT_PREFS: ConsentPreferences = {
  analytics: false,
  marketing: false,
  functional: false,
};

export function readConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      functional: Boolean(parsed.functional),
      timestamp: parsed.timestamp ?? new Date().toISOString(),
      version: CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

export function writeConsent(prefs: ConsentPreferences): ConsentRecord {
  const record: ConsentRecord = {
    ...prefs,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      window.dispatchEvent(new CustomEvent('ecypro:consent-changed', { detail: record }));
    } catch {
      /* localStorage unavailable — silently degrade */
    }
  }
  return record;
}
