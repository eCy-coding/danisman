/**
 * P34-T05: Microsoft Clarity — Privacy-safe heatmap + session recording.
 *
 * Consent-gated loader (mirrors ga4-loader.ts pattern):
 *   - `loadClarity(projectId)`: injects Clarity script, idempotent.
 *   - `unloadClarity()`: removes script + clears window.clarity.
 *   - Automatically masks PII fields via `data-clarity-mask` attribute.
 *   - Integrates with AnalyticsProvider consent state.
 *
 * Setup:
 *   1. clarity.microsoft.com → Create project → get Project ID
 *   2. Set .env: VITE_CLARITY_PROJECT_ID=<id>
 *   3. AnalyticsProvider already wires consent → loadClarity is consent-gated.
 *
 * Privacy:
 *   - All <input>, <textarea>, <select> values are automatically masked by Clarity SDK.
 *   - Add data-clarity-mask="True" to any additional sensitive elements.
 *   - Session recording only active when analytics consent = true.
 */

const SCRIPT_DATA_ATTR = 'data-ecypro-clarity';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clarity?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _clarityQueue?: any[][];
  }
}

function findExistingScript(): HTMLScriptElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLScriptElement>(`script[${SCRIPT_DATA_ATTR}]`);
}

export function isClarityLoaded(): boolean {
  return findExistingScript() !== null;
}

export function loadClarity(projectId: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!projectId) return;
  if (findExistingScript()) return;

  // Bootstrap Clarity queue stub (prevents errors before script loads)
  window._clarityQueue = window._clarityQueue ?? [];
  if (!window.clarity) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.clarity = function (...args: any[]) {
      window._clarityQueue?.push(args);
    };
  }

  const script = document.createElement('script');
  script.async = true;
  // P16 — `crossOrigin="anonymous"` opens window.onerror visibility cross-origin.
  script.crossOrigin = 'anonymous';
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
  script.setAttribute(SCRIPT_DATA_ATTR, '');
  script.dataset.projectId = projectId;
  document.head.appendChild(script);
}

export function unloadClarity(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const existing = findExistingScript();
  if (existing) existing.remove();
  window._clarityQueue = [];
  try {
    delete window.clarity;
  } catch {
    window.clarity = undefined as unknown as typeof window.clarity;
  }
}

/**
 * Clarity custom event helper (mirrors GA4 trackEvent semantics).
 * Call after loadClarity — queued automatically if script not yet loaded.
 */
export function claritySend(event: string, value?: string): void {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('event', event, value);
  }
}

/**
 * Convenience: mask a DOM element from Clarity recording.
 * Call programmatically for dynamic sensitive content.
 */
export function maskFromClarity(element: HTMLElement): void {
  element.setAttribute('data-clarity-mask', 'True');
}
